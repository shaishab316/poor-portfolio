"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  useAnimations,
  Environment,
} from "@react-three/drei";
import { useRef, useEffect, Suspense, useState } from "react";
import * as THREE from "three";

function useDeviceCapabilities() {
  const [isCapable, setIsCapable] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Device capability check
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    const cores = navigator.hardwareConcurrency || 1;
    const memory = navigator.deviceMemory || 4;

    const capable = !isMobile && cores >= 4 && memory >= 4;
    setIsCapable(capable);

    // Intersection observer for visibility
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    const element = document.querySelector(".hero-canvas");
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { isCapable, isVisible };
}

function AutoCenteredModel() {
  const group = useRef();
  const { scene, animations } = useGLTF("/models/shaishab.glb");
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    if (scene && group.current) {
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());

      scene.position.copy(center).multiplyScalar(-1);
      group.current.position.set(0, -1, 0);
    }

    if (actions) {
      Object.values(actions).forEach((action) => {
        if (action) {
          action.timeScale = 0.5;
          action.play();
        }
      });
    }
  }, [scene, actions]);

  useFrame((_, delta) => {
    if (actions) {
      Object.values(actions).forEach((action) => {
        if (action?._mixer) {
          action._mixer.update(delta);
        }
      });
    }
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export default function HeroSection() {
  const { isCapable, isVisible } = useDeviceCapabilities();
  const shouldLoadModel = isCapable && isVisible;

  return (
    <div className="hero-canvas absolute inset-0">
      <Canvas
        camera={{
          position: [0, 0, 2],
          fov: 75,
        }}
        className="absolute inset-0"
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 2, 1]} intensity={1} />
        <pointLight position={[0, 2, 2]} intensity={0.3} />

        <Suspense fallback={null}>
          {shouldLoadModel && <AutoCenteredModel />}
          <Environment preset="sunset" />
        </Suspense>

        <OrbitControls enableZoom={true} />
      </Canvas>
    </div>
  );
}

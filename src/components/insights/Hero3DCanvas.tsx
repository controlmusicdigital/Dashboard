"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GeminiNanoState } from "@/hooks/useGeminiNano";

const STATE_COLOR: Record<GeminiNanoState, THREE.Color> = {
  idle: new THREE.Color("#22d3ee"), // electric cyan
  thinking: new THREE.Color("#e879f9"), // glowing magenta
  responding: new THREE.Color("#f0abfc"),
};

function fibonacciSpherePositions(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    positions[i * 3] = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return positions;
}

function ParticleSphere({ aiState, particleCount }: { aiState: GeminiNanoState; particleCount: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const positions = useMemo(() => fibonacciSpherePositions(particleCount, 1.8), [particleCount]);
  const targetColor = useRef(new THREE.Color("#22d3ee"));

  useFrame((frameState, delta) => {
    if (!pointsRef.current || !materialRef.current) return;
    const speed = aiState === "idle" ? 0.06 : aiState === "thinking" ? 0.22 : 0.34;
    pointsRef.current.rotation.y += delta * speed;
    pointsRef.current.rotation.x = Math.sin(frameState.clock.elapsedTime * 0.15) * 0.15;

    const pulse = aiState === "idle" ? 1 : 1 + Math.sin(frameState.clock.elapsedTime * (aiState === "thinking" ? 6 : 10)) * 0.06;
    pointsRef.current.scale.setScalar(pulse);

    targetColor.current.lerp(STATE_COLOR[aiState], delta * 3);
    materialRef.current.color.copy(targetColor.current);
    materialRef.current.size = aiState === "idle" ? 0.022 : 0.03;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color="#22d3ee"
        size={0.022}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function GlowRing({ aiState }: { aiState: GeminiNanoState }) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((frameState, delta) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z += delta * (aiState === "idle" ? 0.03 : 0.12);
    const material = ringRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = aiState === "idle" ? 0.18 : 0.32;
  });
  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2.4, 0, 0]}>
      <ringGeometry args={[2.1, 2.16, 96]} />
      <meshBasicMaterial color="#f0abfc" transparent opacity={0.18} side={THREE.DoubleSide} />
    </mesh>
  );
}

function PointerParallax({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((frameState) => {
    if (!groupRef.current) return;
    const { x, y } = frameState.pointer;
    groupRef.current.rotation.y += (x * 0.35 - groupRef.current.rotation.y) * 0.04;
    groupRef.current.rotation.x += (-y * 0.25 - groupRef.current.rotation.x) * 0.04;
  });
  return <group ref={groupRef}>{children}</group>;
}

export function Hero3DCanvas({ aiState }: { aiState: GeminiNanoState }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [particleCount, setParticleCount] = useState(1200);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only APIs, unavailable during SSR
    setReducedMotion(motionQuery.matches);
    // Fewer particles on narrow viewports to keep this smooth on phones.
    setParticleCount(window.innerWidth < 640 ? 500 : 1200);
  }, []);

  if (reducedMotion) {
    return (
      <div
        aria-hidden
        className="h-full w-full rounded-3xl"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(34,211,238,0.25), rgba(232,121,249,0.12) 55%, transparent 75%)",
        }}
      />
    );
  }

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "none" }}
    >
      <ambientLight intensity={0.4} />
      <PointerParallax>
        <ParticleSphere aiState={aiState} particleCount={particleCount} />
        <GlowRing aiState={aiState} />
      </PointerParallax>
    </Canvas>
  );
}

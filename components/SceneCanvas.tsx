"use client";

import { Canvas } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  Preload,
  Stats,
  AdaptiveDpr,
} from "@react-three/drei";
import { Suspense } from "react";
import { ACESFilmicToneMapping } from "three";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import HorrorCorridor from "@/components/HorrorCorridor";
import FPSControls from "@/components/FPSControls";
import Flashlight from "@/components/Flashlight";
import Effects from "@/components/Effects";

export default function SceneCanvas({
  isTouch,
  flashOn,
  onPointerLockChange,
}: {
  isTouch: boolean;
  flashOn: boolean;
  onPointerLockChange?: (locked: boolean) => void;
}) {
  return (
    <Canvas
      id="r3f-canvas"
      shadows={!isTouch}
      dpr={[1, isTouch ? 1.5 : 2]}
      gl={{
        antialias: !isTouch,
        powerPreference: "high-performance",
        stencil: false,
        alpha: false,
        precision: isTouch ? "mediump" : "highp",
      }}
      camera={{ position: [0, 1.6, 5], fov: 70 }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
    >
      <color attach="background" args={["#000"]} />
      <fog attach="fog" args={["#0a0a0a", 5, 35]} />

      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]} debug={!isTouch}>
          <Environment
            preset="night"
            background={false}
            environmentIntensity={0.7}
          />

          <HorrorCorridor position={[2, -0.005, 2]} rotation={[0, 0, 0]} />

          {/* Ground */}
          <RigidBody type="fixed" colliders={false}>
            <mesh
              position={[0, 0, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[50, 50]} />
              <meshStandardMaterial color="#fff" />
            </mesh>
            <CuboidCollider args={[25, 0.1, 25]} position={[0, -0.5, 0]} />
          </RigidBody>

          {!isTouch && (
            <ContactShadows
              position={[0, -0.49, 0]}
              opacity={0.4}
              scale={30}
              blur={3}
              far={15}
            />
          )}

          <FPSControls
            speed={1.8}
            eyeHeight={3.35}
            capsuleHeight={1.85}
            capsuleRadius={0.25}
            onLockChange={onPointerLockChange}
          />

          {flashOn && <Flashlight />}
        </Physics>

        <Effects isTouch={isTouch} />
        {isTouch && <AdaptiveDpr pixelated />}

        {!isTouch && <Stats className="stats-top-right" />}

        <Preload all />
      </Suspense>
    </Canvas>
  );
}

"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  SoftShadows,
  Preload,
  Stats,
} from "@react-three/drei";
import { useRef } from "react";
import { ACESFilmicToneMapping, type Mesh } from "three";
import FPSControls from "@/components/FPSControls";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import HorrorCorridor from "@/components/HorrorCorridor";
import Flashlight from "@/components/Flashlight";
import MobileControls from "@/components/MobileControls";
import { useEffect, useState } from "react";
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  HueSaturation,
  Noise,
  SSAO,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import Preloader from "@/components/Preloader";
import { Suspense } from "react";
import { BlendFunction, ToneMappingMode } from "postprocessing";

function useIsTouch() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const isTouch =
      "ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0;
    setTouch(isTouch);
  }, []);
  return touch;
}

export default function Home() {
  const isTouch = useIsTouch();
  const [flashOn, setFlashOn] = useState(false);
  return (
    <div className="fixed inset-0 h-[100dvh] w-full select-none touch-none">
      {/* Hint overlay */}
      {!isTouch && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10 grid place-items-center text-xs text-white/80">
          <p>Click the canvas to lock pointer · WASD to move · Esc to unlock</p>
        </div>
      )}
      {isTouch && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10 grid place-items-center text-xs text-white/80">
          <p>Use left joystick to move · drag right to look</p>
        </div>
      )}

      <Canvas
        id="r3f-canvas"
        shadows
        gl={{}}
        camera={{ position: [0, 1.6, 5], fov: 70 }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        <color attach="background" args={["#000"]} />
        <fog attach="fog" args={["#0a0a0a", 5, 35]} />

        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            <Environment
              preset="night"
              background={false}
              environmentIntensity={0.7}
            />

            <HorrorCorridor
              position={[2, -0.005, 2]}
              rotation={[0, 0, 0]}
              scale={[0.35, 0.35, 0.35]}
            />

            {/* Ground as a fixed rigid body with a collider */}
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
            <ContactShadows
              position={[0, -0.49, 0]}
              opacity={0.4}
              scale={30}
              blur={3}
              far={15}
            />

            {/* Player character controller (capsule) */}
            <FPSControls
              speed={0.8}
              eyeHeight={1.85}
              capsuleHeight={1.0}
              capsuleRadius={0.3}
            />

            {/* Head-mounted flashlight that follows the camera */}
            {flashOn && <Flashlight />}
          </Physics>

          <EffectComposer enableNormalPass>
            <HueSaturation saturation={-0.3} />

            <Vignette eskil={false} offset={0.3} darkness={0.6} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />

            <Noise opacity={0.3} blendFunction={BlendFunction.SOFT_LIGHT} />

            <ChromaticAberration offset={[0.001, 0.001]} />
            <DepthOfField
              focusDistance={0.02}
              focalLength={0.03}
              bokehScale={2}
            />

            {/* <Bloom luminanceThreshold={1.2} intensity={1.2} mipmapBlur /> */}
          </EffectComposer>

          {/* Performance panel for debug (top-right) */}
          <Stats className="stats-top-right" />

          <Preload all />
        </Suspense>
      </Canvas>
      <Preloader />
      {isTouch && (
        <MobileControls onToggleFlashlight={() => setFlashOn((v) => !v)} />
      )}
      {/* Crosshair */}
      <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
        <div className="h-3 w-3 rounded-full border border-white/60" />
      </div>
    </div>
  );
}

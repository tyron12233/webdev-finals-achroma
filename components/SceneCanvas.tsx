"use client";

import { Canvas } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  Preload,
  Stats,
  AdaptiveDpr,
} from "@react-three/drei";
import { Suspense, useEffect } from "react";
import { ACESFilmicToneMapping } from "three";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import HorrorCorridor from "@/components/HorrorCorridor";
import FPSControls from "@/components/FPSControls";
import Flashlight from "@/components/Flashlight";
import Effects from "@/components/Effects";
import SoundProvider from "@/components/audio/SoundProvider";
import { useSound } from "@/components/audio/useSound";
import RadioNarration from "@/components/RadioNarration";

export default function SceneCanvas({
  isTouch,
  flashOn,
  started = false,
  onPointerLockChange,
}: {
  isTouch: boolean;
  flashOn: boolean;
  started?: boolean;
  onPointerLockChange?: (locked: boolean) => void;
}) {
  // Access sound inside Canvas to resume on pointer lock and trigger SFX
  // Note: useSound must be used within SoundProvider, so we read it in a nested helper component below.
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
        <SoundProvider>
          <SoundBridge onPointerLockChange={onPointerLockChange} />
          {started && <RadioNarration />}
          <Physics gravity={[0, -9.81, 0]} debug={!isTouch}>
            <Environment
              preset="night"
              background={false}
              environmentIntensity={0.7}
            />

            <HorrorCorridor position={[0, 0, 0]} rotation={[0, 0, 0]} />

            {/* Ground */}
            <RigidBody type="fixed" colliders={false}>
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
              speed={0.9}
              eyeHeight={3.35}
              capsuleHeight={1.85}
              capsuleRadius={0.25}
              onLockChange={(locked) => {
                // Also resume audio on lock
                window.dispatchEvent(
                  new CustomEvent("__pointerlock_change__", {
                    detail: { locked },
                  })
                );
              }}
              onFootstep={(foot) => {
                // Dispatch footstep event; SoundBridge will handle to keep hook usage inside provider
                window.dispatchEvent(
                  new CustomEvent("__footstep__", { detail: { foot } })
                );
              }}
            />

            {flashOn && <Flashlight />}
          </Physics>
        </SoundProvider>

        <Effects isTouch={isTouch} />
        {isTouch && <AdaptiveDpr pixelated />}

        <Stats className="stats-top-right" />

        <Preload all />
      </Suspense>
    </Canvas>
  );
}

// Small internal bridge component to access useSound inside the provider scope
function SoundBridge({
  onPointerLockChange,
}: {
  onPointerLockChange?: (locked: boolean) => void;
}) {
  const { sound, resume } = useSound();

  // Relay pointer lock changes from FPSControls to page and resume audio
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { locked: boolean };
      if (detail?.locked) {
        resume();
      }
      onPointerLockChange?.(!!detail?.locked);
    };
    window.addEventListener("__pointerlock_change__", handler as EventListener);
    return () =>
      window.removeEventListener(
        "__pointerlock_change__",
        handler as EventListener
      );
  }, [resume, onPointerLockChange]);

  // Handle footstep events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { foot: "left" | "right" };
      sound.playFootstep(detail?.foot ?? "any");
    };
    window.addEventListener("__footstep__", handler as EventListener);
    return () =>
      window.removeEventListener("__footstep__", handler as EventListener);
  }, [sound]);

  return null;
}

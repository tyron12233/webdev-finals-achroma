"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { SpotLight, Object3D } from "three";
import { Vector3 } from "three";
import * as THREE from "three";

/**
 * Flashlight
 * A spotlight that follows the camera position and direction,
 * with optional subtle flicker for a horror vibe.
 */
export default function Flashlight({
  color = "#fff9e6",
  intensity = 8,
  distance = 18,
  angle = Math.PI / 10,
  penumbra = 0.45,
  castShadow = true,
  flicker = true,
}: {
  color?: string;
  intensity?: number;
  distance?: number;
  angle?: number;
  penumbra?: number;
  castShadow?: boolean;
  flicker?: boolean;
}) {
  const { camera } = useThree();
  const lightRef = useRef<SpotLight>(null);
  const targetRef = useRef<Object3D>(null);
  const dir = useMemo(() => new Vector3(), []);
  const t = useRef(0);

  // Attach the target object after both refs are ready to avoid null target errors
  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
    }
  }, []);

  useFrame((_, delta) => {
    const light = lightRef.current;
    const target = targetRef.current;
    if (!light || !target) return;

    // Follow camera position and aim where the camera looks
    light.position.copy(camera.position);
    camera.getWorldDirection(dir);
    target.position.copy(camera.position).addScaledVector(dir, 2.0);

    // Subtle flicker: low-amplitude layered sines with occasional dips
    if (flicker) {
      t.current += delta;
      const base = intensity;
      const wave = 1 + 0.025 * Math.sin(t.current * 14.3) + 0.02 * Math.sin(t.current * 7.6 + 1.2);
      // Rare micro-dip
      const dip = (Math.sin(t.current * 0.7) > 0.995) ? 0.85 : 1.0;
      light.intensity = base * wave * dip;
    } else {
      light.intensity = intensity;
    }
  });

  return (
    <>
      {/* The target must be part of the scene graph */}
      <object3D ref={targetRef} />
      <spotLight
        ref={lightRef}
        color={color}
        distance={distance}
        angle={angle}
        penumbra={penumbra}
        castShadow={castShadow}
        // shadow quality
        shadow-bias={-0.0005}
        shadow-mapSize={[1024, 1024]}
      />
    </>
  );
}

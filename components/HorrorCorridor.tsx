"use client";

import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import type { Object3D } from "three";

/**
 * HorrorCorridor
 * Renders the GLB model placed in public/horror_corridor_4.glb.
 *
 * Notes:
 * - Adjust `position`, `rotation`, and `scale` via props where needed.
 * - Shadows are enabled on all mesh children for better visuals.
 * - For physics/collisions, consider adding simplified Rapier colliders later.
 */
export default function HorrorCorridor(
  props: ThreeElements["group"] & { url?: string }
) {
  const url = props.url ?? "/optimized/scene-2.glb";
  const gltf = useGLTF(url);

  useLayoutEffect(() => {
    gltf.scene.traverse((obj: Object3D) => {
      // Enable shadows on meshes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyObj = obj as any;
      if (anyObj.isMesh) {
        anyObj.castShadow = true;
        anyObj.receiveShadow = true;
      }
    });
  }, [gltf.scene]);

  // Wrap in a group so users can position/scale the model externally via props
  const { url: _ignoreUrl, ...rest } = props as any;
  return (
    <group {...rest}>
      <primitive object={gltf.scene} />
    </group>
  );
}

// Preload the model for snappier first render
useGLTF.preload("/optimized/scene-2.glb");

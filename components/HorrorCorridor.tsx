"use client";

import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useState } from "react";
import type { Group, Object3D } from "three";
import { RigidBody } from "@react-three/rapier";

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
  const url = props.url ?? "/optimized/scene-5.glb";
  const gltf = useGLTF(url);

  // Find the walls object (named "murs") once the GLTF is loaded
  const childrenWall = useMemo(() => {
    if (!gltf.scene) return null;
    // Ensure world matrices are up-to-date before searching
    gltf.scene.updateMatrixWorld(true);
    const found = gltf.scene.getObjectByName("WallGroup") as Object3D | null;
    if (found) {
      const colliderMesh = found.clone();

      setTimeout(() => {
        found.visible = false;
        colliderMesh.visible = false;
      }, 1000);

      return colliderMesh;
    }
    return null;
  }, [gltf.scene]);

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
    <group>
      {/* Visuals */}
      <primitive object={gltf.scene} {...rest} />

      {childrenWall && (
        <RigidBody type="fixed" colliders="trimesh" friction={0} {...rest}>
          <primitive
            object={childrenWall}
            rotation={[Math.PI / -180, 0, 0]}
            onUpdate={(self: any) => self.layers.disable(0)}
          />
        </RigidBody>
      )}
    </group>
  );
}

// Prevoad the model for snappier first render
useGLTF.preload("/optimized/scene-5.glb");

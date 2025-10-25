"use client";

import { useMemo } from "react";
import { Effect } from "postprocessing";
import { Matrix3, Uniform } from "three";

export type ColorBlindMode = "none" | "protanopia" | "deuteranopia" | "tritanopia";

function matrixFor(mode: ColorBlindMode): Matrix3 | null {
  // Matrices adapted from Brettel et al. approximations
  // Each is a 3x3 matrix applied to linear RGB
  switch (mode) {
    case "protanopia":
      return new Matrix3().set(
        0.56667, 0.43333, 0.0,
        0.55833, 0.44167, 0.0,
        0.0,     0.24167, 0.75833
      );
    case "deuteranopia":
      return new Matrix3().set(
        0.625, 0.375, 0.0,
        0.70,  0.30,  0.0,
        0.0,   0.30,  0.70
      );
    case "tritanopia":
      return new Matrix3().set(
        0.95,  0.05,  0.0,
        0.0,   0.43333, 0.56667,
        0.0,   0.475,   0.525
      );
    default:
      return null;
  }
}

// Minimal fragment shader applying a color matrix and blending with original
const fragmentShader = /* glsl */ `
  uniform mat3 uMatrix;
  uniform float uIntensity;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec4 color = inputColor;
    // Apply only if intensity > 0
    if (uIntensity > 0.0001) {
      vec3 transformed = uMatrix * color.rgb;
      color.rgb = mix(color.rgb, transformed, clamp(uIntensity, 0.0, 1.0));
    }
    outputColor = color;
  }
`;

export function ColorBlindnessEffect({
  mode,
  intensity = 1,
}: {
  mode: ColorBlindMode;
  intensity?: number; // 0..1 blend
}) {
  const effect = useMemo(() => {
    const mat = matrixFor(mode) ?? new Matrix3().identity();
    const e = new Effect("ColorBlindness", fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ["uMatrix", new Uniform(mat)],
        ["uIntensity", new Uniform(mode === "none" ? 0 : intensity)],
      ]),
    });
    return e;
  }, [mode, intensity]);

  // React-three-postprocessing accepts primitive Effect instances
  return mode === "none" ? null : <primitive object={effect} />;
}

"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";

export type BobDebugData = {
  phase: number;
  intensity: number;
  stepHz: number;
  verticalBobAmplitude: number;
  lateralBobAmplitude: number;
};

export function BobDebugOverlay({
  show,
  width = 260,
  height = 120,
  dataRef,
}: {
  show: boolean;
  width?: number;
  height?: number;
  dataRef: React.RefObject<BobDebugData>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useFrame(() => {
    if (!show) return;
    const data = dataRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!data || !canvas || !ctx) return;

    const { phase, intensity, stepHz, verticalBobAmplitude, lateralBobAmplitude } = data;

    const W = canvas.width;
    const H = canvas.height;
    const margin = 6;
    const w = W - margin * 2;
    const h = H - margin * 2;
    const cx = margin;
    const cy = margin + h / 2;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Grid and markers
    ctx.strokeStyle = "#ffffff22";
    ctx.lineWidth = 1;
    ctx.beginPath();
    // zero line
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + w, cy);
    // step markers at 0 and pi
    const x0 = cx + (0 / (Math.PI * 2)) * w;
    const xPi = cx + (Math.PI / (Math.PI * 2)) * w;
    ctx.moveTo(x0, cy - h / 2);
    ctx.lineTo(x0, cy + h / 2);
    ctx.moveTo(xPi, cy - h / 2);
    ctx.lineTo(xPi, cy + h / 2);
    ctx.stroke();

    // Use base amplitudes for curve scaling so shapes don't collapse when not moving
    const vAmpBase = Math.max(0.0001, Math.abs(verticalBobAmplitude));
    const lAmpBase = Math.max(0.0001, Math.abs(lateralBobAmplitude));
    const maxAmp = Math.max(vAmpBase, lAmpBase);
    const yScale = (h * 0.45) / maxAmp;

    const samples = 128;

    // Vertical curve (blue) using base amplitude
    ctx.strokeStyle = "#4FC3F7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const tphi = (i / samples) * Math.PI * 2;
      const y = Math.sin(tphi * 2) * vAmpBase * yScale;
      const x = cx + (i / samples) * w;
      if (i === 0) ctx.moveTo(x, cy - y);
      else ctx.lineTo(x, cy - y);
    }
    ctx.stroke();

    // Lateral curve (green) using base amplitude
    ctx.strokeStyle = "#81C784";
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const tphi = (i / samples) * Math.PI * 2;
      const y = Math.sin(tphi) * lAmpBase * yScale;
      const x = cx + (i / samples) * w;
      if (i === 0) ctx.moveTo(x, cy - y);
      else ctx.lineTo(x, cy - y);
    }
    ctx.stroke();

    // Current phase markers (use intensity on markers only)
    const xPhase = cx + (phase / (Math.PI * 2)) * w;
    const yV = cy - Math.sin(phase * 2) * vAmpBase * intensity * yScale;
    ctx.fillStyle = "#4FC3F7";
    ctx.beginPath();
    ctx.arc(xPhase, yV, 3, 0, Math.PI * 2);
    ctx.fill();

    const yL = cy - Math.sin(phase) * lAmpBase * intensity * yScale;
    ctx.fillStyle = "#81C784";
    ctx.beginPath();
    ctx.arc(xPhase, yL, 3, 0, Math.PI * 2);
    ctx.fill();

    // Labels
    ctx.fillStyle = "#ffffffaa";
    ctx.font = "10px sans-serif";
    ctx.fillText(`phase ${phase.toFixed(2)} rad`, cx + 6, margin + 12);
    ctx.fillText(`hz ${stepHz.toFixed(2)}  int ${intensity.toFixed(2)}`, cx + 6, margin + 24);
  });

  if (!show) return null;

  return (
    <Html transform={false} prepend>
      <div
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          padding: 6,
          background: "#00000066",
          border: "1px solid #ffffff22",
          borderRadius: 6,
          pointerEvents: "none",
          backdropFilter: "blur(2px)",
        }}
      >
        <canvas ref={canvasRef} width={width} height={height} style={{ display: "block" }} />
        <div style={{ color: "#fff", fontSize: 10, marginTop: 4, textAlign: "center" }}>
          vertical (blue) · lateral (green)
        </div>
      </div>
    </Html>
  );
}

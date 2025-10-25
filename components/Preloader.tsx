"use client";

import { useEffect, useMemo, useState } from "react";
import { useProgress } from "@react-three/drei";

type ColorBlindMode = "none" | "protanopia" | "deuteranopia" | "tritanopia";

export default function Preloader() {
  const { progress, active, loaded, total } = useProgress();
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);
  const [mode, setMode] = useState<ColorBlindMode>("none");

  // When loading completes, fade out then unmount
  useEffect(() => {
    const done = !active && (progress >= 100 || (loaded > 0 && loaded >= total));
    if (done && visible && !fade) {
      setFade(true);
      const timer = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(timer);
    }
  }, [active, progress, loaded, total, visible, fade]);

  const pct = useMemo(() => Math.min(100, Math.max(0, Math.round(progress))), [progress]);

  // Automatically cycle color-vision modes to create a title-screen effect
  useEffect(() => {
    if (!visible) return;
    let timer: number | undefined;
    const tick = () => {
      setMode((prev) => {
        switch (prev) {
          case "none":
            return "protanopia";
          case "protanopia":
            return "deuteranopia";
          case "deuteranopia":
            return "tritanopia";
          case "tritanopia":
          default:
            return "none";
        }
      });
      const delay = 1200 + Math.random() * 1800; // 1.2s - 3s
      timer = window.setTimeout(tick, delay);
    };
    // Kick off shortly after mount
    timer = window.setTimeout(tick, 600);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [visible]);

  // Pre-generate random placements for whisper overlays
  const whispers = useMemo(() => {
    const phrases = [
      "they see you",
      "keep moving",
      "don’t look back",
      "it’s behind you",
      "stay quiet",
      "shadows whisper",
      "run",
      "hide",
    ];
    return Array.from({ length: 7 }).map((_, i) => ({
      text: phrases[i % phrases.length],
      top: 10 + Math.random() * 70, // percentage
      left: 5 + Math.random() * 90, // percentage
      dur: 2500 + Math.random() * 2500, // ms
      delay: Math.random() * 2200, // ms
      scale: 0.9 + Math.random() * 0.3,
      rot: -2 + Math.random() * 4,
    }));
  }, []);
  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 grid place-items-center overflow-hidden ${
        fade ? "opacity-0 transition-opacity duration-300" : "opacity-100"
      }`}
      aria-live="polite"
    >
      {/* Background: deep black base */}
      <div className="absolute inset-0 bg-black" />

      {/* Vignette for a tunnel look */}
      <div className="pointer-events-none absolute inset-0" style={{
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.6) 85%, rgba(0,0,0,0.9) 100%)",
      }} />

      {/* Film grain / noise (CSS-only, throttled for mobile) */}
      <div className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-40 motion-safe:animate-[noise_1200ms_steps(8)_infinite]" style={{
        backgroundImage:
          "url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'128\\' height=\\'128\\'><filter id=\\'n\\'><feTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.9\\' numOctaves=\\'1\\' stitchTiles=\\'stitch\\'/></filter><rect width=\\'100%\\' height=\\'100%\\' filter=\\'url(%23n)\\'/></svg>')",
        backgroundSize: "128px 128px",
      }} />

      {/* Subtle red pulse wash */}
      <div className="pointer-events-none absolute inset-0 opacity-20 motion-safe:animate-[pulseWash_2.8s_ease-in-out_infinite]" style={{
        background:
          "radial-gradient(1200px 600px at 50% 60%, rgba(220,20,60,0.3), transparent 70%)",
      }} />

      {/* Content (wrapped in color-vision filter) */}
      <div
        className="relative z-10 mx-auto w-[min(520px,88vw)] select-none p-6 text-center"
        style={{ filter: mode === "none" ? undefined : `url(#cb-${mode})` }}
      >
        {/* Title with flicker/glitch effect */}
        <div className="relative mb-5">
          <h1 className="text-[9vw] leading-none sm:text-5xl font-semibold tracking-[0.25em] text-white/90 motion-safe:animate-[flicker_3.2s_infinite]">
            ACHROMA
          </h1>
          {/* red/blue ghost layers for glitch */}
          <div className="pointer-events-none absolute inset-0 -z-10 blur-[1px] mix-blend-screen opacity-25 motion-safe:animate-[glitchShift_2.6s_infinite]" style={{ color: "#ff1a1a" }}>
            <h1 className="text-[9vw] leading-none sm:text-5xl font-semibold tracking-[0.25em]">ACHROMA</h1>
          </div>
          <div className="pointer-events-none absolute inset-0 -z-10 blur-[1px] mix-blend-screen opacity-20 motion-safe:animate-[glitchShift_2.2s_-0.6s_infinite]" style={{ color: "#1ac6ff" }}>
            <h1 className="text-[9vw] leading-none sm:text-5xl font-semibold tracking-[0.25em]">ACHROMA</h1>
          </div>
        </div>

        {/* Progress bar - chunky, mobile-friendly */}
        <div className="mx-auto w-full max-w-[520px]">
          <div className="relative h-3 rounded-full bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]">
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-[#2a0b0b] via-[#3a0e0e] to-[#4a1111] shadow-[0_0_8px_1px_rgba(180,0,0,0.18)] opacity-90 motion-safe:animate-[flow_2.2s_linear_infinite]"
              style={{ width: `${pct}%` }}
            />
            {/* subtle top highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] rounded-full bg-white/15 opacity-25" />
            {/* faint inner edge to blend with vignette */}
            <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/30" />
          </div>
          <div className="mt-3 text-sm sm:text-xs tracking-widest text-white/70">
            {pct}%
          </div>
        </div>

        {/* Mobile hint */}
        <div className="mt-6 text-xs sm:text-[11px] text-white/50">
          Best with headphones · Dark room recommended
        </div>
      </div>

      {/* Whisper overlays (hallucinatory text) */}
      {whispers.map((w, i) => (
        <div
          key={i}
          className="pointer-events-none absolute z-0 text-[10px] sm:text-xs font-medium tracking-[0.35em] text-white/20 motion-safe:animate-[whisper_3s_ease-in-out_infinite]"
          style={{
            top: `${w.top}%`,
            left: `${w.left}%`,
            transform: `translate(-50%, -50%) scale(${w.scale}) rotate(${w.rot}deg)`,
            animationDuration: `${w.dur}ms`,
            animationDelay: `${w.delay}ms`,
            whiteSpace: "nowrap",
            filter: "blur(0.2px)",
          }}
        >
          {w.text}
        </div>
      ))}

      {/* Hidden SVG filters for color-vision simulation */}
      <svg className="absolute -z-10 h-0 w-0" aria-hidden>
        <defs>
          {/* Protanopia */}
          <filter id="cb-protanopia">
            <feColorMatrix type="matrix" values="0.56667 0.43333 0 0 0  0.55833 0.44167 0 0 0  0 0.24167 0.75833 0 0  0 0 0 1 0" />
          </filter>
          {/* Deuteranopia */}
          <filter id="cb-deuteranopia">
            <feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.70 0.30 0 0 0  0 0.30 0.70 0 0  0 0 0 1 0" />
          </filter>
          {/* Tritanopia */}
          <filter id="cb-tritanopia">
            <feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.43333 0.56667 0 0  0 0.475 0.525 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>

      {/* Component-scoped styles */}
      <style>{`
        @keyframes flicker {
          0%, 19%, 21%, 23%, 80%, 81%, 100% { opacity: 0.95; }
          20% { opacity: 0.55; }
          22% { opacity: 0.75; }
          82% { opacity: 0.7; }
        }
        @keyframes glitchShift {
          0%   { transform: translate(0, 0); }
          20%  { transform: translate(0.6px, -0.8px); }
          40%  { transform: translate(-0.8px, 0.5px); }
          60%  { transform: translate(0.4px, 0.6px); }
          80%  { transform: translate(-0.6px, -0.4px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes noise {
          0%   { transform: translate(0, 0); }
          10%  { transform: translate(-3%, -2%); }
          20%  { transform: translate(2%, -3%); }
          30%  { transform: translate(-1%, 2%); }
          40%  { transform: translate(3%, 1%); }
          50%  { transform: translate(-2%, -1%); }
          60%  { transform: translate(1%, 3%); }
          70%  { transform: translate(-3%, 2%); }
          80%  { transform: translate(2%, -2%); }
          90%  { transform: translate(-1%, 1%); }
          100% { transform: translate(0, 0); }
        }
        @keyframes flow {
          0%   { filter: brightness(1) saturate(1); }
          50%  { filter: brightness(1.15) saturate(1.2); }
          100% { filter: brightness(1) saturate(1); }
        }
        @keyframes pulseWash {
          0%, 100% { opacity: 0.15; }
          50%      { opacity: 0.35; }
        }
        @keyframes whisper {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(1) }
          10% { opacity: 0.28 }
          50% { opacity: 0.14; transform: translate(calc(-50% + 2px), calc(-50% - 1px)) scale(1.01) }
          90% { opacity: 0.28 }
          100% { opacity: 0 }
        }
        /* Reduced motion: tone down the heavy animations */
        @media (prefers-reduced-motion: reduce) {
          .motion-safe\\:animate-[noise_1200ms_steps(8)_infinite],
          .motion-safe\\:animate-[glitchShift_2.6s_infinite],
          .motion-safe\\:animate-[glitchShift_2.2s_-0.6s_infinite],
          .motion-safe\\:animate-[flow_2.2s_linear_infinite],
          .motion-safe\\:animate-[pulseWash_2.8s_ease-in-out_infinite],
          .motion-safe\\:animate-[flicker_3.2s_infinite] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useProgress } from "@react-three/drei";

export default function TitleScreen({
  started,
  onStart,
}: {
  started: boolean;
  onStart: () => void;
}) {
  const { active, progress, loaded, total } = useProgress();
  const [visible, setVisible] = useState(false);
  const [fade, setFade] = useState(false);

  const done = useMemo(
    () => !active && (progress >= 100 || (loaded > 0 && loaded >= total)),
    [active, progress, loaded, total]
  );

  // Show when loading done and not yet started
  useEffect(() => {
    if (done && !started) setVisible(true);
  }, [done, started]);

  // Hide on start with a small fade
  useEffect(() => {
    if (started && visible) {
      setFade(true);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [started, visible]);

  if (!visible) return null;

  const handleStart = () => {
    // Attempt pointer lock on desktop to jump straight in
    const isTouch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0);
    if (!isTouch) {
      const el = document.getElementById("r3f-canvas") as any;
      el?.requestPointerLock?.();
    }
    onStart();
  };

  return (
    <div
      className={`fixed inset-0 z-[70] grid place-items-center bg-black/80 backdrop-blur-[1px] ${
        fade ? "opacity-0 transition-opacity duration-200" : "opacity-100"
      }`}
    >
      <div className="relative mx-auto w-[min(620px,90vw)] select-none p-6 text-center text-white">
        <h1 className="mb-3 text-[10vw] leading-none sm:text-6xl font-semibold tracking-[0.25em] text-white/95">
          ACHROMA
        </h1>
        <p className="mx-auto mb-8 max-w-[52ch] text-sm text-white/70">
          A short, atmospheric walking experience. Headphones recommended.
        </p>

        <button
          onClick={handleStart}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-6 py-3 text-base font-medium tracking-widest text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          Start Game
        </button>

        <div className="mt-6 text-xs text-white/50">
          WASD to move · Mouse to look · Esc to unlock
        </div>
      </div>
    </div>
  );
}

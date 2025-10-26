"use client";

import MobileControls from "@/components/MobileControls";
import TouchDebug from "@/components/TouchDebug";
import { useState } from "react";
import Preloader from "@/components/Preloader";
import useIsTouch from "@/hooks/useIsTouch";
import useViewportVH from "@/hooks/useViewportVH";
import SceneCanvas from "@/components/SceneCanvas";
import PointerLockOverlay from "@/components/PointerLockOverlay";
import RadioSubtitleOverlay from "@/components/RadioSubtitleOverlay";
import TitleScreen from "@/components/TitleScreen";

export default function Home() {
  const isTouch = useIsTouch();
  const [flashOn, setFlashOn] = useState(false);
  const [started, setStarted] = useState(false);
  const [locked, setLocked] = useState(false);
  // Keep viewport height synced to visible area
  useViewportVH();

  return (
    <div
      className="fixed inset-0 w-full select-none touch-none"
      style={{ height: "calc(var(--vh, 1vh) * 100)" }}
    >
      {/* Hint overlay */}
      {started && !isTouch && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10 grid place-items-center text-xs text-white/80">
          <p>Click the canvas to lock pointer · WASD to move · Esc to unlock</p>
        </div>
      )}
      {started && isTouch && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10 grid place-items-center text-xs text-white/80">
          <p>Use left joystick to move · drag anywhere to look</p>
        </div>
      )}

      <SceneCanvas
        isTouch={isTouch}
        flashOn={flashOn}
        started={started}
        onPointerLockChange={(v) => {
          console.log("[page.tsx] pointer lock change:", v);
          setLocked(v);
        }}
      />
      <Preloader />
      {/* Radio narration subtitles (screen-space UI, outside Canvas) */}
      {started && <RadioSubtitleOverlay />}
      {/* Title / Start overlay after preload */}
      <TitleScreen started={started} onStart={() => setStarted(true)} />
      {isTouch && started && (
        <MobileControls onToggleFlashlight={() => setFlashOn((v) => !v)} />
      )}
      {isTouch && started && <TouchDebug />}
      {/* Fallback: clickable overlay to force pointer lock on desktop if PLC fails */}
      <PointerLockOverlay visible={started && !isTouch && !locked} />
      {/* Crosshair */}
      {started && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <div className="h-3 w-3 rounded-full border border-white/60" />
        </div>
      )}
    </div>
  );
}

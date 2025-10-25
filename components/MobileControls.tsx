"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addLookDelta, setMoveAxes, setTouchMode } from "./inputStore";

type Props = {
  onToggleFlashlight?: () => void;
};

// Utility: detect touch-capable device once on mount
function useIsTouch(): boolean {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const isTouch =
      "ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0;
    setTouch(isTouch);
  }, []);
  return touch;
}

export default function MobileControls({ onToggleFlashlight }: Props) {
  const isTouch = useIsTouch();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isTouch);
    setTouchMode(isTouch);
    if (!isTouch) {
      // ensure axes are zeroed when leaving touch mode
      setMoveAxes(0, 0);
    }
  }, [isTouch]);

  // Left joystick state
  const leftId = useRef<number | null>(null);
  const leftCenter = useRef<{ x: number; y: number } | null>(null);
  const stickRef = useRef<HTMLDivElement | null>(null);

  // Right look drag state
  const rightId = useRef<number | null>(null);

  // Config
  const maxRadius = 60; // px
  const deadZone = 8; // px
  const lookSensitivity = 1.0; // multiplier; scaled in FPSControls later

  // Left area handlers (movement)
  const onLeftTouchStart = (e: React.TouchEvent) => {
    // Prevent page gestures on iOS
    e.preventDefault();
    e.stopPropagation();
    if (leftId.current != null) return;
    const t = e.changedTouches[0];
    leftId.current = t.identifier;
    leftCenter.current = { x: t.clientX, y: t.clientY };
    updateStickVisual(0, 0);
  };
  const onLeftTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (leftId.current == null || !leftCenter.current) return;
    const t = getTouchById(e, leftId.current);
    if (!t) return;
    const dx = t.clientX - leftCenter.current.x;
    const dy = t.clientY - leftCenter.current.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const clamped = Math.min(dist, maxRadius);
    const nx = (clamped * Math.cos(angle)) / maxRadius; // -1..1
    const ny = (clamped * Math.sin(angle)) / maxRadius; // -1..1
    // dead zone
    const dead = Math.min(1, dist / Math.max(1, deadZone));
    const moveX = nx * dead; // strafe
    const moveY = -ny * dead; // forward is up (negative screen y)
    setMoveAxes(moveX, moveY);
    updateStickVisual(nx * maxRadius, ny * maxRadius);
  };
  const onLeftTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const id = leftId.current;
    if (id == null) return;
    const t = getTouchById(e, id);
    if (!t) return;
    leftId.current = null;
    leftCenter.current = null;
    setMoveAxes(0, 0);
    updateStickVisual(0, 0);
  };

  function updateStickVisual(dx: number, dy: number) {
    const el = stickRef.current;
    if (!el) return;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  // Right area handlers (look)
  const onRightTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (rightId.current != null) return;
    const t = e.changedTouches[0];
    rightId.current = t.identifier;
  };
  const onRightTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (rightId.current == null) return;
    const t = getTouchById(e, rightId.current);
    if (!t) return;
    // Use movementX/movementY like behavior by tracking previous positions
    const prev = (onRightTouchMove as any)._prev as
      | { x: number; y: number }
      | undefined;
    const cur = { x: t.clientX, y: t.clientY };
    if (prev) {
      addLookDelta(
        (cur.x - prev.x) * lookSensitivity,
        (cur.y - prev.y) * lookSensitivity
      );
    }
    (onRightTouchMove as any)._prev = cur;
  };
  const onRightTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const id = rightId.current;
    if (id == null) return;
    const t = getTouchById(e, id);
    if (!t) return;
    rightId.current = null;
    (onRightTouchMove as any)._prev = undefined;
  };

  const ui = useMemo(
    () => (
      <>
        {/* Left: movement joystick */}
        <div
          className="absolute left-3 bottom-3 h-36 w-36 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 touch-none select-none"
          onTouchStart={onLeftTouchStart}
          onTouchMove={onLeftTouchMove}
          onTouchEnd={onLeftTouchEnd}
          onTouchCancel={onLeftTouchEnd}
        >
          <div className="relative h-full w-full grid place-items-center">
            <div
              className="h-6 w-6 rounded-full bg-white/50"
              ref={stickRef}
              style={{ transform: "translate(0,0)" }}
            />
          </div>
        </div>

        {/* Right: look drag area (invisible, but show a subtle hint) */}
        <div
          className="absolute right-0 bottom-0 top-0 w-1/2 touch-none select-none"
          onTouchStart={onRightTouchStart}
          onTouchMove={onRightTouchMove}
          onTouchEnd={onRightTouchEnd}
          onTouchCancel={onRightTouchEnd}
        >
          <div className="absolute bottom-3 right-3 text-[10px] text-white/50">
            drag to look
          </div>
        </div>

        {/* Flashlight toggle button */}
        <button
          type="button"
          aria-label="Toggle flashlight"
          onClick={onToggleFlashlight}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFlashlight?.();
          }}
          className="absolute bottom-3 right-3 h-12 px-4 rounded-lg bg-white/10 border border-white/20 text-white text-sm active:scale-95"
        >
          Flashlight
        </button>
      </>
    ),
    []
  );

  if (!visible) return null;
  return <div className="pointer-events-auto absolute inset-0 z-20">{ui}</div>;
}

type TouchLike = { identifier: number; clientX: number; clientY: number };
function getTouchById(e: React.TouchEvent, id: number): TouchLike | null {
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t: any = e.changedTouches.item(i);
    if (t && t.identifier === id) return t;
  }
  return null;
}

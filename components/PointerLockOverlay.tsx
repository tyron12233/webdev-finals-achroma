"use client";

type Props = {
  visible: boolean;
  canvasId?: string;
};

export default function PointerLockOverlay({ visible, canvasId = "r3f-canvas" }: Props) {
  if (!visible) return null;
  const requestLock = () => {
    const el = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (el) {
      try {
        el.requestPointerLock();
      } catch {}
    }
  };
  return (
    <button
      aria-label="Click to start (locks cursor)"
      className="absolute inset-0 z-20 grid place-items-center bg-black/20 backdrop-blur-[1px] text-white"
      onClick={requestLock}
    >
      <div className="pointer-events-none select-none rounded-md border border-white/20 bg-black/50 px-4 py-3 text-sm shadow-lg">
        Click to start · cursor will lock
      </div>
    </button>
  );
}

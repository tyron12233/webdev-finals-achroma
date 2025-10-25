"use client";

import { useEffect, useMemo, useState } from "react";
import { useProgress } from "@react-three/drei";

export default function Preloader() {
  const { progress, active, loaded, total } = useProgress();
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

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
  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-50 grid place-items-center bg-black ${fade ? "opacity-0 transition-opacity duration-300" : "opacity-100"}`}>
      <div className="w-64 max-w-[70vw] text-center select-none">
        <div className="text-sm tracking-wide text-white/70">Loading…</div>
        <div className="mt-3 h-2 w-full rounded bg-white/10 overflow-hidden">
          <div className="h-full bg-white" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 text-xs text-white/60">{pct}%</div>
      </div>
    </div>
  );
}

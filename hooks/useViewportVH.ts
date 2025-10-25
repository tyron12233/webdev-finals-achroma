"use client";

import { useEffect } from "react";

export default function useViewportVH() {
  useEffect(() => {
    const updateVh = () => {
      const h = (window.innerHeight || document.documentElement.clientHeight) * 0.01;
      document.documentElement.style.setProperty("--vh", `${h}px`);
    };
    updateVh();
    window.addEventListener("resize", updateVh);
    window.addEventListener("orientationchange", updateVh);
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    vv?.addEventListener?.("resize", updateVh);
    return () => {
      window.removeEventListener("resize", updateVh);
      window.removeEventListener("orientationchange", updateVh);
      vv?.removeEventListener?.("resize", updateVh as any);
    };
  }, []);
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function targetPath(el: EventTarget | null): string {
  const parts: string[] = [];
  let node: any = el as any;
  let safety = 0;
  while (node && node.nodeType === 1 && safety++ < 10) {
    const tag = node.tagName?.toLowerCase?.() ?? "node";
    const id = node.id ? `#${node.id}` : "";
    const cls =
      node.className && typeof node.className === "string"
        ? "." + node.className.trim().split(/\s+/).slice(0, 2).join(".")
        : "";
    parts.unshift(`${tag}${id}${cls}`);
    node = node.parentNode;
  }
  return parts.join(" > ");
}

export default function TouchDebug() {
  const [enabled, setEnabled] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      setEnabled(localStorage.getItem("touchDebug") === "1");
    } catch {}
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.target as HTMLElement | null;
      const path = (e.composedPath?.() as any[] | undefined)?.[0] ?? t;
      const text = `touchstart → ${targetPath(path || t)}`;
      console.log("[TouchDebug]", text, e);
      setMsg(text);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setMsg(""), 2500);
    };

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      const path = (e.composedPath?.() as any[] | undefined)?.[0] ?? t;
      const text = `pointerdown → ${targetPath(path || t)}`;
      console.log("[TouchDebug]", text, e);
      setMsg(text);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setMsg(""), 2500);
    };

    window.addEventListener("touchstart", onTouchStart, {
      capture: true,
      passive: false,
    });
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart, {
        capture: true,
      } as any);
      window.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      } as any);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed top-2 left-2 z-[60] max-w-[70vw] rounded bg-black/70 px-3 py-2 text-[11px] text-white">
      {msg || "TouchDebug active (set localStorage.touchDebug='0' to disable)"}
    </div>
  );
}

"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SoundManager } from "./SoundManager";

type SoundContextValue = {
  sound: SoundManager;
  listener: THREE.AudioListener;
  resume: () => Promise<void>;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used within <SoundProvider>");
  return ctx;
}

// Basic manifest of expected sounds (place files under public/audio/...)
const DEFAULT_MANIFEST: Record<string, string> = {
  // footsteps
  footstep_1: "/audio/footsteps_1.m4a",
  footstep_2: "/audio/footsteps_2.m4a",
  footstep_3: "/audio/footsteps_3.m4a",
  footstep_4: "/audio/footsteps_4.m4a"

};

export default function SoundProvider({ children }: { children: React.ReactNode }) {
  const { camera } = useThree();

  const listenerRef = useRef<THREE.AudioListener | null>(null);
  const soundRef = useRef<SoundManager | null>(null);

  if (!listenerRef.current) {
    listenerRef.current = new THREE.AudioListener();
  }
  if (!soundRef.current && listenerRef.current) {
    soundRef.current = new SoundManager(listenerRef.current);
  }

  // Attach listener to the active camera
  useEffect(() => {
    const listener = listenerRef.current!;
    if (!camera.children.includes(listener)) {
      camera.add(listener);
    }
    return () => {
      try {
        camera.remove(listener);
      } catch {}
    };
  }, [camera]);

  // Preload default manifest (best-effort)
  useEffect(() => {
    soundRef.current?.preload(DEFAULT_MANIFEST);
  }, []);

  // Auto-resume on first interaction as a safety net
  useEffect(() => {
    const resume = () => soundRef.current?.resume();
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, []);

  const value = useMemo<SoundContextValue>(() => ({
    sound: soundRef.current!,
    listener: listenerRef.current!,
    resume: () => soundRef.current!.resume(),
  }), []);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

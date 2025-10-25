"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useSound } from "@/components/audio/useSound";

type SubtitleOptions = {
  maxLineChars?: number;
  lineDurationMs?: number;
  gapMs?: number;
  wpm?: number;
  minMs?: number;
  maxMs?: number;
};

type Para = {
  url: string;
  subtitle: string; // fallback: whole paragraph text
  // Optional fine-grained subtitle phasing for this paragraph
  subs?: Array<{
    text: string;
    atMs?: number; // when to show (relative to paragraph start)
    options?: SubtitleOptions; // override timings for this phrase
  }>;
  options?: SubtitleOptions; // default options for the paragraph
};

/**
 * Plays a short "radio" narration sequence after all 3D assets finish loading,
 * and displays corresponding subtitles while each paragraph is playing.
 *
 * Requirements covered:
 * - Start only after useProgress completes
 * - Play files: paragraph_1.wav, paragraph_2.wav, ... under /public/audio/radio
 * - Show matching subtitles while each file plays
 */
// Tweak subtitle timing here; the overlay will use these directly
const SUBTITLE_OPTS = {
  maxLineChars: 64, // wrapping width for game-style lines
  // Either use fixed per-line duration:
  lineDurationMs: 2600,
  // Or switch to words-per-minute timing by setting wpm > 0 (lineDurationMs ignored)
  wpm: 0, // e.g., 180 for auto timing
  gapMs: 220, // pause between lines
  minMs: 1400, // min per-line when using wpm
  maxMs: 5200, // max per-line when using wpm
} as const;

export default function RadioNarration() {
  const { active, progress, loaded, total } = useProgress();
  const { sound, resume } = useSound();

  const startedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  // Define paragraphs and subtitles
  const sequence = useMemo<Para[]>(
    () => [
      {
        url: "/audio/radio/paragraph_1.wav",
        subs: [
          {
            text: "...and the time is now 2:17 AM.",
            atMs: 300,
            options: {
              lineDurationMs: 4900,
            },
          },
          {
            text: "We return to our top story, a developing situation in the",
            atMs: 4900,
            options: {
              lineDurationMs: 3000,
            },
          },
          {
            text: " Maple Creek neighborhood that has left residents in stunned silence.",
            atMs: 4900 + 3000,
            options: {
              lineDurationMs: 2000,
            },
          },
        ],
        subtitle:
          "...and the time is now 2:17 AM. We return to our top story, a developing situation in the Maple Creek neighborhood that has left residents in stunned silence.",
      },
      {
        url: "/audio/radio/paragraph_2.wav",
        subs: [
          {
            atMs: 0,
            text: "Police were called to a small suburban home earlier this evening after neighbors reported...",
            options: {
              lineDurationMs: 4000,
            },
          },
          {
            atMs: 4000,
            text: "erratic behavior...",
            options: {
              lineDurationMs: 600,
            },
          },
          {
            atMs: 4600,
            text: "and a persistent, high-pitched wailing. What they found has shocked even veteran officers.",
            options: {
              lineDurationMs: 3000,
            },
          },
        ],
        subtitle:
          "Police were called to a small suburban home earlier this evening after neighbors reported... erratic behavior... and a persistent, high-pitched wailing. What they found has shocked even veteran officers.",
      },
      {
        url: "/audio/radio/paragraph_3.wav",
        subs: [
          {
            atMs: 0,
            text: "Inside the residence, a 41-year-old father, whose name is being withheld, was discovered in the master bedroom. ",
            options: {
              lineDurationMs: 6400,
            },
          },
          {
            atMs: 6400,
            text: " He was unharmed, found sitting in a rocking chair, facing the corner. His wife and two children were found deceased in their beds.",
            options: {
              lineDurationMs: 7100,
            },
          },
        ],
        subtitle:
          "Inside the residence, a 41-year-old father, whose name is being withheld, was discovered in the master bedroom. He was unharmed, found sitting in a rocking chair, facing the corner. His wife and two children were found deceased in their beds.",
      },
      {
        url: "/audio/radio/paragraph_4.wav",
        subs: [],
        subtitle:
          "The suspect offered no resistance and has been described by authorities as 'detached' and 'unresponsive' to questioning. He has made only one statement, repeated several times to the arresting officers. He claimed he was, quote, \"Making the colors quiet.\"",
      },
    ],
    []
  );

  // Helper to decode a wav into AudioBuffer via SoundManager's AudioContext
  const decode = async (
    url: string,
    signal?: AbortSignal
  ): Promise<AudioBuffer> => {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    const arr = await res.arrayBuffer();
    return await sound.context.decodeAudioData(arr.slice(0));
  };

  // Start sequence when assets finished AND audio context is running
  useEffect(() => {
    const done =
      !active && (progress >= 100 || (loaded > 0 && loaded >= total));
    if (!done) return;

    // If already started, skip
    if (startedRef.current) return;

    const tryStart = async () => {
      try {
        await resume();
      } catch {}

      if (sound.context.state !== "running") {
        // Wait for first pointer lock or interaction to resume, then start
        const onPl = async (e: Event) => {
          const detail = (e as CustomEvent).detail as { locked: boolean };
          if (detail?.locked) {
            window.removeEventListener(
              "__pointerlock_change__",
              onPl as EventListener
            );
            await resume();
            begin();
          }
        };
        window.addEventListener(
          "__pointerlock_change__",
          onPl as EventListener,
          {
            once: true,
          }
        );
        // Also fallback to first key/pointer
        const onInteract = async () => {
          window.removeEventListener("pointerdown", onInteract);
          window.removeEventListener("keydown", onInteract);
          await resume();
          begin();
        };
        window.addEventListener("pointerdown", onInteract, { once: true });
        window.addEventListener("keydown", onInteract, { once: true });
        return;
      }

      begin();
    };

    tryStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, progress, loaded, total]);

  // Core sequence
  const begin = () => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Cancel any previous
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    (async () => {
      for (let i = 0; i < sequence.length; i++) {
        if (ac.signal.aborted) break;
        const para = sequence[i];
        try {
          const buffer = await decode(para.url, ac.signal);
          if (ac.signal.aborted) break;

          // Create a BufferSource into the ambient group
          const src = sound.context.createBufferSource();
          src.buffer = buffer;
          const gain = sound.getGroupNode("ambient");
          src.connect(gain);

          // Keep track of current subtitle index
          setCurrentIndex(i);

          let ended = false;
          const scheduled: number[] = [];

          const clearScheduled = () => {
            while (scheduled.length) {
              const h = scheduled.pop()!;
              window.clearTimeout(h);
            }
          };

          const onEnded = () => {
            ended = true;
            src.disconnect();
            clearScheduled();
          };
          src.addEventListener("ended", onEnded);

          try {
            src.start();
          } catch (err) {
            console.warn("Radio paragraph failed to start:", err);
            onEnded();
          }

          // Dispatch subtitles for this paragraph
          if (para.subs && para.subs.length > 0) {
            para.subs.forEach((sub, idx) => {
              const delay = Math.max(
                0,
                sub.atMs ?? (idx === 0 ? 0 : idx * 1000)
              );
              const handle = window.setTimeout(() => {
                if (ac.signal.aborted || ended) return;
                const evt = new CustomEvent("__radio_subtitle__", {
                  detail: {
                    text: sub.text,
                    options: {
                      ...SUBTITLE_OPTS,
                      ...(para.options ?? {}),
                      ...(sub.options ?? {}),
                    },
                    append: idx > 0,
                  },
                });
                window.dispatchEvent(evt);
              }, delay);
              scheduled.push(handle);
            });
          } else {
            // Fallback: single event for the whole paragraph
            const evt = new CustomEvent("__radio_subtitle__", {
              detail: {
                text: para.subtitle,
                options: { ...SUBTITLE_OPTS, ...(para.options ?? {}) },
                append: false,
              },
            });
            window.dispatchEvent(evt);
          }

          // Wait until it ends or aborted
          await new Promise<void>((resolve) => {
            const check = () => {
              if (ac.signal.aborted || ended) return resolve();
              // Poll at low cost; 'ended' event should fire but some platforms are flaky
              setTimeout(check, 50);
            };
            check();
          });
        } catch (e) {
          console.warn("Failed to play radio paragraph:", para.url, e);
        }
      }

      // Clear subtitle
      setCurrentIndex(null);
      window.dispatchEvent(
        new CustomEvent("__radio_subtitle__", {
          detail: { text: "", append: false },
        })
      );
    })();
  };

  // Cleanup sequence on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Subtitle dispatching handled inside begin() per paragraph/phrase

  return null;
}

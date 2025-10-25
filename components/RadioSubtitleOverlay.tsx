"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SubtitleOptions = {
  maxLineChars?: number; // rough wrap width in characters
  lineDurationMs?: number; // fixed per-line duration (used if wpm <= 0)
  gapMs?: number; // pause between lines
  wpm?: number; // words-per-minute; if > 0, computes duration from word count
  minMs?: number; // minimum per-line duration when using wpm
  maxMs?: number; // maximum per-line duration when using wpm
};

// Baseline defaults used only on initial mount; can be overridden entirely by
// options provided from RadioNarration events.
const DEFAULT_OPTS: Required<SubtitleOptions> = {
  maxLineChars: 64,
  lineDurationMs: 2500,
  gapMs: 220,
  wpm: 0,
  minMs: 1400,
  maxMs: 5200,
};

function normalizeSpaces(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function splitSentences(s: string): string[] {
  // Split on . ? ! … or ellipses followed by space; keep punctuation
  const parts: string[] = [];
  const re = /(.*?)(\.{3}|[\.!?…])(\s+|$)/g;
  let m: RegExpExecArray | null;
  let lastIndex = 0;
  while ((m = re.exec(s)) !== null) {
    const chunk = (m[1] + m[2]).trim();
    if (chunk) parts.push(chunk);
    lastIndex = re.lastIndex;
  }
  if (lastIndex < s.length) {
    const rest = s.slice(lastIndex).trim();
    if (rest) parts.push(rest);
  }
  return parts;
}

function wrapToLines(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (!line.length) {
      line = w;
    } else if ((line + " " + w).length <= maxChars) {
      line += " " + w;
    } else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function toDisplayLines(paragraph: string, maxChars: number): string[] {
  const sentences = splitSentences(paragraph);
  const result: string[] = [];
  for (const s of sentences) {
    const wrapped = wrapToLines(s, maxChars);
    result.push(...wrapped);
  }
  return result;
}

function durationFor(line: string, opts: Required<SubtitleOptions>) {
  if (opts.wpm > 0) {
    const words = line.split(/\s+/).filter(Boolean).length || 1;
    const ms = (words * 60000) / opts.wpm;
    return Math.max(opts.minMs, Math.min(opts.maxMs, Math.round(ms)));
  }
  return opts.lineDurationMs;
}

/**
 * Screen-space subtitle overlay for radio narration.
 * Listens to window "__radio_subtitle__" events dispatched by RadioNarration (inside Canvas).
 * Displays one line at a time with configurable timing.
 */
export default function RadioSubtitleOverlay() {
  const [current, setCurrent] = useState<string>("");
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);
  const queueRef = useRef<string[]>([]);
  const optsRef = useRef<Required<SubtitleOptions>>(DEFAULT_OPTS);

  const clearTimers = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const playNext = () => {
    if (queueRef.current.length === 0) {
      setVisible(false);
      setCurrent("");
      return;
    }
    const line = queueRef.current.shift()!;
    setCurrent(line);
    setVisible(true);
    const dur = durationFor(line, optsRef.current);
    clearTimers();
    timerRef.current = window.setTimeout(() => {
      // gap before next line
      timerRef.current = window.setTimeout(playNext, optsRef.current.gapMs);
      setVisible(false);
    }, dur);
  };

  useEffect(() => {
    const onSub = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        text?: string;
        options?: SubtitleOptions;
        append?: boolean;
      } | undefined;
      const text = normalizeSpaces(detail?.text ?? "");
      const append = !!detail?.append;

      // Use options provided by RadioNarration directly; fallback to current values for any omitted keys
      if (detail?.options) {
        optsRef.current = { ...optsRef.current, ...detail.options } as Required<SubtitleOptions>;
      }

      if (!append) {
        // New paragraph or reset
        clearTimers();
        queueRef.current = [];
        setCurrent("");
        setVisible(false);
      }

      if (!text) {
        // Just a clear signal
        return;
      }

      const newLines = toDisplayLines(text, optsRef.current.maxLineChars);
      queueRef.current.push(...newLines);

      // If nothing is currently scheduled/displayed, kick off playback
      if (!timerRef.current && !visible && !current) {
        playNext();
      }
    };
    window.addEventListener("__radio_subtitle__", onSub as EventListener);
    return () => {
      window.removeEventListener("__radio_subtitle__", onSub as EventListener);
      clearTimers();
    };
  }, []);

  if (!current) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(2rem,env(safe-area-inset-bottom))] z-[60] grid place-items-center px-4" aria-live="polite">
      <div className={`max-w-3xl w-full text-center transition-opacity duration-180 ${visible ? "opacity-100" : "opacity-0"}`}>
        <p
          className="mx-auto text-sm sm:text-base md:text-lg leading-relaxed font-medium tracking-wide text-white"
          style={{
            textShadow:
              "0 1px 2px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.55), 0 0 14px rgba(0,0,0,0.35)",
            WebkitTextStroke: "0.35px rgba(0,0,0,0.55)",
          }}
        >
          {current}
        </p>
      </div>
    </div>
  );
}

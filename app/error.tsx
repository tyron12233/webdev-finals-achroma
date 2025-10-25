"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
  const [showDetails, setShowDetails] = useState(process.env.NODE_ENV !== "production");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Log to console in dev for DX
    // In prod, we still log so that desktop users can see it
    // and external monitoring can pick it up.
    // eslint-disable-next-line no-console
    console.error("[App Error]", error);
  }, [error]);

  const reportText = useMemo(() => {
    const lines: string[] = [];
    lines.push("Achroma - Error Report");
    lines.push(`Time: ${new Date().toISOString()}`);
    if (typeof window !== "undefined") {
      lines.push(`URL: ${window.location.href}`);
      lines.push(`UserAgent: ${navigator.userAgent}`);
      // Include some screen info to help with mobile reports
      lines.push(`Screen: ${window.screen.width}x${window.screen.height}`);
      lines.push(`Viewport: ${window.innerWidth}x${window.innerHeight}`);
    }
    if (error?.name) lines.push(`Name: ${error.name}`);
    if (error?.message) lines.push(`Message: ${error.message}`);
    if (error?.digest) lines.push(`Digest: ${error.digest}`);
    if (error?.stack) {
      lines.push("\nStack:\n" + error.stack);
    }
    return lines.join("\n");
  }, [error]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText?.(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = reportText;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const mailto = useMemo(() => {
    const subject = encodeURIComponent("Achroma Error Report");
    const body = encodeURIComponent(reportText);
    return `mailto:?subject=${subject}&body=${body}`;
  }, [reportText]);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black text-white p-6">
      <div className="w-full max-w-xl rounded-lg border border-white/15 bg-white/5 p-5">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-white/80">
          An unexpected error occurred. You can try again, or share the error
          details to help us debug—especially useful on mobile where the console
          isn’t visible.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm hover:bg-white/15 active:scale-[0.98]"
          >
            {showDetails ? "Hide details" : "Show error details"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm hover:bg-white/15 active:scale-[0.98]"
          >
            Try again
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 rounded bg-black/50 p-3">
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-white/80">
              {reportText}
            </pre>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15 active:scale-[0.98]"
              >
                {copied ? "Copied" : "Copy report"}
              </button>
              <a
                href={mailto}
                className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
              >
                Email report
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

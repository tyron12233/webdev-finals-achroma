"use client";

import "./globals.css";
import { useMemo, useState } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [showDetails, setShowDetails] = useState(process.env.NODE_ENV !== "production");

  const reportText = useMemo(() => {
    const lines: string[] = [];
    lines.push("Achroma - Global Error Report");
    lines.push(`Time: ${new Date().toISOString()}`);
    if (typeof window !== "undefined") {
      lines.push(`URL: ${window.location.href}`);
      lines.push(`UserAgent: ${navigator.userAgent}`);
    }
    if (error?.name) lines.push(`Name: ${error.name}`);
    if (error?.message) lines.push(`Message: ${error.message}`);
    if (error?.digest) lines.push(`Digest: ${error.digest}`);
    if (error?.stack) lines.push("\nStack:\n" + error.stack);
    return lines.join("\n");
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-black text-white">
        <div className="fixed inset-0 z-[100] grid place-items-center p-6">
          <div className="w-full max-w-xl rounded-lg border border-white/15 bg-white/5 p-5">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-white/80">
              The app encountered an unrecoverable error. You can try reloading
              or reveal details to report the problem.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowDetails((v) => !v)}
                className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
              >
                {showDetails ? "Hide details" : "Show error details"}
              </button>
              <button
                onClick={reset}
                className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
              >
                Reload
              </button>
            </div>
            {showDetails && (
              <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-black/50 p-3 text-xs text-white/80">
                {reportText}
              </pre>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { runCaptionPipelineForFile } from "@/lib/api/pipeline";

type RunResult = {
  fileName: string;
  status: "pending" | "running" | "success" | "error";
  imageId?: string;
  captions?: unknown[];
  error?: string;
};

export function FlavorTester({ flavorId }: { flavorId: number }) {
  const [results, setResults] = useState<RunResult[]>([]);
  const [running, setRunning] = useState(false);

  async function run(files: FileList | null) {
    if (!files?.length) return;
    setRunning(true);
    const seed = Array.from(files).map((file) => ({ fileName: file.name, status: "pending" as const }));
    setResults(seed);

    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) {
      setResults([{ fileName: "auth", status: "error", error: "No auth session found." }]);
      setRunning(false);
      return;
    }

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      setResults((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "running" } : r)));
      try {
        const response = await runCaptionPipelineForFile({
          accessToken,
          file,
          humorFlavorId: flavorId,
        });
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  status: "success",
                  imageId: response.imageId,
                  captions: response.captions,
                }
              : r
          )
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed";
        setResults((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "error", error: message } : r)));
      }
    }
    setRunning(false);
  }

  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <label className="block text-sm font-medium">Image test set (multiple files)</label>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
        multiple
        onChange={(e) => run(e.target.files)}
        disabled={running}
        className="block w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-white"
      />
      <div className="space-y-2">
        {results.map((result) => (
          <div key={result.fileName} className="rounded border border-zinc-200 bg-white p-3 text-sm">
            <p className="font-medium">
              {result.fileName} - {result.status}
            </p>
            {result.imageId ? <p className="text-xs">imageId: {result.imageId}</p> : null}
            {result.error ? <p className="text-xs text-red-600">{result.error}</p> : null}
            {result.captions ? (
              <pre className="mt-2 overflow-auto rounded bg-zinc-100 p-2 text-xs">
                {JSON.stringify(result.captions, null, 2)}
              </pre>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

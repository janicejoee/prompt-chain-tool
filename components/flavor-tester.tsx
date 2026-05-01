"use client";

import { useCallback, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import {
  PIPELINE_STATUS_LABEL as STATUS_LABEL,
  processImageAndGenerateCaptions,
  type PipelineStatus,
} from "@/lib/api/pipeline";

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
]);

const ACCEPT_STRING = Array.from(ACCEPTED_TYPES).join(",");

type CaptionRecord = Record<string, unknown> & { content?: string; id?: string };

function isHttpUrl(raw: string): boolean {
  const t = raw.trim();
  try {
    const u = new URL(t);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("You must be logged in to generate captions.");
  }
  return session.access_token;
}

type Props = { flavorId: number; flavorSlug?: string | null };

export function FlavorTester({ flavorId, flavorSlug }: Props) {
  const uid = useId();
  const urlInputId = `${uid}-paste-url`;

  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pasteUrl, setPasteUrl] = useState("");
  const [typeError, setTypeError] = useState<string | null>(null);

  /** Data URL (file) or remote URL string for pasted images */
  const [preview, setPreview] = useState<string | null>(null);

  const [captions, setCaptions] = useState<CaptionRecord[]>([]);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isBusy = pipelineStatus !== "idle" && pipelineStatus !== "done";
  const slugLine = flavorSlug ? flavorSlug.replace(/-/g, " ") : null;

  const trimmedPaste = pasteUrl.trim();
  const canGenerate =
    !!file ||
    (!file && isHttpUrl(trimmedPaste));
  const hasCaptions = captions.length > 0;
  const currentCaption = captions[captionIndex];

  const handleFile = useCallback((selected: File | null) => {
    if (!selected) return;
    setTypeError(null);
    setError(null);

    if (!ACCEPTED_TYPES.has(selected.type)) {
      setTypeError(
        `"${selected.type || "unknown"}" is not supported. Please upload a JPEG, PNG, WebP, GIF (it's pronounced JIFF), or HEIC image.`,
      );
      return;
    }

    setFile(selected);
    setPasteUrl("");
    setCaptions([]);
    setCaptionIndex(0);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selected);
  }, []);

  const handleRemove = () => {
    setFile(null);
    setPasteUrl("");
    setPreview(null);
    setCaptions([]);
    setCaptionIndex(0);
    setError(null);
    setPipelineStatus("idle");
    setTypeError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      handleFile(dropped ?? null);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handlePasteUrlChange = (v: string) => {
    setPasteUrl(v);
    setError(null);
    setTypeError(null);
    setCaptions([]);
    setCaptionIndex(0);
    if (inputRef.current) inputRef.current.value = "";
    setFile(null);
    const t = v.trim();
    setPreview(isHttpUrl(t) ? t : null);
  };

  const handleGenerateCaptions = async (formData: FormData) => {
    setError(null);
    setCaptions([]);

    const rawFile = formData.get("image-file");
    const imageFile =
      rawFile instanceof File && rawFile.size > 0
        ? rawFile
        : file && file.size > 0
          ? file
          : null;

    const imageUrl = String(formData.get("image-url") ?? "").trim();

    let input: { file?: File; imageUrl?: string };

    if (imageFile) {
      input = { file: imageFile };
    } else if (imageUrl) {
      input = { imageUrl };
    } else {
      setError("Please upload an image file or provide an image URL.");
      return;
    }

    try {
      const generatedCaptions = await processImageAndGenerateCaptions(input, flavorId, {
        accessToken: await getAccessToken(),
        registerAsCommonUse: true,
        onPipelineStatus: setPipelineStatus,
      });
      setCaptions(generatedCaptions as CaptionRecord[]);
    } catch (err: unknown) {
      console.error("Error generating captions:", err);
      setError(err instanceof Error ? err.message : "Failed to generate captions. Please try again.");
      setPipelineStatus("idle");
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-lg shadow-zinc-200/60">
      <div className="border-b border-zinc-100 bg-gradient-to-b from-zinc-50 to-white px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold tracking-wide text-teal-700 uppercase">
            Flavor test
          </span>
          <span className="text-sm font-medium text-zinc-500">ID #{flavorId}</span>
        </div>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Generate captions for this flavor
          {slugLine ? (
            <span className="mt-2 block text-xl font-semibold capitalize text-teal-800 sm:text-2xl">{slugLine}</span>
          ) : null}
        </h2>
        <p className="mt-3 max-w-2xl text-base text-zinc-600">
          Upload an image (drag and drop) or paste a public HTTPS URL. We run your current flavor against the same
          caption pipeline used in production.
        </p>
      </div>

      <form
        className="mx-auto max-w-4xl space-y-7 px-4 pb-8 pt-6 sm:px-6 sm:pb-12 sm:pt-8"
        onSubmit={(e) => {
          e.preventDefault();
          handleGenerateCaptions(new FormData(e.currentTarget));
        }}
      >
        <div className="space-y-2">
          <label htmlFor={urlInputId} className="block text-sm font-semibold text-zinc-900">
            Image URL (optional)
          </label>
          <input
            id={urlInputId}
            name="image-url"
            type="url"
            value={pasteUrl}
            onChange={(e) => handlePasteUrlChange(e.target.value)}
            disabled={isBusy}
            placeholder="https://..."
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-[15px] text-zinc-900 placeholder:text-zinc-400 outline-none ring-zinc-900/10 transition focus:border-zinc-400 focus:ring-4 disabled:opacity-60"
          />
          <p className="text-xs text-zinc-500">
            Tip: if URL fetching is blocked by CORS, we fall back to registering the image URL directly.
          </p>
        </div>

        {!preview ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            disabled={isBusy}
            className={`group w-full cursor-pointer rounded-2xl border-2 border-dashed px-4 py-16 text-center transition-all sm:px-8 sm:py-24 disabled:pointer-events-none disabled:opacity-50 ${
              isDragging
                ? "border-teal-400 bg-teal-50/60 shadow-inner"
                : "border-zinc-300 bg-zinc-50/70 hover:border-zinc-400 hover:bg-zinc-100/70"
            }`}
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100/80 transition-transform group-hover:scale-110 group-hover:bg-teal-100 sm:h-20 sm:w-20">
              <svg className="h-8 w-8 text-teal-700 sm:h-10 sm:w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-base font-medium text-zinc-900 sm:text-lg">
              {isDragging ? "Drop your image here" : "Drag & drop an image here"}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              or click to browse, then generate captions in one click
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Supported: JPEG, PNG, WebP, GIF (it&apos;s pronounced JIFF), HEIC
            </p>
            {typeError ? <p className="mt-3 text-sm font-medium text-red-600">{typeError}</p> : null}
            <input
              ref={inputRef}
              name="image-file"
              type="file"
              accept={ACCEPT_STRING}
              className="hidden"
              disabled={isBusy}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </button>
        ) : (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element -- humor-project pattern: data URLs + user URLs */}
              <img src={preview} alt="Preview" className="w-full object-contain" style={{ maxHeight: "28rem" }} />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
                aria-label="Remove image"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {file?.name ?? (isHttpUrl(trimmedPaste) ? trimmedPaste : "Image")}
                </p>
                <p className="text-xs text-zinc-500">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "From URL"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                {isBusy ? STATUS_LABEL[pipelineStatus] || "Working..." : hasCaptions ? "Captions generated successfully." : "Ready to run."}
              </div>
              <button
                type="submit"
                disabled={isBusy || !canGenerate}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-zinc-800 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45"
              >
                {isBusy ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {STATUS_LABEL[pipelineStatus] || "Working…"}
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Generate captions
                  </>
                )}
              </button>

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
              ) : null}
            </div>

            {hasCaptions ? (
              <article className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/80 shadow-sm">
                <div className="border-b border-zinc-200/80 bg-white/80 px-5 py-3 sm:px-6">
                  <p className="text-sm font-semibold text-zinc-800">Generated caption</p>
                </div>
                <div className="px-5 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
                  <p className="text-base leading-relaxed text-zinc-900 sm:text-lg">
                    {typeof currentCaption?.content === "string" ? currentCaption.content : JSON.stringify(currentCaption)}
                  </p>
                </div>

                {hasCaptions && captions.length > 1 ? (
                  <div className="flex items-center justify-between border-t border-zinc-200 bg-white/70 px-5 py-3 sm:px-6">
                    <button
                      type="button"
                      onClick={() => setCaptionIndex((i) => i - 1)}
                      disabled={captionIndex === 0}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Prev
                    </button>
                    <span className="text-sm tabular-nums text-zinc-500">
                      {captionIndex + 1} / {captions.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCaptionIndex((i) => i + 1)}
                      disabled={captionIndex === captions.length - 1}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-30"
                    >
                      Next
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                ) : null}
              </article>
            ) : null}
          </div>
        )}
      </form>
    </div>
  );
}

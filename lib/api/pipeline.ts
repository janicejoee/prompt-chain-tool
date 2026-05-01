/** Same base as humor-project `src/app/generate/page.tsx` (API_BASE). */
const PIPELINE_BASE = "https://api.almostcrackd.ai/pipeline";

const SUPPORTED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
]);

function formatPipelineErrorBody(status: number, body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return `Request failed (${status})`;
  try {
    const j = JSON.parse(trimmed) as { message?: string; statusMessage?: string };
    if (typeof j.message === "string" && j.message) return j.message;
  } catch {
    /* not JSON */
  }
  return trimmed.length > 800 ? `${trimmed.slice(0, 800)}…` : trimmed;
}

async function pipelinePost(accessToken: string, path: string, body: object): Promise<Response> {
  const response = await fetch(`${PIPELINE_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(formatPipelineErrorBody(response.status, text));
  }
  return response;
}

async function readJsonResponse<T>(response: Response, label: string): Promise<T> {
  const raw = await response.text();
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(
      `${label} returned non-JSON (${raw.length} chars). Start of body: ${raw.slice(0, 160).replace(/\s+/g, " ")}`
    );
  }
}

export type GenerateCaptionsInput = {
  accessToken: string;
  imageId: string;
  /**
   * When set, forwarded as a JSON integer (same key as camelCase APIs expect).
   * humor-project `/generate` omits this field entirely — only `{ imageId }`.
   */
  humorFlavorId?: number;
};

function coerceHumorFlavorId(v: number | undefined): number | undefined {
  if (v === undefined) return undefined;
  if (!Number.isFinite(v)) return undefined;
  return Math.trunc(v);
}

export async function generatePresignedUrl(input: {
  accessToken: string;
  contentType: string;
}) {
  if (!SUPPORTED_CONTENT_TYPES.has(input.contentType)) {
    throw new Error(`Unsupported content type: ${input.contentType}`);
  }

  const response = await pipelinePost(input.accessToken, "/generate-presigned-url", {
    contentType: input.contentType,
  });
  return readJsonResponse<{ presignedUrl: string; cdnUrl: string }>(response, "generate-presigned-url");
}

export async function uploadToPresignedUrl(input: {
  presignedUrl: string;
  contentType: string;
  file: File;
}) {
  const response = await fetch(input.presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": input.contentType },
    body: input.file,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Image upload failed (${response.status})`);
  }
}

export async function registerImageUrl(input: {
  accessToken: string;
  imageUrl: string;
  isCommonUse?: boolean;
}) {
  const response = await pipelinePost(input.accessToken, "/upload-image-from-url", {
    imageUrl: input.imageUrl,
    isCommonUse: input.isCommonUse ?? false,
  });
  return readJsonResponse<{ imageId: string; now: number }>(response, "upload-image-from-url");
}

export type PipelineStatus =
  | "idle"
  | "uploading"
  | "registering"
  | "generating"
  | "done";

/** Same labels as humor-project `generate/page.tsx` STATUS_LABEL. */
export const PIPELINE_STATUS_LABEL: Record<PipelineStatus, string> = {
  idle: "",
  uploading: "Uploading image…",
  registering: "Registering image…",
  generating: "Generating captions — this may take a moment…",
  done: "",
};

/**
 * Calls `POST .../pipeline/generate-captions` with Bearer token and JSON body:
 * `{ "imageId", "humorFlavorId" }` (integer humorFlavorId) when scoped to a humor flavor,
 * otherwise `{ "imageId" }` only (same as public Generate).
 */
export async function generateCaptions(input: GenerateCaptionsInput) {
  const flavorIdNum = coerceHumorFlavorId(input.humorFlavorId);
  const body: { imageId: string; humorFlavorId?: number } = {
    imageId: input.imageId,
    ...(flavorIdNum !== undefined ? { humorFlavorId: flavorIdNum } : {}),
  };

  const response = await pipelinePost(input.accessToken, "/generate-captions", body);
  const raw = await response.text();
  const trimmed = raw.trim();
  if (!trimmed) return [];

  try {
    const data = JSON.parse(trimmed) as unknown;
    return (Array.isArray(data) ? data : [data]) as unknown[];
  } catch {
    // Some backend paths return plain-text domain errors even on 2xx.
    // Surface the backend message directly instead of a JSON parse exception.
    throw new Error(trimmed.length > 800 ? `${trimmed.slice(0, 800)}…` : trimmed);
  }
}

export type RunCaptionPipelineOptions = {
  accessToken: string;
  file: File;
  /** Omit to match humor-project `/generate` (body is only `{ imageId }`). */
  humorFlavorId?: number;
  /** Match public generate flows that register with `isCommonUse: true`. */
  registerAsCommonUse?: boolean;
  /** Emit before presign+upload, register, captions, then `done` (matches humor-project flow). */
  onPipelineStatus?: (status: PipelineStatus) => void;
};

export async function runCaptionPipelineForFile(input: RunCaptionPipelineOptions) {
  const { onPipelineStatus } = input;

  onPipelineStatus?.("uploading");
  const { presignedUrl, cdnUrl } = await generatePresignedUrl({
    accessToken: input.accessToken,
    contentType: input.file.type,
  });

  await uploadToPresignedUrl({
    presignedUrl,
    contentType: input.file.type,
    file: input.file,
  });

  onPipelineStatus?.("registering");
  const { imageId } = await registerImageUrl({
    accessToken: input.accessToken,
    imageUrl: cdnUrl,
    isCommonUse: input.registerAsCommonUse ?? false,
  });

  onPipelineStatus?.("generating");
  const captions = await generateCaptions({
    accessToken: input.accessToken,
    imageId,
    ...(input.humorFlavorId !== undefined
      ? { humorFlavorId: input.humorFlavorId }
      : {}),
  });

  onPipelineStatus?.("done");
  return { imageId, captions };
}

export type RunCaptionPipelineFromUrlOptions = {
  accessToken: string;
  imageUrl: string;
  humorFlavorId?: number;
  registerAsCommonUse?: boolean;
  onPipelineStatus?: (status: PipelineStatus) => void;
};

/** Register an existing HTTPS image URL with the pipeline, then generate captions (no upload). */
export async function runCaptionPipelineFromRemoteUrl(input: RunCaptionPipelineFromUrlOptions) {
  const trimmed = input.imageUrl.trim();
  if (!trimmed) throw new Error("Image URL is required.");

  input.onPipelineStatus?.("registering");
  const { imageId } = await registerImageUrl({
    accessToken: input.accessToken,
    imageUrl: trimmed,
    isCommonUse: input.registerAsCommonUse ?? false,
  });

  input.onPipelineStatus?.("generating");
  const captions = await generateCaptions({
    accessToken: input.accessToken,
    imageId,
    ...(input.humorFlavorId !== undefined ? { humorFlavorId: input.humorFlavorId } : {}),
  });

  input.onPipelineStatus?.("done");
  return { imageId, captions };
}

/** Fetch a public URL in-browser → File (presign/upload path). Fallback to remote register if fetch fails (e.g. CORS). */
async function fetchPublicImageUrlAsFile(url: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not fetch image URL (${res.status}).`);
  }
  const blob = await res.blob();
  let mime =
    blob.type && blob.type !== "application/octet-stream"
      ? blob.type
      : res.headers.get("content-type")?.split(";")[0]?.trim() || "";
  if (!mime || mime === "application/octet-stream") {
    mime = "image/jpeg";
  }
  if (!SUPPORTED_CONTENT_TYPES.has(mime)) {
    throw new Error(
      `URL resolved to unsupported type "${mime}". Use a JPEG, PNG, WebP, GIF, or HEIC link.`,
    );
  }
  const ext =
    mime.split("/")[1]?.replace("jpeg", "jpg").replace("+xml", "").split("+")[0] ?? "jpg";
  return new File([blob], `from-url.${ext}`, { type: mime });
}

export type ProcessImageCaptionInput = {
  file?: File;
  imageUrl?: string;
};

/**
 * Matches humor-project style: `{ file?, imageUrl? }` plus integer `humorFlavorId`.
 * Prefers file over URL when both are present (same ordering as Generate form handlers).
 */
export async function processImageAndGenerateCaptions(
  input: ProcessImageCaptionInput,
  humorFlavorId: number,
  ctx: {
    accessToken: string;
    /** When true, uploads use `upload-image-from-url` with `isCommonUse: true` (often matches public humor-project). */
    registerAsCommonUse?: boolean;
    onPipelineStatus?: (status: PipelineStatus) => void;
  },
): Promise<unknown[]> {
  const { accessToken, registerAsCommonUse, onPipelineStatus } = ctx;
  let res: { captions: unknown[] };

  if (input.file && input.file.size > 0) {
    res = await runCaptionPipelineForFile({
      accessToken,
      file: input.file,
      humorFlavorId,
      registerAsCommonUse,
      onPipelineStatus,
    });
  } else if (input.imageUrl?.trim()) {
    const trimmed = input.imageUrl.trim();
    try {
      const fromUrlFile = await fetchPublicImageUrlAsFile(trimmed);
      res = await runCaptionPipelineForFile({
        accessToken,
        file: fromUrlFile,
        humorFlavorId,
        registerAsCommonUse,
        onPipelineStatus,
      });
    } catch {
      res = await runCaptionPipelineFromRemoteUrl({
        accessToken,
        imageUrl: trimmed,
        humorFlavorId,
        registerAsCommonUse,
        onPipelineStatus,
      });
    }
  } else {
    throw new Error("Please upload an image file or provide an image URL.");
  }

  const raw = res.captions;
  return Array.isArray(raw) ? raw : [raw];
}

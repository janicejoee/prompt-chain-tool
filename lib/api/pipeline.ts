const PIPELINE_BASE_URL = "https://api.almostcrackd.ai";

const SUPPORTED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
]);

export type GenerateCaptionsInput = {
  accessToken: string;
  imageId: string;
  humorFlavorId?: number | string;
};

export async function generatePresignedUrl(input: {
  accessToken: string;
  contentType: string;
}) {
  if (!SUPPORTED_CONTENT_TYPES.has(input.contentType)) {
    throw new Error(`Unsupported content type: ${input.contentType}`);
  }

  const response = await fetch(`${PIPELINE_BASE_URL}/pipeline/generate-presigned-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contentType: input.contentType }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Presigned URL request failed (${response.status})`);
  }

  const data = (await response.json()) as { presignedUrl: string; cdnUrl: string };
  return data;
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
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Image upload failed (${response.status})`);
  }
}

export async function registerImageUrl(input: {
  accessToken: string;
  imageUrl: string;
  isCommonUse?: boolean;
}) {
  const response = await fetch(`${PIPELINE_BASE_URL}/pipeline/upload-image-from-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageUrl: input.imageUrl,
      isCommonUse: input.isCommonUse ?? false,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Image registration failed (${response.status})`);
  }

  const data = (await response.json()) as { imageId: string; now: number };
  return data;
}

export async function generateCaptions(input: GenerateCaptionsInput) {
  const payload: { imageId: string; humorFlavorId?: string } = { imageId: input.imageId };
  if (input.humorFlavorId !== undefined) payload.humorFlavorId = String(input.humorFlavorId);

  const response = await fetch(`${PIPELINE_BASE_URL}/pipeline/generate-captions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Caption generation failed (${response.status})`);
  }

  return (await response.json()) as unknown[];
}

export async function runCaptionPipelineForFile(input: {
  accessToken: string;
  file: File;
  humorFlavorId?: number | string;
}) {
  const { presignedUrl, cdnUrl } = await generatePresignedUrl({
    accessToken: input.accessToken,
    contentType: input.file.type,
  });
  await uploadToPresignedUrl({
    presignedUrl,
    contentType: input.file.type,
    file: input.file,
  });
  const { imageId } = await registerImageUrl({
    accessToken: input.accessToken,
    imageUrl: cdnUrl,
    isCommonUse: false,
  });

  const captions = await generateCaptions({
    accessToken: input.accessToken,
    imageId,
    humorFlavorId: input.humorFlavorId,
  });

  return { imageId, captions };
}

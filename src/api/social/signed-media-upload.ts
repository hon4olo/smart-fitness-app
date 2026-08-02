import type {
  SignedSocialMediaUploadDto,
  SocialMediaUploadType,
} from "./media-contracts";

export type SignedMediaUploadFailure =
  | "expired"
  | "local_file_unavailable"
  | "size_mismatch"
  | "network"
  | "rejected"
  | "aborted";

export class SignedMediaUploadError extends Error {
  constructor(readonly code: SignedMediaUploadFailure) {
    super(code);
    this.name = "SignedMediaUploadError";
  }
}

type UploadSignedSocialMediaInput = {
  uri: string;
  byteSize: number;
  mediaType: SocialMediaUploadType;
  upload: SignedSocialMediaUploadDto;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
};

const readLocalBlob = async (
  uri: string,
  expectedByteSize: number,
  mediaType: SocialMediaUploadType,
): Promise<Blob> => {
  let response: Response;
  try {
    response = await fetch(uri);
  } catch {
    throw new SignedMediaUploadError("local_file_unavailable");
  }
  if (!response.ok) {
    throw new SignedMediaUploadError("local_file_unavailable");
  }
  const blob = await response.blob();
  if (blob.size !== expectedByteSize) {
    throw new SignedMediaUploadError("size_mismatch");
  }
  if (blob.type && blob.type !== mediaType) {
    return blob.slice(0, blob.size, mediaType);
  }
  return blob;
};

export const uploadSignedSocialMedia = async ({
  uri,
  byteSize,
  mediaType,
  upload,
  onProgress,
  signal,
}: UploadSignedSocialMediaInput): Promise<void> => {
  if (Date.parse(upload.expiresAt) <= Date.now()) {
    throw new SignedMediaUploadError("expired");
  }
  const blob = await readLocalBlob(uri, byteSize, mediaType);
  if (signal?.aborted) throw new SignedMediaUploadError("aborted");

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const abort = () => {
      request.abort();
      reject(new SignedMediaUploadError("aborted"));
    };
    signal?.addEventListener("abort", abort, { once: true });

    request.open("PUT", upload.url);
    request.timeout = Math.max(
      5_000,
      Math.min(120_000, Date.parse(upload.expiresAt) - Date.now()),
    );
    for (const [name, value] of Object.entries(upload.headers)) {
      request.setRequestHeader(name, value);
    }
    if (
      !Object.keys(upload.headers).some(
        (name) => name.toLowerCase() === "content-type",
      )
    ) {
      request.setRequestHeader("content-type", mediaType);
    }

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      onProgress?.(Math.min(1, Math.max(0, event.loaded / event.total)));
    };
    request.onerror = () => reject(new SignedMediaUploadError("network"));
    request.ontimeout = () => reject(new SignedMediaUploadError("network"));
    request.onabort = () => reject(new SignedMediaUploadError("aborted"));
    request.onload = () => {
      signal?.removeEventListener("abort", abort);
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(1);
        resolve();
      } else {
        reject(new SignedMediaUploadError("rejected"));
      }
    };
    request.send(blob);
  });
};

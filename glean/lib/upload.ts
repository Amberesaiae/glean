import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import * as LegacyFileSystem from "expo-file-system/legacy";

import { supabase } from "@/lib/supabase";

const BUCKET = "media";

export type MediaFolder = "avatars" | "listings" | "feed" | "events";

const VIDEO_EXTENSIONS = ["mp4", "mov", "m4v", "webm"];

/** Returns true when a stored media URL points at a video file. */
export function isVideoUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const lower = url.split("?")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(`.${ext}`));
}

function extFromMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("heic")) return "heic";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("quicktime")) return "mov";
  if (mime.includes("m4v")) return "m4v";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "mp4";
  return "jpg";
}

function guessMimeFromUri(uri: string): string {
  const lower = uri.split("?")[0].toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".m4v")) return "video/x-m4v";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mp4")) return "video/mp4";
  return "image/jpeg";
}

/**
 * Uploads a picked asset (image or video) to Supabase Storage and returns its
 * public URL. Files are namespaced under the signed-in user's id so the storage
 * RLS policies allow the write.
 *
 * We upload from base64 → ArrayBuffer (the only reliable primitive in React
 * Native — Blob/File/FormData silently produce empty uploads). The picker's
 * inline base64 is used when present, otherwise we read the file from disk.
 */
export async function uploadMedia(
  asset: ImagePicker.ImagePickerAsset,
  folder: MediaFolder,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in to upload.");

  const contentType = asset.mimeType ?? guessMimeFromUri(asset.uri);
  const ext = extFromMime(contentType);

  let base64 = asset.base64 ?? null;
  if (!base64) {
    base64 = await LegacyFileSystem.readAsStringAsync(asset.uri, {
      encoding: LegacyFileSystem.EncodingType.Base64,
    });
  }
  if (!base64) throw new Error("Couldn't read the selected file.");

  const path = `${user.id}/${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, decode(base64), { contentType, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

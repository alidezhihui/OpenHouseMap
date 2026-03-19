import type { Photo } from "../types";
import api from "./api";

interface PresignResponse {
  uploadUrl: string;
  photo: Photo;
}

export async function presignPhoto(
  floorPlanId: string,
  filename: string,
  mimeType: string,
): Promise<PresignResponse> {
  const { data } = await api.post<PresignResponse>(
    `/floor-plans/${floorPlanId}/photos/presign`,
    { filename, mimeType },
  );
  return data;
}

export async function uploadToPresignedUrl(
  uploadUrl: string,
  file: File,
  mimeType: string,
): Promise<void> {
  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: file,
  });
}

export async function deletePhoto(id: string): Promise<void> {
  await api.delete(`/photos/${id}`);
}

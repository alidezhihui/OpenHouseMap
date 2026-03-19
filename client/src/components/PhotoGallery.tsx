import { useRef } from "react";
import type { Photo } from "../types";
import { presignPhoto, uploadToPresignedUrl, deletePhoto } from "../services/photos";

interface PhotoGalleryProps {
  photos: Photo[];
  floorPlanId: string;
  onUpdate: () => void;
}

export default function PhotoGallery({
  photos,
  floorPlanId,
  onUpdate,
}: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    const { uploadUrl } = await presignPhoto(
      floorPlanId,
      file.name,
      file.type,
    );
    await uploadToPresignedUrl(uploadUrl, file, file.type);
    onUpdate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  const handleDelete = async (id: string) => {
    await deletePhoto(id);
    onUpdate();
  };

  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: "#9ca3af",
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        Photos
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {photos.map((photo) => (
          <div
            key={photo.id}
            style={{ position: "relative", width: 64, height: 64 }}
          >
            <img
              src={photo.url}
              alt={photo.originalName}
              style={{
                width: 64,
                height: 64,
                objectFit: "cover",
                borderRadius: 4,
                border: "1px solid #3b82f6",
              }}
            />
            <button
              onClick={() => handleDelete(photo.id)}
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: "#1e1e36",
                border: "1px solid #4b5563",
                borderRadius: "50%",
                color: "#9ca3af",
                width: 16,
                height: 16,
                fontSize: 9,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Add photo placeholder tile */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: 64,
            height: 64,
            border: "1px dashed #4b5563",
            borderRadius: 4,
            background: "transparent",
            color: "#6b7280",
            fontSize: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
      </div>

      {/* Upload button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        style={{
          marginTop: 6,
          background: "#374151",
          border: "none",
          borderRadius: 4,
          color: "#e5e7eb",
          fontSize: 12,
          padding: "4px 10px",
          cursor: "pointer",
        }}
      >
        Upload
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}

import { useState } from "react";
import type { AmenityItem } from "../types";
import * as amenityService from "../services/amenities";

interface AmenityChecklistProps {
  amenities: AmenityItem[];
  floorPlanId: string;
  onUpdate: () => void;
}

export default function AmenityChecklist({
  amenities,
  floorPlanId,
  onUpdate,
}: AmenityChecklistProps) {
  const [newLabel, setNewLabel] = useState("");

  const handleToggle = async (amenity: AmenityItem) => {
    await amenityService.updateAmenity(amenity.id, {
      checked: !amenity.checked,
    });
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    await amenityService.deleteAmenity(id);
    onUpdate();
  };

  const handleAdd = async () => {
    const label = newLabel.trim();
    if (!label) return;
    await amenityService.createAmenity(floorPlanId, { label, checked: false });
    setNewLabel("");
    onUpdate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
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
        Amenities
      </div>

      {/* 2-column grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 4,
        }}
      >
        {amenities.map((a) => (
          <div
            key={a.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "#d1d5db",
            }}
          >
            <input
              type="checkbox"
              checked={a.checked}
              onChange={() => handleToggle(a)}
              style={{ cursor: "pointer", accentColor: "#3b82f6" }}
            />
            <span
              style={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
              onClick={() => handleToggle(a)}
            >
              {a.label}
            </span>
            <button
              onClick={() => handleDelete(a.id)}
              style={{
                background: "transparent",
                border: "none",
                color: "#6b7280",
                cursor: "pointer",
                fontSize: 11,
                padding: "0 2px",
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add amenity */}
      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add amenity"
          style={{
            flex: 1,
            background: "#12122a",
            border: "1px solid #374151",
            borderRadius: 4,
            padding: "4px 8px",
            color: "#e5e7eb",
            fontSize: 12,
            outline: "none",
          }}
        />
        <button
          onClick={handleAdd}
          style={{
            background: "#374151",
            border: "none",
            borderRadius: 4,
            color: "#e5e7eb",
            fontSize: 12,
            padding: "4px 8px",
            cursor: "pointer",
          }}
        >
          + Add
        </button>
      </div>
    </div>
  );
}

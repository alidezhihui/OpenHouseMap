import { useState } from "react";
import type { Pin, FloorPlan } from "../types";
import FloorPlanTabs from "./FloorPlanTabs";

interface PinPopupProps {
  pin: Pin;
  onEdit: (pin: Pin) => void;
  onClose: () => void;
}

function FloorPlanContent({ fp }: { fp: FloorPlan }) {
  return (
    <div style={{ padding: "10px 0", display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Rent */}
      {fp.rent !== null && (
        <div style={{ color: "#facc15", fontWeight: 600, fontSize: 16 }}>
          ${fp.rent.toLocaleString()}/mo
        </div>
      )}

      {/* Notes */}
      {fp.notes && (
        <div
          style={{
            background: "#12122a",
            borderRadius: 6,
            padding: "8px 12px",
            color: "#d1d5db",
            fontSize: 13,
            whiteSpace: "pre-wrap",
          }}
        >
          {fp.notes}
        </div>
      )}

      {/* Photos */}
      {fp.photos.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {fp.photos.map((photo) => (
            <img
              key={photo.id}
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
          ))}
        </div>
      )}

      {/* Amenities */}
      {fp.amenities.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {fp.amenities.map((a) => (
            <span
              key={a.id}
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 9999,
                background: a.checked ? "#166534" : "#7f1d1d",
                color: a.checked ? "#86efac" : "#fca5a5",
              }}
            >
              {a.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PinPopup({ pin, onEdit, onClose }: PinPopupProps) {
  const [activeTab, setActiveTab] = useState(0);
  const activeFp = pin.floorPlans[activeTab] as FloorPlan | undefined;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#1e1e36",
        border: "1px solid #3b82f6",
        borderRadius: 10,
        width: 380,
        maxHeight: "80vh",
        overflowY: "auto",
        zIndex: 1000,
        padding: 16,
        color: "#e5e7eb",
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{pin.name}</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{pin.address}</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => onEdit(pin)}
            style={{
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "4px 10px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Edit
          </button>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: "#9ca3af",
              border: "1px solid #4b5563",
              borderRadius: 4,
              padding: "4px 8px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Floor plan tabs + content */}
      {pin.floorPlans.length > 0 ? (
        <>
          <FloorPlanTabs
            floorPlans={pin.floorPlans}
            activeIndex={activeTab}
            onTabClick={setActiveTab}
          />
          {activeFp && <FloorPlanContent fp={activeFp} />}
        </>
      ) : (
        <div style={{ color: "#6b7280", fontSize: 13, padding: "12px 0" }}>
          No floor plans yet.
        </div>
      )}
    </div>
  );
}

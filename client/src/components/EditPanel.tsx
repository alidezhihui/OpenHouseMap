import { useState, useEffect } from "react";
import type { Pin, FloorPlan } from "../types";
import FloorPlanTabs from "./FloorPlanTabs";
import PhotoGallery from "./PhotoGallery";
import AmenityChecklist from "./AmenityChecklist";
import { useToast } from "./Toast";
import { updatePin, deletePin } from "../services/pins";
import {
  createFloorPlan,
  updateFloorPlan,
  deleteFloorPlan,
} from "../services/floorPlans";

interface EditPanelProps {
  pin: Pin;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditPanel({ pin, onClose, onUpdate }: EditPanelProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(0);

  // Building-level fields
  const [name, setName] = useState(pin.name);
  const [address, setAddress] = useState(pin.address);

  // Per-tab fields
  const [planName, setPlanName] = useState("");
  const [rent, setRent] = useState("");
  const [notes, setNotes] = useState("");

  const activeFp: FloorPlan | undefined = pin.floorPlans[activeTab];

  // Sync per-tab fields when activeTab or pin changes
  useEffect(() => {
    if (activeFp) {
      setPlanName(activeFp.name);
      setRent(activeFp.rent !== null ? String(activeFp.rent) : "");
      setNotes(activeFp.notes);
    }
  }, [activeTab, activeFp?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    try {
      // Save building-level fields
      await updatePin(pin.id, { name, address });

      // Save active floor plan fields
      if (activeFp) {
        await updateFloorPlan(activeFp.id, {
          name: planName,
          rent: rent === "" ? null : Number(rent),
          notes,
        });
      }

      showToast("Changes saved");
      onUpdate();
      onClose();
    } catch {
      showToast("Failed to save", "error");
    }
  };

  const handleAddTab = async () => {
    await createFloorPlan(pin.id);
    onUpdate();
  };

  const handleDeleteTab = async () => {
    if (!activeFp || pin.floorPlans.length <= 1) return;
    try {
      await deleteFloorPlan(activeFp.id);
      showToast("Floor plan deleted");
      setActiveTab(0);
      onUpdate();
    } catch {
      showToast("Failed to save", "error");
    }
  };

  const handleTabClick = (index: number) => {
    // Before switching, we don't auto-save, just switch
    setActiveTab(index);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#12122a",
    border: "1px solid #374151",
    borderRadius: 4,
    padding: "6px 8px",
    color: "#e5e7eb",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 2,
    fontWeight: 600,
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 340,
        height: "100%",
        background: "#1e1e36",
        border: "1px solid #3b82f6",
        borderRadius: 0,
        overflowY: "auto",
        zIndex: 1001,
        padding: 16,
        color: "#e5e7eb",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16 }}>Edit Apartment</div>
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
          ✕ Cancel
        </button>
      </div>

      {/* Building-level fields */}
      <div>
        <div style={labelStyle}>Name</div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div>
        <div style={labelStyle}>Address</div>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Floor plan tabs */}
      <FloorPlanTabs
        floorPlans={pin.floorPlans}
        activeIndex={activeTab}
        onTabClick={handleTabClick}
        onAddTab={handleAddTab}
        showAdd
      />

      {/* Per-tab fields */}
      {activeFp && (
        <>
          <div>
            <div style={labelStyle}>Plan Name</div>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <div style={labelStyle}>Rent ($/mo)</div>
            <input
              type="number"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              style={inputStyle}
              placeholder="e.g. 2500"
            />
          </div>
          <div>
            <div style={labelStyle}>Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>

          {/* Photo Gallery */}
          <PhotoGallery
            photos={activeFp.photos}
            floorPlanId={activeFp.id}
            onUpdate={onUpdate}
          />

          {/* Amenity Checklist */}
          <AmenityChecklist
            amenities={activeFp.amenities}
            floorPlanId={activeFp.id}
            onUpdate={onUpdate}
          />
        </>
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 4,
        }}
      >
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "8px 0",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Save
        </button>

        {activeFp && pin.floorPlans.length > 1 && (
          <button
            onClick={handleDeleteTab}
            style={{
              background: "#7f1d1d",
              color: "#fca5a5",
              border: "none",
              borderRadius: 4,
              padding: "8px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Delete Tab
          </button>
        )}
      </div>

      {/* Delete Pin */}
      <button
        onClick={async () => {
          if (
            window.confirm(
              "Delete this apartment and all its floor plans?",
            )
          ) {
            try {
              await deletePin(pin.id);
              showToast("Apartment deleted");
              onUpdate();
              onClose();
            } catch {
              showToast("Failed to save", "error");
            }
          }
        }}
        style={{
          width: "100%",
          background: "#991b1b",
          color: "#fca5a5",
          border: "1px solid #dc2626",
          borderRadius: 4,
          padding: "8px 0",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          marginTop: 4,
        }}
      >
        Delete Pin
      </button>
    </div>
  );
}

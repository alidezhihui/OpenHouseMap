import { useState } from "react";
import { usePins } from "../hooks/usePins";
import MapView from "../components/MapView";
import type { Pin } from "../types";

export default function MapPage() {
  const { pins, loading } = usePins();
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  const handlePinClick = (pin: Pin) => {
    setSelectedPin(pin);
  };

  const handleMapClick = (_lat: number, _lng: number) => {
    setSelectedPin(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* TopBar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          background: "#1e293b",
          color: "#e2e8f0",
          fontFamily: "system-ui, sans-serif",
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 18 }}>Housing Map</span>
        <span style={{ fontSize: 14, color: "#94a3b8" }}>
          {loading ? "Loading..." : `${pins.length} pin${pins.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapView
          pins={pins}
          onPinClick={handlePinClick}
          onMapClick={handleMapClick}
        />
      </div>
    </div>
  );
}

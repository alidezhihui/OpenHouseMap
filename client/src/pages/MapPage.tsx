import { useState } from "react";
import { usePins } from "../hooks/usePins";
import MapView from "../components/MapView";
import TopBar from "../components/TopBar";
import type { Pin } from "../types";

export default function MapPage() {
  const { pins, loading } = usePins();
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handlePinClick = (pin: Pin) => {
    setSelectedPin(pin);
  };

  const handleMapClick = (_lat: number, _lng: number) => {
    setSelectedPin(null);
  };

  const handleAddressSelect = (address: string, lat: number, lng: number) => {
    // TODO: fly/center the map to the selected address
    console.log("Address selected:", address, lat, lng);
  };

  const handleAddPin = () => {
    // TODO: open add-pin flow
    console.log("Add pin clicked");
  };

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopBar
        onAddressSelect={handleAddressSelect}
        onAddPin={handleAddPin}
        onToggleSidebar={handleToggleSidebar}
        pinCount={loading ? 0 : pins.length}
      />

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

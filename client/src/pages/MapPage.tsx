import { useState } from "react";
import { usePins } from "../hooks/usePins";
import MapView from "../components/MapView";
import TopBar from "../components/TopBar";
import PinPopup from "../components/PinPopup";
import EditPanel from "../components/EditPanel";
import Sidebar from "../components/Sidebar";
import { createPin } from "../services/pins";
import type { Pin } from "../types";

export default function MapPage() {
  const { pins, loading, refresh } = usePins();
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handlePinClick = (pin: Pin) => {
    setSelectedPin(pin);
  };

  const [addPinMode, setAddPinMode] = useState(false);

  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedPin(null);

    if (!addPinMode) return;
    setAddPinMode(false);

    // Reverse geocode via Nominatim
    let address = "Unnamed Location";
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const json = await res.json();
      if (json.display_name) {
        address = json.display_name;
      }
    } catch {
      // fallback to "Unnamed Location"
    }

    const newPin = await createPin({
      name: "New Apartment",
      address,
      latitude: lat,
      longitude: lng,
    });
    await refresh();
    setEditingPin(newPin);
  };

  const handleAddressSelect = async (
    address: string,
    lat: number,
    lng: number,
  ) => {
    const newPin = await createPin({
      name: "New Apartment",
      address,
      latitude: lat,
      longitude: lng,
    });
    await refresh();
    setEditingPin(newPin);
  };

  const handleAddPin = () => {
    setAddPinMode(true);
  };

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleSidebarPinClick = (pin: Pin) => {
    setSelectedPin(pin);
    setSidebarOpen(false);
  };

  const handleEdit = (pin: Pin) => {
    setEditingPin(pin);
    setSelectedPin(null);
  };

  const handleEditClose = () => {
    setEditingPin(null);
    refresh();
  };

  // Find the latest version of the editing pin from refreshed pins
  const currentEditingPin = editingPin
    ? pins.find((p) => p.id === editingPin.id) ?? editingPin
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopBar
        onAddressSelect={handleAddressSelect}
        onAddPin={handleAddPin}
        onToggleSidebar={handleToggleSidebar}
        pinCount={loading ? 0 : pins.length}
      />

      {/* Map + Sidebar row */}
      <div style={{ flex: 1, display: "flex", position: "relative" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <MapView
            pins={pins}
            onPinClick={handlePinClick}
            onMapClick={handleMapClick}
          />

          {addPinMode && (
            <div
              style={{
                position: "absolute",
                top: 12,
                left: "50%",
                transform: "translateX(-50%)",
                background: "#3b82f6",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                zIndex: 1002,
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                cursor: "pointer",
              }}
              onClick={() => setAddPinMode(false)}
            >
              Click on the map to place a pin (click here to cancel)
            </div>
          )}

          {selectedPin && !editingPin && (
            <PinPopup
              pin={selectedPin}
              onEdit={handleEdit}
              onClose={() => setSelectedPin(null)}
            />
          )}

          {currentEditingPin && (
            <EditPanel
              pin={currentEditingPin}
              onClose={handleEditClose}
              onUpdate={refresh}
            />
          )}
        </div>

        {sidebarOpen && (
          <Sidebar
            pins={pins}
            onPinClick={handleSidebarPinClick}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

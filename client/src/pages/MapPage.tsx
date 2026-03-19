import { useState } from "react";
import { usePins } from "../hooks/usePins";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useAuth } from "../hooks/useAuth";
import MapView from "../components/MapView";
import TopBar from "../components/TopBar";
import PinPopup from "../components/PinPopup";
import EditPanel from "../components/EditPanel";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import BottomSheet from "../components/BottomSheet";
import { createPin } from "../services/pins";
import type { Pin } from "../types";

type MobileTab = "map" | "list" | "account";

export default function MapPage() {
  const { pins, loading, refresh } = usePins();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("map");

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
    if (isMobile) setMobileTab("map");
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

  // --- Mobile Layout ---
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <TopBar
          onAddressSelect={handleAddressSelect}
          onAddPin={handleAddPin}
          onToggleSidebar={handleToggleSidebar}
          pinCount={loading ? 0 : pins.length}
          hideSidebarToggle
        />

        <div style={{ flex: 1, position: "relative", paddingBottom: 56 }}>
          {mobileTab === "map" && (
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
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
                  Tap map to place pin (tap here to cancel)
                </div>
              )}

              {/* Floating add button */}
              <button
                onClick={handleAddPin}
                style={{
                  position: "absolute",
                  bottom: 16,
                  right: 16,
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  fontSize: 28,
                  fontWeight: 700,
                  cursor: "pointer",
                  zIndex: 1002,
                  boxShadow: "0 4px 12px rgba(59,130,246,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                +
              </button>

              {/* Pin selected -> BottomSheet */}
              {selectedPin && !editingPin && (
                <BottomSheet onClose={() => setSelectedPin(null)}>
                  <div style={{ padding: 16, color: "#e5e7eb" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedPin.name}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{selectedPin.address}</div>
                      </div>
                      <button
                        onClick={() => handleEdit(selectedPin)}
                        style={{
                          background: "#3b82f6",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          padding: "6px 14px",
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                    </div>
                    {selectedPin.floorPlans.length > 0 ? (
                      <div style={{ fontSize: 13, color: "#94a3b8" }}>
                        {selectedPin.floorPlans.length} floor plan{selectedPin.floorPlans.length > 1 ? "s" : ""}
                        {(() => {
                          const rents = selectedPin.floorPlans
                            .map((fp) => fp.rent)
                            .filter((r): r is number => r !== null);
                          if (rents.length === 0) return null;
                          const min = Math.min(...rents);
                          return ` \u00b7 from $${min.toLocaleString()}/mo`;
                        })()}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: "#6b7280" }}>No floor plans yet.</div>
                    )}
                  </div>
                </BottomSheet>
              )}

              {/* Editing -> full screen overlay */}
              {currentEditingPin && (
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 3000,
                    background: "#1e1e36",
                    overflowY: "auto",
                  }}
                >
                  <EditPanel
                    pin={currentEditingPin}
                    onClose={handleEditClose}
                    onUpdate={refresh}
                  />
                </div>
              )}
            </div>
          )}

          {mobileTab === "list" && (
            <div
              style={{
                width: "100%",
                height: "100%",
                overflowY: "auto",
                background: "#1e1e36",
              }}
            >
              <Sidebar
                pins={pins}
                onPinClick={handleSidebarPinClick}
                onClose={() => setMobileTab("map")}
              />
            </div>
          )}

          {mobileTab === "account" && (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                color: "#e5e7eb",
                background: "#0f172a",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#334155",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                }}
              >
                {"\uD83D\uDC64"}
              </div>
              {user && (
                <div style={{ fontSize: 16, color: "#94a3b8" }}>
                  {user.email}
                </div>
              )}
              <button
                onClick={logout}
                style={{
                  padding: "10px 32px",
                  borderRadius: 6,
                  border: "1px solid #475569",
                  background: "transparent",
                  color: "#e2e8f0",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>

        <BottomNav activeTab={mobileTab} onTabChange={setMobileTab} />
      </div>
    );
  }

  // --- Desktop Layout ---
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

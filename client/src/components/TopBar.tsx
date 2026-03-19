import AddressSearch from "./AddressSearch";
import { useAuth } from "../hooks/useAuth";

interface TopBarProps {
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  onAddPin: () => void;
  onToggleSidebar: () => void;
  pinCount: number;
  hideSidebarToggle?: boolean;
}

export default function TopBar({
  onAddressSelect,
  onAddPin,
  onToggleSidebar,
  pinCount,
  hideSidebarToggle,
}: TopBarProps) {
  const { user, logout } = useAuth();

  const buttonStyle: React.CSSProperties = {
    padding: "6px 12px",
    borderRadius: 4,
    border: "1px solid #475569",
    background: "transparent",
    color: "#e2e8f0",
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 16px",
        background: "#1e293b",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
        flexShrink: 0,
      }}
    >
      {/* Logo / app name */}
      <span style={{ fontWeight: 600, fontSize: 18, whiteSpace: "nowrap" }}>
        Housing Map
      </span>

      {/* Address search */}
      <AddressSearch onSelect={onAddressSelect} />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Add Pin button — hidden on mobile (uses FAB instead) */}
      {!hideSidebarToggle && (
        <button onClick={onAddPin} style={buttonStyle}>
          + Add Pin
        </button>
      )}

      {/* Sidebar toggle — hidden on mobile (uses BottomNav) */}
      {!hideSidebarToggle && (
        <button onClick={onToggleSidebar} style={buttonStyle}>
          ☰ List ({pinCount})
        </button>
      )}

      {/* User info + logout — hidden on mobile (uses Account tab) */}
      {!hideSidebarToggle && user && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap" }}>
            {user.email}
          </span>
          <button
            onClick={logout}
            style={{
              ...buttonStyle,
              border: "none",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

import type { Pin } from "../types";

interface SidebarProps {
  pins: Pin[];
  onPinClick: (pin: Pin) => void;
  onClose: () => void;
  onPinHover?: (pinId: string | null) => void;
}

const AMENITY_COLORS: Record<string, string> = {
  "W/D": "#4fc3f7",
  "Pool": "#81c784",
  "Gym": "#ffb74d",
  "Parking": "#ce93d8",
  "Pet": "#f48fb1",
  "AC": "#90caf9",
  "Balcony": "#a5d6a7",
  "Dishwasher": "#fff176",
};

function getAmenityColor(label: string): string {
  for (const [key, color] of Object.entries(AMENITY_COLORS)) {
    if (label.toLowerCase().includes(key.toLowerCase())) return color;
  }
  // Deterministic fallback color from label
  const hash = label.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 60%, 70%)`;
}

function formatPlanSummary(pin: Pin): string | null {
  const plans = pin.floorPlans;
  if (plans.length === 0) return null;
  const rents = plans.map((p) => p.rent).filter((r): r is number => r !== null);
  const minRent = rents.length > 0 ? Math.min(...rents) : null;
  const planLabel = plans.length === 1 ? "1 plan" : `${plans.length} plans`;
  if (minRent !== null) {
    return `${planLabel} \u00b7 from $${minRent.toLocaleString()}/mo`;
  }
  return planLabel;
}

function collectAmenities(pin: Pin): string[] {
  const seen = new Set<string>();
  for (const fp of pin.floorPlans) {
    for (const a of fp.amenities) {
      if (a.checked) seen.add(a.label);
    }
  }
  return Array.from(seen).slice(0, 4);
}

export default function Sidebar({ pins, onPinClick, onClose, onPinHover }: SidebarProps) {
  return (
    <div
      style={{
        width: 240,
        minWidth: 240,
        background: "#1e1e36",
        borderLeft: "1px solid #333",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        color: "#fff",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 14px",
          borderBottom: "1px solid #333",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          All Apartments ({pins.length})
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#aaa",
            cursor: "pointer",
            fontSize: 16,
            padding: "0 2px",
          }}
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {pins.map((pin) => {
          const summary = formatPlanSummary(pin);
          const amenities = collectAmenities(pin);
          return (
            <div
              key={pin.id}
              onClick={() => onPinClick(pin)}
              style={{
                padding: "10px 12px",
                margin: "4px 8px",
                borderRadius: 6,
                borderLeft: `4px solid ${pin.color || "#888"}`,
                background: "#28284a",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#32326a";
                onPinHover?.(pin.id);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#28284a";
                onPinHover?.(null);
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                📍 {pin.name}
              </div>
              {pin.address && (
                <div style={{ color: "#999", fontSize: 11, marginBottom: 4 }}>
                  {pin.address}
                </div>
              )}
              {summary && (
                <div style={{ fontSize: 11, color: "#ccc", marginBottom: 4 }}>
                  {summary}
                </div>
              )}
              {amenities.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                  {amenities.map((label) => (
                    <span
                      key={label}
                      style={{
                        fontSize: 9,
                        padding: "1px 5px",
                        borderRadius: 3,
                        background: getAmenityColor(label),
                        color: "#1e1e36",
                        fontWeight: 600,
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

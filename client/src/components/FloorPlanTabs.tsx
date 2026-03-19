import type { FloorPlan } from "../types";

interface FloorPlanTabsProps {
  floorPlans: FloorPlan[];
  activeIndex: number;
  onTabClick: (index: number) => void;
  onAddTab?: () => void;
  onDeleteTab?: (index: number) => void;
  showAdd?: boolean;
}

function formatRent(rent: number | null): string {
  if (rent === null) return "";
  return `$${rent.toLocaleString()}`;
}

export default function FloorPlanTabs({
  floorPlans,
  activeIndex,
  onTabClick,
  onAddTab,
  onDeleteTab,
  showAdd,
}: FloorPlanTabsProps) {
  const canDelete = onDeleteTab && floorPlans.length > 1;

  return (
    <div style={{ maxWidth: "100%", overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          flexWrap: "nowrap",
          gap: 4,
          borderBottom: "1px solid #3b82f6",
          paddingBottom: 0,
        }}
      >
        {floorPlans.map((fp, i) => {
          const isActive = i === activeIndex;
          const label = fp.rent !== null ? `${fp.name} ${formatRent(fp.rent)}` : fp.name;
          return (
            <button
              key={fp.id}
              onClick={() => onTabClick(i)}
              style={{
                position: "relative",
                padding: canDelete ? "6px 20px 6px 14px" : "6px 14px",
                cursor: "pointer",
                background: "transparent",
                color: isActive ? "#93c5fd" : "#9ca3af",
                border: "none",
                borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent",
                fontWeight: isActive ? 600 : 400,
                fontSize: 13,
                whiteSpace: "nowrap",
                marginBottom: -1,
              }}
            >
              {label}
              {canDelete && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Delete this floor plan?")) {
                      onDeleteTab(i);
                    }
                  }}
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 14,
                    height: 14,
                    lineHeight: "14px",
                    textAlign: "center",
                    fontSize: 10,
                    color: "#9ca3af",
                    cursor: "pointer",
                    borderRadius: "50%",
                  }}
                >
                  ×
                </span>
              )}
            </button>
          );
        })}
        {showAdd && onAddTab && (
          <button
            onClick={onAddTab}
            style={{
              padding: "6px 14px",
              cursor: "pointer",
              background: "transparent",
              color: "#9ca3af",
              border: "none",
              borderBottom: "2px solid transparent",
              fontSize: 13,
              whiteSpace: "nowrap",
              marginBottom: -1,
            }}
          >
            + Add
          </button>
        )}
      </div>
    </div>
  );
}

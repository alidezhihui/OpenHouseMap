import type { FloorPlan } from "../types";

interface FloorPlanTabsProps {
  floorPlans: FloorPlan[];
  activeIndex: number;
  onTabClick: (index: number) => void;
  onAddTab?: () => void;
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
  showAdd,
}: FloorPlanTabsProps) {
  return (
    <div
      style={{
        display: "flex",
        overflowX: "auto",
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
              padding: "6px 14px",
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
  );
}

type Tab = "map" | "list" | "account";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: "map", icon: "\uD83D\uDDFA\uFE0F", label: "Map" },
  { id: "list", icon: "\uD83D\uDCCB", label: "List" },
  { id: "account", icon: "\uD83D\uDC64", label: "Account" },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        background: "#1e293b",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 2000,
        borderTop: "1px solid #334155",
      }}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              background: "none",
              border: "none",
              color: active ? "#3b82f6" : "#94a3b8",
              fontSize: 20,
              cursor: "pointer",
              padding: "6px 0",
            }}
          >
            <span>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

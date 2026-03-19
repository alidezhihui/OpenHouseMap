import type { ReactNode } from "react";

interface BottomSheetProps {
  children: ReactNode;
  onClose: () => void;
}

export default function BottomSheet({ children, onClose }: BottomSheetProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 56,
        left: 0,
        right: 0,
        maxHeight: "60vh",
        background: "#1e1e36",
        borderTop: "3px solid #3b82f6",
        borderRadius: "16px 16px 0 0",
        zIndex: 1500,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Drag handle */}
      <div
        onClick={onClose}
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "10px 0 6px",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: "#4b5563",
          }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
    </div>
  );
}

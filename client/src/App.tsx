import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "#0f172a",
  color: "#e2e8f0",
  fontFamily: "system-ui, sans-serif",
  gap: "16px",
};

const logoutBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "6px",
  border: "1px solid #334155",
  background: "transparent",
  color: "#e2e8f0",
  cursor: "pointer",
  fontSize: "14px",
};

function MapPage() {
  const { user, logout } = useAuth();
  return (
    <div style={pageStyle}>
      <h1 style={{ margin: 0 }}>Welcome, {user?.email}!</h1>
      <p style={{ margin: 0, color: "#94a3b8" }}>Map coming soon.</p>
      <button style={logoutBtnStyle} onClick={logout}>
        Log out
      </button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MapPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

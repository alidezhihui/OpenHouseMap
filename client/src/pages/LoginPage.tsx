import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#0f172a",
  color: "#e2e8f0",
  fontFamily: "system-ui, sans-serif",
};

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  width: "320px",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "6px",
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#e2e8f0",
  fontSize: "14px",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px",
  borderRadius: "6px",
  border: "none",
  background: "#3b82f6",
  color: "#fff",
  fontSize: "14px",
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = {
  color: "#f87171",
  fontSize: "13px",
  margin: 0,
};

const linkStyle: React.CSSProperties = {
  color: "#60a5fa",
  textDecoration: "none",
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Login failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={containerStyle}>
      <form style={formStyle} onSubmit={handleSubmit}>
        <h1 style={{ margin: 0, fontSize: "24px", textAlign: "center" }}>
          Log In
        </h1>
        {error && <p style={errorStyle}>{error}</p>}
        <input
          style={inputStyle}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={inputStyle}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button style={buttonStyle} type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Log In"}
        </button>
        <p style={{ margin: 0, fontSize: "13px", textAlign: "center" }}>
          Don't have an account?{" "}
          <Link to="/register" style={linkStyle}>
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}

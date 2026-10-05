import React from "react";
import { Link } from "react-router-dom";

export const NotFoundPage: React.FC = () => {
  return (
    <div style={{ textAlign: "center", padding: "5rem 1.5rem", maxWidth: "480px", margin: "0 auto" }}>
      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔍 404</div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Page Not Found
      </h1>
      <p style={{ color: "#64748b", marginBottom: "2rem", lineHeight: 1.6 }}>
        The page you are looking for doesn't exist or may have been moved.
      </p>
      <Link
        to="/dashboard"
        className="btn btn-primary"
        style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem" }}
      >
        <span>🍽️ Go to Dashboard</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;

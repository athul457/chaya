import React, { useState } from "react";
import type { AppUser } from "../types";
import { signInUser, signUpUser } from "../lib/auth";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AppUser) => void;
}

const AuthModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setErrorMsg("");
    setInfoMsg("");
  };

  const handleTabSwitch = (newMode: "login" | "register") => {
    setMode(newMode);
    setErrorMsg("");
    setInfoMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        setErrorMsg("Please enter your name.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }

      setLoading(true);
      const res = await signUpUser(name, email, password);
      setLoading(false);

      if (res.success && res.user) {
        if (res.requiresEmailConfirmation) {
          setInfoMsg("Account created! A confirmation email may be sent, but you are signed in for this session.");
        }
        onSuccess(res.user);
        resetForm();
        onClose();
      } else {
        setErrorMsg(res.error || "Failed to register. Please try again.");
      }
    } else {
      setLoading(true);
      const res = await signInUser(email, password);
      setLoading(false);

      if (res.success && res.user) {
        onSuccess(res.user);
        resetForm();
        onClose();
      } else {
        setErrorMsg(res.error || "Invalid email or password.");
      }
    }
  };

  const handleQuickDemoUser = async (demoName: string) => {
    const demoEmail = `${demoName.toLowerCase().replace(/\s+/g, "")}@splitwale.demo`;
    setLoading(true);
    const res = await signInUser(demoEmail, "password123");
    setLoading(false);
    if (res.success && res.user) {
      onSuccess({ ...res.user, name: demoName });
      resetForm();
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box auth-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="group-modal-title-row">
            <span className="auth-header-icon">🔐</span>
            <div>
              <h2 className="modal-title">
                {mode === "login" ? "Sign In to Splitwale" : "Create a Splitwale Account"}
              </h2>
              <p className="modal-subtitle">
                {mode === "login"
                  ? "Access your saved orders, favorites & group carts"
                  : "Join to save orders, participate in group carts & faster checkout"}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        {/* Tab selection */}
        <div className="group-tab-buttons auth-tabs">
          <button
            type="button"
            className={`group-tab-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => handleTabSwitch("login")}
          >
            🔑 Sign In
          </button>
          <button
            type="button"
            className={`group-tab-btn ${mode === "register" ? "active" : ""}`}
            onClick={() => handleTabSwitch("register")}
          >
            ✨ Register New Account
          </button>
        </div>

        {errorMsg && (
          <div className="auth-alert auth-alert--error">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="auth-alert auth-alert--info">
            <span>ℹ️</span>
            <span>{infoMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="group-form auth-form">
          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Arun Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. arun@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus={mode === "login"}
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Password *</label>
              <button
                type="button"
                className="text-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              className="form-input"
              placeholder={mode === "register" ? "At least 6 characters" : "Enter password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Re-type your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <div className="modal-actions auth-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign In ➔"
                : "Create Account ➔"}
            </button>
          </div>
        </form>

        {/* Quick Demo Logins for Testing */}
        <div className="auth-quick-demo-section">
          <span className="demo-divider-text">Quick 1-Click Demo Profiles</span>
          <div className="demo-chips-grid">
            <button
              type="button"
              className="demo-chip-btn"
              onClick={() => handleQuickDemoUser("Member 1 (Arun)")}
            >
              👤 Member 1 (Arun)
            </button>
            <button
              type="button"
              className="demo-chip-btn"
              onClick={() => handleQuickDemoUser("Member 2 (Bala)")}
            >
              👤 Member 2 (Bala)
            </button>
            <button
              type="button"
              className="demo-chip-btn"
              onClick={() => handleQuickDemoUser("Member 3 (Charlie)")}
            >
              👤 Member 3 (Charlie)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

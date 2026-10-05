import React, { useState } from "react";
import type { AppUser } from "../types";
import { signInUser, signUpUser } from "../lib/auth";

interface Props {
  onLoginSuccess: (user: AppUser) => void;
  initialView?: "register" | "login";
}

const LandingAuthPage: React.FC<Props> = ({ onLoginSuccess, initialView = "register" }) => {
  // Landing page defaults to register page as requested
  const [view, setView] = useState<"register" | "login">(initialView);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successBanner, setSuccessBanner] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessBanner("");

    if (!name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter email and password.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    const res = await signUpUser(name, email, password);
    setLoading(false);

    if (res.success) {
      // Transition directly to the login page as requested!
      setView("login");
      setSuccessBanner(
        `🎉 Registration successful for ${name.trim()}! Please sign in with your email and password to enter the dashboard.`
      );
      setPassword("");
      setConfirmPassword("");
    } else {
      setErrorMsg(res.error || "Failed to register. Please try again.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter your email and password.");
      return;
    }

    setLoading(true);
    const res = await signInUser(email, password);
    setLoading(false);

    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setErrorMsg(res.error || "Invalid email or password. Please try again.");
    }
  };

  const handleQuickDemo = async (demoName: string) => {
    const demoEmail = `${demoName.toLowerCase().replace(/[^a-z0-9]/g, "")}@splitwale.demo`;
    setLoading(true);
    const res = await signInUser(demoEmail, "password123");
    setLoading(false);
    if (res.success && res.user) {
      onLoginSuccess({ ...res.user, name: demoName });
    }
  };

  return (
    <div className="landing-page-wrap">
      {/* Decorative gradient background circles */}
      <div className="landing-blob landing-blob--1" />
      <div className="landing-blob landing-blob--2" />

      {/* Top minimal header */}
      <header className="landing-top-bar">
        <div className="landing-brand">
          <span className="landing-brand-logo">🍽️</span>
          <span className="landing-brand-name">Splitwale</span>
        </div>
        <div className="landing-nav-switch">
          {view === "register" ? (
            <span className="switch-text">
              Already have an account?{" "}
              <button
                type="button"
                className="link-switch-btn"
                onClick={() => {
                  setView("login");
                  setErrorMsg("");
                }}
              >
                Sign In ➔
              </button>
            </span>
          ) : (
            <span className="switch-text">
              New to Splitwale?{" "}
              <button
                type="button"
                className="link-switch-btn"
                onClick={() => {
                  setView("register");
                  setErrorMsg("");
                  setSuccessBanner("");
                }}
              >
                Register Here ➔
              </button>
            </span>
          )}
        </div>
      </header>

      {/* Main Landing & Auth Container */}
      <main className="landing-main-container">
        {/* Left Side: Brand Story & Features */}
        <div className="landing-hero-col">
          <div className="landing-hero-badge">
            <span>✨ Live Multi-Device Food Court Ordering</span>
          </div>

          <h1 className="landing-hero-heading">
            Order Together. <br />
            <span className="gradient-text">Share the Food,</span> <br />
            Not the Confusion.
          </h1>

          <p className="landing-hero-description">
            Experience real-time collaborative ordering at food courts and street stalls.
            Every friend picks items on their own phone, and the combined group total calculates live!
          </p>

          <div className="landing-feature-cards">
            <div className="landing-feature-card">
              <span className="feature-icon">👥</span>
              <div>
                <h4>Collaborative Live Cart</h4>
                <p>3 friends, 3 phones, 1 shared table. Updates sync in milliseconds.</p>
              </div>
            </div>

            <div className="landing-feature-card">
              <span className="feature-icon">🏪</span>
              <div>
                <h4>Multiple Food Stalls</h4>
                <p>Browse Doshakkada, Tapas, Black Coffee, or add your own custom shop.</p>
              </div>
            </div>

            <div className="landing-feature-card">
              <span className="feature-icon">🧾</span>
              <div>
                <h4>Itemized Group Bill</h4>
                <p>Clear breakdown of who ordered what, with grand total for counter payment.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card (Register / Login) */}
        <div className="landing-auth-col">
          <div className="landing-auth-card">
            {/* Form Mode Header */}
            <div className="auth-card-header">
              <div className="auth-icon-badge">
                {view === "register" ? "📝" : "🔑"}
              </div>
              <h2 className="auth-card-title">
                {view === "register" ? "Create Your Account" : "Welcome Back"}
              </h2>
              <p className="auth-card-sub">
                {view === "register"
                  ? "Register to access the shop dashboard & start ordering"
                  : "Sign in with your email to view food courts & your orders"}
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="group-tab-buttons landing-tab-switch">
              <button
                type="button"
                className={`group-tab-btn ${view === "register" ? "active" : ""}`}
                onClick={() => {
                  setView("register");
                  setErrorMsg("");
                }}
              >
                ✨ Register
              </button>
              <button
                type="button"
                className={`group-tab-btn ${view === "login" ? "active" : ""}`}
                onClick={() => {
                  setView("login");
                  setErrorMsg("");
                }}
              >
                🔑 Sign In
              </button>
            </div>

            {/* Success Banner (e.g. after successful registration) */}
            {successBanner && view === "login" && (
              <div className="auth-alert auth-alert--success">
                <span>✅</span>
                <span>{successBanner}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="auth-alert auth-alert--error">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            {view === "register" ? (
              <form onSubmit={handleRegister} className="group-form auth-form">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Member 1 / Arun Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. arun@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

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

                <button
                  type="submit"
                  className="btn btn-primary btn-auth-submit"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Register Now ➔"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="group-form auth-form">
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. arun@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
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
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-auth-submit"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In to Dashboard ➔"}
                </button>
              </form>
            )}

            {/* Quick 1-Click Demo Profiles */}
            <div className="auth-quick-demo-section">
              <span className="demo-divider-text">Or test with 1-Click Demo Profile</span>
              <div className="demo-chips-grid">
                <button
                  type="button"
                  className="demo-chip-btn"
                  onClick={() => handleQuickDemo("Member 1 (Arun)")}
                >
                  👤 Member 1 (Arun)
                </button>
                <button
                  type="button"
                  className="demo-chip-btn"
                  onClick={() => handleQuickDemo("Member 2 (Bala)")}
                >
                  👤 Member 2 (Bala)
                </button>
                <button
                  type="button"
                  className="demo-chip-btn"
                  onClick={() => handleQuickDemo("Member 3 (Charlie)")}
                >
                  👤 Member 3 (Charlie)
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingAuthPage;

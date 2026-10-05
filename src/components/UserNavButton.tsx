import React, { useState, useRef, useEffect } from "react";
import type { AppUser } from "../types";

interface Props {
  user: AppUser | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const UserNavButton: React.FC<Props> = ({ user, onOpenAuth, onSignOut }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [dropdownOpen]);

  const handleCopyId = () => {
    if (!user) return;
    const idToCopy = user.userTag || user.id;
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (!user) {
    return (
      <button
        type="button"
        className="btn-nav-auth"
        onClick={onOpenAuth}
        title="Sign in or register an account"
      >
        <span>👤 Sign In</span>
      </button>
    );
  }

  const displayTag = user.userTag || `USR-${user.id.slice(-4).toUpperCase()}`;

  return (
    <div className="user-nav-container" ref={dropdownRef}>
      <button
        type="button"
        className="btn-user-profile"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        title="View your account & Shareable ID"
        aria-expanded={dropdownOpen}
      >
        <span
          className="user-avatar-circle"
          style={{ backgroundColor: user.avatarColor || "#f97316" }}
        >
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div className="user-nav-names">
          <span className="user-profile-name">{user.name}</span>
          <span className="user-tag-pill">{displayTag}</span>
        </div>
        <span className="user-chevron">{dropdownOpen ? "▲" : "▼"}</span>
      </button>

      {dropdownOpen && (
        <div className="user-dropdown-menu">
          <div className="dropdown-user-info">
            <span
              className="dropdown-avatar-large"
              style={{ backgroundColor: user.avatarColor || "#f97316" }}
            >
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="dropdown-text">
              <h4 className="dropdown-name">{user.name}</h4>
              <p className="dropdown-email">{user.email}</p>
            </div>
          </div>

          {/* Shareable User ID Section */}
          <div className="user-id-share-card">
            <div className="user-id-share-header">
              <span className="user-id-title">🔑 Your Unique ID</span>
              <span className="user-id-badge-large">{displayTag}</span>
            </div>
            <button
              type="button"
              className="btn-copy-user-id"
              onClick={handleCopyId}
            >
              {copiedId ? "✓ Copied to Clipboard!" : "📋 Copy ID to Share"}
            </button>
            <p className="user-id-hint">
              Give this ID to friends so they can add you directly to their table!
            </p>
          </div>

          <div className="dropdown-divider" />

          <button
            type="button"
            className="dropdown-item dropdown-logout-btn"
            onClick={() => {
              setDropdownOpen(false);
              onSignOut();
            }}
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserNavButton;

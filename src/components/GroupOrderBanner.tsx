import React, { useState } from "react";
import type { GroupSession, GroupMember } from "../types";

interface Props {
  session: GroupSession;
  currentMemberId: string | null;
  onOpenModal: () => void;
  onOpenBill: () => void;
  onLeave: () => void;
}

export const GroupOrderBanner: React.FC<Props> = ({
  session,
  currentMemberId,
  onOpenModal,
  onOpenBill,
  onLeave,
}) => {
  const [copied, setCopied] = useState(false);

  const membersList: GroupMember[] = Object.values(session.members);

  const totalItemCount = membersList.reduce(
    (sum, m) => sum + m.items.reduce((s, i) => s + i.count, 0),
    0
  );

  const grandTotal = membersList.reduce(
    (sum, m) => sum + m.items.reduce((s, i) => s + i.price * i.count, 0),
    0
  );

  const copyInvite = () => {
    const groupId = session.id || session.tableCode || "";
    navigator.clipboard.writeText(groupId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group-order-banner">
      <div className="group-banner-inner">
        {/* Left: Table details */}
        <div className="group-banner-left">
          <div className="banner-table-pill" onClick={onOpenModal}>
            <span className="pulse-indicator"></span>
            <span className="banner-table-text">👥 {session.name || "Friends Group"}</span>
            <span className="banner-group-id-pill">ID: {session.id || session.tableCode}</span>
          </div>

          <div className="banner-court-info">
            <span className="banner-court-tag">
              {session.courtEmoji} {session.courtName}
            </span>
          </div>

          {/* Members chips */}
          <div className="banner-members-chips" onClick={onOpenModal}>
            {membersList.map((m) => {
              const isMe = m.id === currentMemberId;
              const count = m.items.reduce((acc, i) => acc + i.count, 0);
              return (
                <span
                  key={m.id}
                  className={`member-chip ${isMe ? "member-chip--me" : ""}`}
                  title={`${m.name}: ${count} item${count === 1 ? "" : "s"}`}
                >
                  <span className="member-chip-dot" style={{ backgroundColor: m.avatarColor }}>
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="member-chip-name">{m.name}</span>
                  {count > 0 && <span className="member-chip-count">{count}</span>}
                </span>
              );
            })}
          </div>
        </div>

        {/* Right: Actions & Group Total */}
        <div className="group-banner-right">
          <button
            type="button"
            className="banner-action-btn banner-add-friend-btn"
            onClick={onOpenModal}
            title="Add a friend by User ID"
          >
            <span>➕ Add Friend</span>
          </button>

          <button
            type="button"
            className="banner-action-btn banner-invite-btn"
            onClick={copyInvite}
            title={`Copy Group ID (${session.id || session.tableCode}) to share with friends`}
          >
            {copied ? "✓ Copied!" : `📋 Copy ID`}
          </button>

          <button
            type="button"
            className="banner-action-btn banner-bill-btn"
            onClick={onOpenBill}
            title="View group breakdown and total bill"
          >
            <span>Bill:</span>
            <strong>₹{grandTotal.toFixed(2)}</strong>
            <span className="banner-bill-count">({totalItemCount})</span>
          </button>

          <button
            type="button"
            className="banner-action-btn banner-leave-btn"
            onClick={() => {
              if (window.confirm("Are you sure you want to exit and leave this group table?")) {
                onLeave();
              }
            }}
            title="Exit group table"
          >
            <span>🚪 Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupOrderBanner;

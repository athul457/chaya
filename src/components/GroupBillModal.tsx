import React, { useState } from "react";
import type { GroupSession, GroupMember } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session: GroupSession;
  currentMemberId: string | null;
}

const GroupBillModal: React.FC<Props> = ({ isOpen, onClose, session, currentMemberId }) => {
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!isOpen) return null;

  const membersList: GroupMember[] = Object.values(session.members);
  const myMember = currentMemberId ? session.members[currentMemberId] : null;
  const otherMembers = membersList.filter((m) => m.id !== currentMemberId);

  const grandTotal = membersList.reduce(
    (sum, m) => sum + m.items.reduce((s, i) => s + i.price * i.count, 0),
    0
  );

  const totalItemCount = membersList.reduce(
    (sum, m) => sum + m.items.reduce((s, i) => s + i.count, 0),
    0
  );

  const mySubtotal = myMember
    ? myMember.items.reduce((s, i) => s + i.price * i.count, 0)
    : 0;
  const myItemCount = myMember
    ? myMember.items.reduce((s, i) => s + i.count, 0)
    : 0;
  const othersTotal = grandTotal - mySubtotal;

  // Aggregate items ordered across the whole team
  const teamItemsMap = new Map<string, { name: string; price: number; count: number }>();
  membersList.forEach((m) => {
    m.items.forEach((item) => {
      const existing = teamItemsMap.get(item.name);
      if (existing) {
        existing.count += item.count;
      } else {
        teamItemsMap.set(item.name, {
          name: item.name,
          price: item.price,
          count: item.count,
        });
      }
    });
  });
  const teamAggregatedItems = Array.from(teamItemsMap.values());

  const copyBillText = () => {
    let text = `🍽️ Group: ${session.name} (ID: ${session.id || session.tableCode})\n`;
    text += `Food Court: ${session.courtName}\n`;
    text += `──────────────────────────────────────\n`;

    if (myMember) {
      text += `👤 YOUR PERSONAL SHARE (${myMember.name}):\n`;
      if (myMember.items.length === 0) {
        text += `   (No items yet)\n`;
      } else {
        myMember.items.forEach((item) => {
          text += `   • ${item.count}x ${item.name} (@ ₹${item.price}) = ₹${(item.price * item.count).toFixed(2)}\n`;
        });
      }
      text += `   Your Subtotal: ₹${mySubtotal.toFixed(2)}\n\n`;
    }

    if (otherMembers.length > 0) {
      text += `👥 REST OF THE TEAM:\n`;
      otherMembers.forEach((m) => {
        const sub = m.items.reduce((s, i) => s + i.price * i.count, 0);
        text += `   👤 ${m.name} (${m.userTag || m.id}):\n`;
        if (m.items.length === 0) {
          text += `      (No items yet)\n`;
        } else {
          m.items.forEach((item) => {
            text += `      • ${item.count}x ${item.name} = ₹${(item.price * item.count).toFixed(2)}\n`;
          });
        }
        text += `      Subtotal: ₹${sub.toFixed(2)}\n`;
      });
      text += `\n`;
    }

    text += `🍱 WHOLE TEAM FOOD BASKET:\n`;
    teamAggregatedItems.forEach((i) => {
      text += `   • ${i.count}x ${i.name} = ₹${(i.price * i.count).toFixed(2)}\n`;
    });

    text += `──────────────────────────────────────\n`;
    text += `💰 GRAND TOTAL: ₹${grandTotal.toFixed(2)} (${totalItemCount} items)\n`;
    text += `   Your Share: ₹${mySubtotal.toFixed(2)} | Team Share: ₹${othersTotal.toFixed(2)}\n`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2200);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box group-bill-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="group-active-badge">Group Order Bill Breakdown</span>
            <h2 className="modal-title">{session.name}</h2>
            <p className="modal-subtitle">
              {session.courtEmoji} {session.courtName} • Group ID: <strong>{session.id || session.tableCode}</strong>
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        {/* 1. Grand Total & Split Summary Hero */}
        <div className="bill-grand-total-card">
          <div className="bill-grand-label">Grand Total Bill</div>
          <div className="bill-grand-amount">₹{grandTotal.toFixed(2)}</div>
          <div className="bill-split-summary-bar">
            <span className="split-stat split-stat--you">
              👤 Your Share: <strong>₹{mySubtotal.toFixed(2)}</strong> ({myItemCount} items)
            </span>
            <span className="dot-sep">•</span>
            <span className="split-stat split-stat--team">
              👥 Team's Share: <strong>₹{othersTotal.toFixed(2)}</strong> ({totalItemCount - myItemCount} items)
            </span>
          </div>
        </div>

        {/* 2. Your Personal Eaten Items */}
        {myMember && (
          <div className="bill-my-order-section">
            <div className="bill-section-badge-row">
              <span className="section-pill-tag section-pill-tag--me">👤 YOUR PERSONAL ITEMS</span>
              <span className="section-subtotal-val">Your Subtotal: ₹{mySubtotal.toFixed(2)}</span>
            </div>

            {myMember.items.length === 0 ? (
              <p className="bill-empty-member">You haven't selected any items yet.</p>
            ) : (
              <ul className="bill-items-list my-items-highlight-list">
                {myMember.items.map((item) => (
                  <li key={item.itemId} className="bill-item-row">
                    <span className="bill-item-name">
                      <strong className="bill-item-count">{item.count}×</strong> {item.name}
                    </span>
                    <span className="bill-item-price">
                      ₹{(item.price * item.count).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 3. Whole Team Breakdown */}
        {otherMembers.length > 0 && (
          <div className="bill-members-list">
            <h3 className="bill-section-title">👥 Team Members' Orders & Share</h3>

            {otherMembers.map((m) => {
              const subtotal = m.items.reduce((s, i) => s + i.price * i.count, 0);
              const count = m.items.reduce((s, i) => s + i.count, 0);

              return (
                <div key={m.id} className="bill-member-card">
                  <div className="bill-member-header">
                    <div className="bill-member-user">
                      <span
                        className="bill-member-avatar"
                        style={{ backgroundColor: m.avatarColor }}
                      >
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <h4 className="bill-member-name">
                          {m.name} {m.isHost && <span className="host-tag">Host</span>}
                        </h4>
                        <span className="bill-member-items-summary">
                          {m.userTag && <span className="member-tag-badge">{m.userTag}</span>} • {count} item{count === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                    <div className="bill-member-subtotal">
                      <span className="subtotal-label">Share:</span>
                      <strong className="subtotal-amount">₹{subtotal.toFixed(2)}</strong>
                    </div>
                  </div>

                  {m.items.length === 0 ? (
                    <p className="bill-empty-member">Hasn't added any items yet</p>
                  ) : (
                    <ul className="bill-items-list">
                      {m.items.map((item) => (
                        <li key={item.itemId} className="bill-item-row">
                          <span className="bill-item-name">
                            <span className="bill-item-count">{item.count}×</span> {item.name}
                          </span>
                          <span className="bill-item-price">
                            ₹{(item.price * item.count).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Combined Whole Team Food Items */}
        {teamAggregatedItems.length > 0 && (
          <div className="bill-team-basket-section">
            <h3 className="bill-section-title">🍱 Whole Team Food Items (All Dishes Combined)</h3>
            <div className="team-basket-grid">
              {teamAggregatedItems.map((item) => (
                <div key={item.name} className="team-basket-item">
                  <span className="basket-item-count">{item.count}×</span>
                  <span className="basket-item-name">{item.name}</span>
                  <span className="basket-item-price">₹{(item.price * item.count).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explanation Note */}
        <div className="bill-counter-note">
          <span>💡</span>
          <p>
            One person can pay the grand total of <strong>₹{grandTotal.toFixed(2)}</strong> at the
            counter. The breakdown shows what each team member owes!
          </p>
        </div>

        {/* Actions */}
        <div className="modal-actions group-bill-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={copyBillText}
            title="Copy breakdown text to share with friends"
          >
            {copiedSummary ? "✓ Bill Copied to Clipboard!" : "📋 Copy Bill Summary"}
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupBillModal;

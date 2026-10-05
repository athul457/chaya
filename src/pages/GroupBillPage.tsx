import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGroupOrder } from "../context/GroupOrderContext";
import type { GroupMember } from "../types";

export const GroupBillPage: React.FC = () => {
  const { groupSession, currentMemberId } = useGroupOrder();
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!groupSession) {
    return (
      <div className="group-bill-page-container">
        <div className="group-bill-empty-card">
          <span className="empty-icon">🧾❓</span>
          <h2>No Active Group Bill Found</h2>
          <p>You are not currently part of an active friends group table.</p>
          <div className="empty-actions">
            <Link to="/dashboard" className="btn btn-secondary">
              ← Back to Food Courts
            </Link>
            <Link to="/group-order" className="btn btn-primary">
              👥 Go to Friends Group
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const membersList: GroupMember[] = Object.values(groupSession.members);
  const myMember = currentMemberId ? groupSession.members[currentMemberId] : null;
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
    let text = `🍽️ Group: ${groupSession.name} (ID: ${groupSession.id || groupSession.tableCode})\n`;
    text += `Food Court: ${groupSession.courtName}\n`;
    text += `──────────────────────────────────────\n`;

    if (myMember) {
      text += `👤 YOUR PERSONAL SHARE (${myMember.name}):\n`;
      if (myMember.items.length === 0) {
        text += `   (No items selected yet)\n`;
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

  const backUrl = groupSession.courtId ? `/court/${groupSession.courtId}` : "/dashboard";

  return (
    <div className="group-bill-page-container">
      {/* Top Navigation */}
      <div className="group-page-nav-bar">
        <Link to={backUrl} className="btn btn-secondary btn-back-dashboard">
          ← Back to Shop Menu
        </Link>
        <div className="group-page-breadcrumb">
          <Link to="/dashboard">Home</Link>
          <span>›</span>
          <Link to="/group-order">Friends Group</Link>
          <span>›</span>
          <span className="current">Group Bill Breakdown</span>
        </div>
      </div>

      {/* Main Full-Page Bill Card */}
      <div className="group-bill-card">
        {/* Header */}
        <div className="group-bill-card-header">
          <div className="bill-card-title-box">
            <span className="group-active-badge">Group Order Bill Breakdown</span>
            <h1 className="bill-card-title">{groupSession.name}</h1>
            <p className="bill-card-subtitle">
              {groupSession.courtEmoji} {groupSession.courtName} • Group ID:{" "}
              <strong>{groupSession.id || groupSession.tableCode}</strong>
            </p>
          </div>
          <div className="bill-card-header-actions">
            <Link to="/group-order" className="btn btn-secondary btn-sm">
              👥 View Group Roster
            </Link>
            <Link to={backUrl} className="btn btn-primary btn-sm">
              🍽️ Back to Menu
            </Link>
          </div>
        </div>

        {/* 1. Grand Total & Split Summary Hero */}
        <div className="bill-grand-total-card">
          <div className="bill-grand-label">Grand Total Bill</div>
          <div className="bill-grand-amount">₹{grandTotal.toFixed(2)}</div>
          <div className="bill-split-summary-bar">
            <div className="split-stat-box split-stat--you">
              <span className="split-box-label">👤 YOUR SHARE</span>
              <span className="split-box-amount">₹{mySubtotal.toFixed(2)}</span>
              <span className="split-box-count">
                {myItemCount} {myItemCount === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="split-stat-box split-stat--team">
              <span className="split-box-label">👥 TEAM'S SHARE</span>
              <span className="split-box-amount">₹{othersTotal.toFixed(2)}</span>
              <span className="split-box-count">{totalItemCount - myItemCount} items</span>
            </div>
            <div className="split-stat-box split-stat--grand">
              <span className="split-box-label">💰 GRAND TOTAL</span>
              <span className="split-box-amount">₹{grandTotal.toFixed(2)}</span>
              <span className="split-box-count">{totalItemCount} items total</span>
            </div>
          </div>
        </div>

        {/* 2. Your Personal Eaten Items */}
        {myMember && (
          <div className="personal-order-card" style={{ marginBottom: "1.5rem" }}>
            <div className="personal-order-header">
              <div className="personal-order-title-row">
                <span className="personal-order-badge">👤 YOUR EATEN ITEMS</span>
                <span className="personal-order-name">({myMember.name})</span>
              </div>
              <span className="personal-order-subtotal">
                Your Subtotal: <strong>₹{mySubtotal.toFixed(2)}</strong>
              </span>
            </div>

            {myMember.items.length === 0 ? (
              <div className="personal-empty-box">
                <p>You haven't selected any dishes yet.</p>
                <Link to={backUrl} className="btn btn-primary btn-sm">
                  + Select Dishes from Menu
                </Link>
              </div>
            ) : (
              <ul className="personal-items-list">
                {myMember.items.map((item) => (
                  <li key={item.itemId} className="personal-dish-row">
                    <span className="personal-dish-name">
                      <strong className="dish-qty">{item.count}×</strong> {item.name}
                      <span className="dish-unit-price">(@ ₹{item.price})</span>
                    </span>
                    <span className="personal-dish-price">
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
          <div className="team-orders-section" style={{ marginBottom: "1.5rem" }}>
            <h3 className="team-section-heading">
              👥 Team Members' Orders ({otherMembers.length})
            </h3>
            <div className="team-members-breakdown-list">
              {otherMembers.map((m) => {
                const subtotal = m.items.reduce((s, i) => s + i.price * i.count, 0);
                const count = m.items.reduce((s, i) => s + i.count, 0);

                return (
                  <div key={m.id} className="team-member-bill-card">
                    <div className="team-member-bill-header">
                      <div className="team-member-ident">
                        <span
                          className="chip-avatar-dot"
                          style={{ backgroundColor: m.avatarColor }}
                        >
                          {m.name.charAt(0).toUpperCase()}
                        </span>
                        <strong>{m.name}</strong>
                        {m.isHost && <span className="host-tag">Host</span>}
                        {m.userTag && (
                          <span className="member-tag-badge">{m.userTag}</span>
                        )}
                        <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                          ({count} items)
                        </span>
                      </div>
                      <span className="team-member-subtotal">₹{subtotal.toFixed(2)}</span>
                    </div>

                    {m.items.length === 0 ? (
                      <p className="team-member-empty">Hasn't added any dishes yet</p>
                    ) : (
                      <ul className="team-member-items-list">
                        {m.items.map((item) => (
                          <li key={item.itemId} className="team-dish-row">
                            <span className="team-dish-title">
                              <span className="basket-qty">{item.count}×</span> {item.name}
                            </span>
                            <span className="team-dish-cost">
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
          </div>
        )}

        {/* 4. Combined Whole Team Food Items */}
        {teamAggregatedItems.length > 0 && (
          <div className="team-food-basket-box" style={{ marginBottom: "1.5rem" }}>
            <h3 className="team-section-heading">
              🍱 Whole Team Food Items (All Dishes Combined)
            </h3>
            <div className="team-basket-chip-grid">
              {teamAggregatedItems.map((item) => (
                <div key={item.name} className="basket-item-pill">
                  <span className="basket-qty">{item.count}×</span>
                  <span className="basket-title">{item.name}</span>
                  <span className="basket-subtotal">
                    ₹{(item.price * item.count).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Counter Payment Note */}
        <div className="bill-counter-note" style={{ marginBottom: "1.5rem" }}>
          <span>💡</span>
          <p>
            One person can pay the grand total of <strong>₹{grandTotal.toFixed(2)}</strong> at the
            counter. The breakdown shows what each team member owes!
          </p>
        </div>

        {/* 6. Footer Actions */}
        <div className="bill-bottom-actions">
          <button
            type="button"
            className="btn btn-secondary btn-copy-full-bill"
            onClick={copyBillText}
            title="Copy full itemized bill to share"
          >
            {copiedSummary ? "✓ Bill Copied to Clipboard!" : "📋 Copy Full Bill Summary"}
          </button>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link to="/group-order" className="btn btn-secondary">
              👥 View Group
            </Link>
            <Link to={backUrl} className="btn btn-primary">
              🍽️ Back to Shop Menu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupBillPage;

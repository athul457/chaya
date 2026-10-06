import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCourts } from "../context/CourtsContext";
import { useGroupOrder } from "../context/GroupOrderContext";
import type { GroupMember, GroupSession } from "../types";
import {
  getRandomColor,
  saveGroupSession,
  generateGroupId,
} from "../lib/groupSync";
import { isSupabaseConfigured } from "../lib/supabase";
import { getAllRegisteredUsers, searchUserByIdOrTag } from "../lib/auth";

export const GroupOrderPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { courts } = useCourts();
  const {
    groupSession,
    currentMemberId,
    handleJoinOrCreateSession,
    handleLeaveSession,
    handleAddMemberByUserId,
    handleJoinSessionByGroupId,
    handleRemoveMember,
    handleDisbandGroup,
  } = useGroupOrder();
  const navigate = useNavigate();

  // Tab state when no active session
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  // Create form states
  const [groupName, setGroupName] = useState(
    currentUser?.name ? `${currentUser.name}'s Group` : "Friends Lunch Group"
  );
  const [selectedCourtId, setSelectedCourtId] = useState(courts[0]?.id || "");
  const [initialFriendId, setInitialFriendId] = useState("");
  const [copiedMyId, setCopiedMyId] = useState(false);
  const [copiedGroupId, setCopiedGroupId] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Join by Group ID states
  const [joinGroupIdInput, setJoinGroupIdInput] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinFeedback, setJoinFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // In-session Add Friend states
  const [friendIdInput, setFriendIdInput] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addFeedback, setAddFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const myUserTag =
    currentUser?.userTag ||
    (currentUser?.id ? `USR-${currentUser.id.slice(-4).toUpperCase()}` : "USR-ME");

  const copyMyUserId = () => {
    navigator.clipboard.writeText(myUserTag);
    setCopiedMyId(true);
    setTimeout(() => setCopiedMyId(false), 2000);
  };

  const copyActiveGroupId = () => {
    const idToCopy = groupSession?.id || groupSession?.tableCode;
    if (!idToCopy) return;
    navigator.clipboard.writeText(idToCopy);
    setCopiedGroupId(true);
    setTimeout(() => setCopiedGroupId(false), 2000);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsCreating(true);
    const chosenCourt = courts.find((c) => c.id === selectedCourtId) || courts[0];
    const newGroupId = generateGroupId();
    const hostMemberId = currentUser?.id || `usr_host_${Date.now().toString().slice(-4)}`;
    const hostAvatarColor = currentUser?.avatarColor || getRandomColor(0);

    const hostMember: GroupMember = {
      id: hostMemberId,
      name: currentUser?.name || "Host",
      avatarColor: hostAvatarColor,
      userTag: myUserTag,
      email: currentUser?.email,
      isHost: true,
      items: [],
      joinedAt: Date.now(),
    };

    const membersMap: Record<string, GroupMember> = {
      [hostMemberId]: hostMember,
    };

    // If host entered an initial friend's User ID to add right away
    if (initialFriendId.trim()) {
      const friendLookup = await searchUserByIdOrTag(initialFriendId.trim());
      if (friendLookup && friendLookup.id !== hostMemberId) {
        membersMap[friendLookup.id] = {
          id: friendLookup.id,
          name: friendLookup.name,
          avatarColor: friendLookup.avatarColor || getRandomColor(1),
          userTag: friendLookup.userTag,
          email: friendLookup.email,
          isHost: false,
          items: [],
          joinedAt: Date.now(),
        };
      } else {
        const cleanFriend = initialFriendId.trim();
        const guestId = `usr_${cleanFriend.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
        membersMap[guestId] = {
          id: guestId,
          name: cleanFriend.includes("@") ? cleanFriend.split("@")[0] : cleanFriend,
          avatarColor: getRandomColor(1),
          userTag: cleanFriend.toUpperCase().startsWith("USR-")
            ? cleanFriend.toUpperCase()
            : `USR-${cleanFriend.toUpperCase().slice(-4)}`,
          email: cleanFriend.includes("@") ? cleanFriend : undefined,
          isHost: false,
          items: [],
          joinedAt: Date.now(),
        };
      }
    }

    const newSession: GroupSession = {
      id: newGroupId,
      name: groupName.trim(),
      tableCode: newGroupId,
      courtId: chosenCourt.id,
      courtName: chosenCourt.name,
      courtEmoji: chosenCourt.emoji,
      hostId: hostMemberId,
      hostName: currentUser?.name || "Host",
      members: membersMap,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveGroupSession(newSession, hostMemberId);
    handleJoinOrCreateSession(newSession, hostMemberId);
    setIsCreating(false);
  };

  const handleJoinWithGroupId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinGroupIdInput.trim()) return;

    setJoinLoading(true);
    setJoinFeedback(null);

    const res = await handleJoinSessionByGroupId(
      joinGroupIdInput.trim(),
      currentUser,
      courts[0]
    );

    setJoinLoading(false);
    if (res.success) {
      setJoinFeedback({ type: "success", text: res.message });
      setJoinGroupIdInput("");
    } else {
      setJoinFeedback({ type: "error", text: res.message });
    }
  };

  const handleAddFriendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendIdInput.trim()) return;

    setAddLoading(true);
    setAddFeedback(null);

    const res = await handleAddMemberByUserId(friendIdInput.trim());
    setAddLoading(false);

    if (res.success) {
      setAddFeedback({ type: "success", text: res.message });
      setFriendIdInput("");
    } else {
      setAddFeedback({ type: "error", text: res.message });
    }
  };

  const onRemoveMemberClick = (member: GroupMember) => {
    if (
      window.confirm(
        `Are you sure you want to remove ${member.name} (${member.userTag || member.id}) from this group?`
      )
    ) {
      handleRemoveMember(member.id);
    }
  };

  const onExitGroupClick = () => {
    if (window.confirm("Are you sure you want to exit and leave this group?")) {
      handleLeaveSession();
      navigate("/dashboard");
    }
  };

  const onDisbandGroupClick = () => {
    if (
      window.confirm(
        "Are you sure you want to DISBAND this group? This will remove all members and end the group session for everyone."
      )
    ) {
      handleDisbandGroup();
      navigate("/dashboard");
    }
  };

  // Other known registered users that can be quickly added
  const otherUsers = getAllRegisteredUsers().filter(
    (u) =>
      u.id !== currentUser?.id &&
      (!groupSession || !groupSession.members[u.id])
  );

  const isCurrentMemberHost =
    groupSession && currentMemberId
      ? groupSession.members[currentMemberId]?.isHost ||
        groupSession.hostId === currentMemberId
      : false;

  // Calculate bill totals if in active session
  const membersList = groupSession ? Object.values(groupSession.members) : [];

  // 1. Current user's eaten items and individual total
  const myMember = currentMemberId && groupSession ? groupSession.members[currentMemberId] : null;
  const myItems = myMember?.items || [];
  const mySubtotal = myItems.reduce((sum, i) => sum + i.price * i.count, 0);
  const myItemCount = myItems.reduce((sum, i) => sum + i.count, 0);

  // 2. Rest of the team members
  const otherMembers = membersList.filter((m) => m.id !== currentMemberId);

  // 3. Combined team food items tally (aggregated by name)
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

  // 4. Combined group grand totals
  const grandTotal = membersList.reduce(
    (sum, m) => sum + m.items.reduce((s, i) => s + i.price * i.count, 0),
    0
  );
  const totalItemCount = membersList.reduce(
    (sum, m) => sum + m.items.reduce((s, i) => s + i.count, 0),
    0
  );
  const othersTotal = grandTotal - mySubtotal;

  const [copiedBill, setCopiedBill] = useState(false);

  const activeGroupId = groupSession?.id || groupSession?.tableCode || "GRP-0000";

  const copyBillText = () => {
    if (!groupSession) return;
    let text = `🍽️ Friends Group: ${groupSession.name} (ID: ${activeGroupId})\n`;
    text += `Food Court: ${groupSession.courtName}\n`;
    text += `──────────────────────────────────────\n`;

    if (myMember) {
      text += `👤 YOUR PERSONAL SHARE (${myMember.name}):\n`;
      if (myItems.length === 0) {
        text += `   (No items selected yet)\n`;
      } else {
        myItems.forEach((item) => {
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
    setCopiedBill(true);
    setTimeout(() => setCopiedBill(false), 2200);
  };

  return (
    <div className="group-page-container">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="group-page-nav-bar">
        <Link to="/dashboard" className="btn btn-secondary btn-back-dashboard">
          ← Back to Food Courts
        </Link>
        <div className="group-page-breadcrumb">
          <Link to="/dashboard">Home</Link>
          <span>›</span>
          <span className="current">Friends Group Order</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="group-page-header">
        <div className="group-page-title-box">
          <span className="group-page-icon">👥</span>
          <div>
            <h1 className="group-page-title">Friends Group Order</h1>
            <p className="group-page-subtitle">
              Connect with friends using Unique User IDs or shareable Group IDs, order food together, and view a live bill
            </p>
          </div>
        </div>

        {/* User's Unique Shareable ID Card */}
        <div className="user-id-top-banner group-id-hero-card">
          <div className="user-id-banner-content">
            <span className="user-id-banner-icon">🔑</span>
            <div className="user-id-banner-text">
              <span className="user-id-banner-title">Your Unique Shareable ID</span>
              <span className="user-id-banner-code">{myUserTag}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-copy-my-id"
            onClick={copyMyUserId}
            title="Copy your ID to share with friends"
          >
            {copiedMyId ? "✓ Copied!" : "📋 Copy My ID"}
          </button>
        </div>
      </div>

      {groupSession ? (
        /* ================= Active Group Management View ================= */
        <div className="group-active-layout">
          {/* Active Session Status Card */}
          <div className="group-active-header-card">
            <div className="active-header-main">
              <div className="active-header-tag-row">
                <span className="group-active-badge">Active Session</span>
                <span className="group-id-pill">
                  Group ID: <strong>{activeGroupId}</strong>
                </span>
              </div>
              <h2 className="active-group-name">{groupSession.name}</h2>
              <p className="active-court-meta">
                Ordering from: <strong>{groupSession.courtEmoji} {groupSession.courtName}</strong> • Hosted by <strong>{groupSession.hostName}</strong>
              </p>
            </div>
            <div className="active-header-actions">
              <Link
                to="/group-bill"
                className="btn btn-primary btn-header-view-bill"
                title="View separate Live Order & Bill Summary page"
              >
                🧾 Live Order & Bill Page ➔
              </Link>
              <button
                type="button"
                className="btn btn-secondary btn-copy-group-id"
                onClick={copyActiveGroupId}
                title="Copy Group ID to share with friends"
              >
                {copiedGroupId ? "✓ Group ID Copied!" : `📋 Copy Group ID (${activeGroupId})`}
              </button>
              <Link
                to={`/court/${groupSession.courtId}`}
                className="btn btn-secondary btn-browse-menu"
              >
                🍽️ Browse Menu
              </Link>
              {isCurrentMemberHost ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-disband-active"
                  onClick={onDisbandGroupClick}
                  title="Disband this group for all members"
                >
                  💥 Disband Group
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-exit-table"
                  onClick={onExitGroupClick}
                >
                  🚪 Exit Group
                </button>
              )}
            </div>
          </div>

          {/* Prominent Shareable Group ID Banner */}
          <div className="share-group-id-banner">
            <div className="share-group-id-info">
              <span className="share-group-icon">📢</span>
              <div>
                <span className="share-group-label">SHARE THIS GROUP ID WITH FRIENDS</span>
                <div className="share-group-id-value-row">
                  <span className="share-group-code">{activeGroupId}</span>
                  <span className="share-group-hint">
                    Friends can paste this Group ID on their screen to join this table directly!
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-copy-banner"
              onClick={copyActiveGroupId}
            >
              {copiedGroupId ? "✓ Copied Group ID!" : "📋 Copy Group ID"}
            </button>
          </div>

          <div className="group-active-grid">
            {/* Left Column: Add Friends & Member Roster */}
            <div className="group-left-col">
              {/* Add Member by User ID Form */}
              <div className="add-by-user-id-card group-page-card">
                <h3 className="add-user-id-title">➕ Add Friend by User ID</h3>
                <p className="add-user-id-sub">
                  Enter your friend's Unique User ID (e.g. <code>USR-XXXX</code>) or email to add them instantly:
                </p>

                <form onSubmit={handleAddFriendSubmit} className="add-by-id-form">
                  <input
                    type="text"
                    className="clean-input add-by-id-input"
                    placeholder="e.g. USR-4821 or friend@example.com"
                    value={friendIdInput}
                    onChange={(e) => setFriendIdInput(e.target.value)}
                    disabled={addLoading}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-add-by-id"
                    disabled={!friendIdInput.trim() || addLoading}
                  >
                    {addLoading ? "Adding..." : "+ Add Friend"}
                  </button>
                </form>

                {addFeedback && (
                  <div className={`add-id-alert add-id-alert--${addFeedback.type}`}>
                    <span>{addFeedback.type === "success" ? "✓" : "⚠️"}</span>
                    <span>{addFeedback.text}</span>
                  </div>
                )}

                {/* Quick Add Suggestions if other known registered users exist */}
                {otherUsers.length > 0 && (
                  <div className="quick-add-suggestions">
                    <span className="quick-add-label">Quick Add Known Friends:</span>
                    <div className="quick-add-chips">
                      {otherUsers.slice(0, 5).map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          className="quick-user-chip"
                          onClick={() => setFriendIdInput(u.userTag || u.id)}
                          title={`Click to add ${u.name}`}
                        >
                          <span
                            className="chip-avatar-dot"
                            style={{ backgroundColor: u.avatarColor }}
                          />
                          <span>{u.name}</span>
                          <span className="chip-tag">({u.userTag})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Members in Group List with Remove Option */}
              <div className="group-members-list group-page-card">
                <div className="members-list-header">
                  <h3 className="group-members-label">
                    Group Members ({membersList.length})
                  </h3>
                  <span className="members-hint-note">Live multi-device connected</span>
                </div>

                <div className="group-avatar-stack">
                  {membersList.map((m) => {
                    const isMe = m.id === currentMemberId;
                    const canRemove = isCurrentMemberHost && !isMe;
                    const memberItemsCount = m.items.reduce((acc, i) => acc + i.count, 0);

                    return (
                      <div
                        key={m.id}
                        className={`group-member-pill ${isMe ? "group-member-pill--me" : ""}`}
                      >
                        <span
                          className="member-avatar-dot"
                          style={{ backgroundColor: m.avatarColor }}
                        >
                          {m.name.charAt(0).toUpperCase()}
                        </span>

                        <div className="member-info-col">
                          <div className="member-name-row">
                            <span className="member-name-text">
                              {m.name} {isMe && "(You)"} {m.isHost && "👑 Host"}
                            </span>
                            {m.userTag && (
                              <span className="member-tag-badge">{m.userTag}</span>
                            )}
                          </div>
                          <span className="member-item-count">
                            {memberItemsCount} {memberItemsCount === 1 ? "item" : "items"} selected
                          </span>
                        </div>

                        {/* Remove Member Option for Host */}
                        {canRemove && (
                          <button
                            type="button"
                            className="btn-remove-member"
                            onClick={() => onRemoveMemberClick(m)}
                            title={`Remove ${m.name} from group`}
                          >
                            <span>✕ Remove</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Cloud Sync Status */}
                <div className="group-sync-pill">
                  <span className="pulse-dot"></span>
                  <span>
                    {isSupabaseConfigured
                      ? "Supabase Realtime Cloud Sync Active"
                      : "Local Multi-Tab Realtime Sync Active"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Order & Bill Summary Navigation Card */}
            <div className="group-right-col">
              <div className="group-bill-overview-card group-page-card">
                <div className="bill-summary-header">
                  <div>
                    <h3 className="bill-summary-title">🧾 Live Order & Bill</h3>
                    <p className="bill-summary-sub">
                      Track individual shares, team orders, and grand total
                    </p>
                  </div>
                  <span className="bill-item-count-badge">
                    {totalItemCount} {totalItemCount === 1 ? "item" : "items"} total
                  </span>
                </div>

                {/* 1. Grand Total Split Summary Bar */}
                <div className="bill-split-summary-bar">
                  <div className="split-stat-box split-stat--you">
                    <span className="split-box-label">👤 YOUR SHARE</span>
                    <span className="split-box-amount">₹{mySubtotal.toFixed(2)}</span>
                    <span className="split-box-count">{myItemCount} {myItemCount === 1 ? "item" : "items"}</span>
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

                {/* Personal status preview */}
                <div className="bill-overview-personal-pill">
                  <div className="personal-order-header" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}>
                    <div className="personal-order-title-row">
                      <span className="personal-order-badge">👤 YOUR SELECTION</span>
                      <span className="personal-order-name">({currentUser?.name || "You"})</span>
                    </div>
                    <span className="personal-order-subtotal">
                      My Total: <strong>₹{mySubtotal.toFixed(2)}</strong> ({myItemCount} {myItemCount === 1 ? "dish" : "dishes"})
                    </span>
                  </div>
                </div>

                {/* Primary Action Button to Separate Page */}
                <div className="bill-overview-cta-box">
                  <Link
                    to="/group-bill"
                    className="btn btn-primary btn-go-to-bill"
                    title="Open separate full Live Order & Bill Summary page"
                  >
                    🧾 Open Separate Bill Page ➔
                  </Link>
                  <p className="bill-overview-cta-hint">
                    👉 Full dish breakdown, eaten items, and team basket are on the separate bill page.
                  </p>
                </div>

                {/* Secondary Fast Actions */}
                <div className="bill-overview-bottom-actions">
                  <Link
                    to={`/court/${groupSession.courtId}`}
                    className="btn btn-secondary"
                  >
                    🍽️ Add More Dishes
                  </Link>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={copyBillText}
                    title="Copy full itemized bill summary"
                  >
                    {copiedBill ? "✓ Copied!" : "📋 Copy Summary"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= Create or Join Group (When No Active Session) ================= */
        <div className="group-create-layout">
          {/* Segmented Tab Switch */}
          <div className="group-tab-switch">
            <button
              type="button"
              className={`group-tab-btn ${activeTab === "create" ? "active" : ""}`}
              onClick={() => setActiveTab("create")}
            >
              ✨ Create New Group
            </button>
            <button
              type="button"
              className={`group-tab-btn ${activeTab === "join" ? "active" : ""}`}
              onClick={() => setActiveTab("join")}
            >
              🔑 Join by Group ID
            </button>
          </div>

          {activeTab === "create" ? (
            <div className="group-create-card group-page-card">
              <h2 className="create-card-title">✨ Create a Friends Group</h2>
              <p className="create-card-sub">
                Pick a food court, give your group a name, and get a unique <strong>Group ID</strong> to share with friends!
              </p>

              <form onSubmit={handleCreateGroup} className="group-page-form">
                <div className="form-group">
                  <label className="form-label">Select Food Court / Shop *</label>
                  <select
                    className="form-input form-select"
                    value={selectedCourtId}
                    onChange={(e) => setSelectedCourtId(e.target.value)}
                    required
                  >
                    {courts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.name} — {c.tagline}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Group Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Lunch with Friends, Office Team, Weekend Snacks"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Invite Friend by User ID (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. USR-4821 or friend's email"
                    value={initialFriendId}
                    onChange={(e) => setInitialFriendId(e.target.value)}
                  />
                  <span className="form-hint">
                    A shareable Group ID will also be generated automatically so you can copy and send it to anyone!
                  </span>
                </div>

                {/* Quick suggestions if other users exist */}
                {otherUsers.length > 0 && (
                  <div className="quick-add-suggestions" style={{ marginBottom: "1.25rem" }}>
                    <span className="quick-add-label">Quick Invite Registered Friends:</span>
                    <div className="quick-add-chips">
                      {otherUsers.slice(0, 4).map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          className="quick-user-chip"
                          onClick={() => setInitialFriendId(u.userTag || u.id)}
                        >
                          <span
                            className="chip-avatar-dot"
                            style={{ backgroundColor: u.avatarColor }}
                          />
                          <span>{u.name}</span>
                          <span className="chip-tag">({u.userTag})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="create-form-actions">
                  <Link to="/dashboard" className="btn btn-secondary">
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary btn-submit-group"
                    disabled={!groupName.trim() || isCreating}
                  >
                    {isCreating ? "Creating Group..." : "✨ Create Group & Get Group ID"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Join with Group ID Card */
            <div className="group-join-card group-page-card">
              <h2 className="create-card-title">🔑 Join with Group ID</h2>
              <p className="create-card-sub">
                Enter the shareable <strong>Group ID</strong> (e.g. <code>GRP-4821</code>) given by your friend to join their table:
              </p>

              <form onSubmit={handleJoinWithGroupId} className="group-page-form">
                <div className="form-group">
                  <label className="form-label">Group ID *</label>
                  <input
                    type="text"
                    className="form-input form-input-lg"
                    placeholder="e.g. GRP-4821"
                    value={joinGroupIdInput}
                    onChange={(e) => setJoinGroupIdInput(e.target.value.toUpperCase())}
                    required
                    autoFocus
                  />
                  <span className="form-hint">
                    Ask your friend for their table's Group ID. It starts with "GRP-".
                  </span>
                </div>

                {joinFeedback && (
                  <div className={`add-id-alert add-id-alert--${joinFeedback.type}`}>
                    <span>{joinFeedback.type === "success" ? "✓" : "⚠️"}</span>
                    <span>{joinFeedback.text}</span>
                  </div>
                )}

                <div className="create-form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setActiveTab("create")}
                  >
                    ← Back to Create
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-submit-group"
                    disabled={!joinGroupIdInput.trim() || joinLoading}
                  >
                    {joinLoading ? "Connecting..." : "🚀 Join Group Table"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupOrderPage;

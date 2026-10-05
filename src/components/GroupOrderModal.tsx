import React, { useState } from "react";
import type { FoodCourt, GroupSession, GroupMember, AppUser } from "../types";
import { getRandomColor, saveGroupSession } from "../lib/groupSync";
import { isSupabaseConfigured } from "../lib/supabase";
import { getAllRegisteredUsers, searchUserByIdOrTag } from "../lib/auth";
import { useGroupOrder } from "../context/GroupOrderContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  courts: FoodCourt[];
  currentCourt: FoodCourt | null;
  activeSession: GroupSession | null;
  currentMemberId: string | null;
  currentUser?: AppUser | null;
  onJoinOrCreateSession: (session: GroupSession, memberId: string) => void;
  onLeaveSession: () => void;
  initialTableCode?: string;
}

export const GroupOrderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  courts,
  currentCourt,
  activeSession,
  currentMemberId,
  currentUser,
  onJoinOrCreateSession,
  onLeaveSession,
}) => {
  const {
    handleAddMemberByUserId,
    handleRemoveMember,
    handleDisbandGroup,
  } = useGroupOrder();

  // Create form states
  const [groupName, setGroupName] = useState(
    currentUser?.name ? `${currentUser.name}'s Group` : "Friends Lunch Group"
  );
  const [selectedCourtId, setSelectedCourtId] = useState(
    currentCourt?.id || courts[0]?.id || ""
  );
  const [initialFriendId, setInitialFriendId] = useState("");
  const [copiedMyId, setCopiedMyId] = useState(false);

  // In-session Add Friend states
  const [friendIdInput, setFriendIdInput] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addFeedback, setAddFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const myUserTag =
    currentUser?.userTag ||
    (currentUser?.id ? `USR-${currentUser.id.slice(-4).toUpperCase()}` : "USR-ME");

  const copyMyUserId = () => {
    navigator.clipboard.writeText(myUserTag);
    setCopiedMyId(true);
    setTimeout(() => setCopiedMyId(false), 2000);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const chosenCourt = courts.find((c) => c.id === selectedCourtId) || courts[0];
    const groupId = `grp_${Date.now()}`;
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
          userTag: cleanFriend.toUpperCase().startsWith("USR-") ? cleanFriend.toUpperCase() : `USR-${cleanFriend.toUpperCase().slice(-4)}`,
          email: cleanFriend.includes("@") ? cleanFriend : undefined,
          isHost: false,
          items: [],
          joinedAt: Date.now(),
        };
      }
    }

    const newSession: GroupSession = {
      id: groupId,
      name: groupName.trim(),
      tableCode: groupId,
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
    onJoinOrCreateSession(newSession, hostMemberId);
    onClose();
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
      onLeaveSession();
      onClose();
    }
  };

  const onDisbandGroupClick = () => {
    if (
      window.confirm(
        "Are you sure you want to DISBAND this group? This will remove all members and end the group session for everyone."
      )
    ) {
      handleDisbandGroup();
      onClose();
    }
  };

  // Other known registered users that can be quickly added
  const otherUsers = getAllRegisteredUsers().filter(
    (u) =>
      u.id !== currentUser?.id &&
      (!activeSession || !activeSession.members[u.id])
  );

  const isCurrentMemberHost =
    activeSession && currentMemberId
      ? activeSession.members[currentMemberId]?.isHost ||
        activeSession.hostId === currentMemberId
      : false;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box group-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="group-modal-title-row">
            <span className="group-modal-icon">👥</span>
            <div>
              <h2 className="modal-title">Friends Group Order</h2>
              <p className="modal-subtitle">
                Create a group, invite friends by their Unique User ID, and order food together
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        {/* User's Unique Shareable ID Banner */}
        <div className="user-id-top-banner">
          <div className="user-id-banner-content">
            <span className="user-id-banner-icon">🔑</span>
            <div className="user-id-banner-text">
              <span className="user-id-banner-title">Your Unique Shareable ID</span>
              <span className="user-id-banner-code">{myUserTag}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm btn-copy-my-id"
            onClick={copyMyUserId}
            title="Copy your ID to give to friends"
          >
            {copiedMyId ? "✓ Copied!" : "📋 Copy ID"}
          </button>
        </div>

        {activeSession ? (
          <div className="group-modal-active-section">
            {/* Active Group Card */}
            <div className="group-active-card">
              <div className="group-active-header">
                <div>
                  <span className="group-active-badge">Active Friends Group</span>
                  <h3 className="group-active-table">{activeSession.name}</h3>
                  <p className="group-active-court">
                    {activeSession.courtEmoji} {activeSession.courtName} • Hosted by {activeSession.hostName}
                  </p>
                </div>
                {isCurrentMemberHost && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm btn-disband-small"
                    onClick={onDisbandGroupClick}
                    title="Disband this group for all members"
                  >
                    💥 Disband Group
                  </button>
                )}
              </div>

              {/* Add Person by User ID Section */}
              <div className="add-by-user-id-card">
                <span className="add-user-id-title">➕ Add Friend by User ID</span>
                <p className="add-user-id-sub">
                  Ask your friend for their Unique User ID (e.g. {myUserTag}) and enter it below:
                </p>

                <form onSubmit={handleAddFriendSubmit} className="add-by-id-form">
                  <input
                    type="text"
                    className="clean-input add-by-id-input"
                    placeholder="Enter Friend's User ID (e.g. USR-4821) or Email"
                    value={friendIdInput}
                    onChange={(e) => setFriendIdInput(e.target.value)}
                    disabled={addLoading}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-add-by-id"
                    disabled={!friendIdInput.trim() || addLoading}
                  >
                    {addLoading ? "Adding..." : "+ Add to Group"}
                  </button>
                </form>

                {addFeedback && (
                  <div className={`add-id-alert add-id-alert--${addFeedback.type}`}>
                    <span>{addFeedback.type === "success" ? "✓" : "⚠️"}</span>
                    <span>{addFeedback.text}</span>
                  </div>
                )}

                {/* Quick Add Suggestions if other known users exist */}
                {otherUsers.length > 0 && (
                  <div className="quick-add-suggestions">
                    <span className="quick-add-label">Quick Add Known Friends:</span>
                    <div className="quick-add-chips">
                      {otherUsers.slice(0, 4).map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          className="quick-user-chip"
                          onClick={() => setFriendIdInput(u.userTag || u.id)}
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
              <div className="group-members-list">
                <div className="members-list-header">
                  <span className="group-members-label">
                    Group Members ({Object.keys(activeSession.members).length})
                  </span>
                  <span className="members-hint-note">Live multi-device sync</span>
                </div>

                <div className="group-avatar-stack">
                  {Object.values(activeSession.members).map((m) => {
                    const isMe = m.id === currentMemberId;
                    const canRemove = isCurrentMemberHost && !isMe;

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
                            {m.items.reduce((acc, i) => acc + i.count, 0)} items selected
                          </span>
                        </div>

                        {/* Remove Option for host */}
                        {canRemove && (
                          <button
                            type="button"
                            className="btn-remove-member"
                            onClick={() => onRemoveMemberClick(m)}
                            title={`Remove ${m.name} from group`}
                            aria-label={`Remove ${m.name}`}
                          >
                            <span>✕ Remove</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sync Status Badge */}
              <div className="group-sync-pill">
                <span className="pulse-dot"></span>
                <span>
                  {isSupabaseConfigured
                    ? "Supabase Realtime Cloud Sync Active (Multi-Device Connected)"
                    : "Local Multi-Tab Sync Active"}
                </span>
              </div>
            </div>

            {/* Modal Actions with Exit Group Option */}
            <div className="modal-actions group-modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-exit-table"
                onClick={onExitGroupClick}
              >
                <span>🚪 Exit Group</span>
              </button>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Continue Ordering
              </button>
            </div>
          </div>
        ) : (
          /* Pure Create Group Form — No Table Codes */
          <div className="group-modal-body">
            <form onSubmit={handleCreateGroup} className="group-form">
              <div className="form-group">
                <label className="form-label">Select Food Court / Shop *</label>
                <select
                  className="form-input form-select"
                  value={selectedCourtId}
                  onChange={(e) => setSelectedCourtId(e.target.value)}
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
                  You can also add more friends anytime using their Unique User ID once the group is open!
                </span>
              </div>

              <div className="group-feature-highlights">
                <div className="feature-item">
                  <span>🔑</span> <span>Connect friends directly using their Unique User ID</span>
                </div>
                <div className="feature-item">
                  <span>📱</span> <span>Each person selects dishes from their own phone</span>
                </div>
                <div className="feature-item">
                  <span>👑</span> <span>Host can add or remove members anytime</span>
                </div>
                <div className="feature-item">
                  <span>🧾</span> <span>Combined grand total bill is auto-calculated</span>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!groupName.trim()}
                >
                  ✨ Create Group & Connect
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupOrderModal;

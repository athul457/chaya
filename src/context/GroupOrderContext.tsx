import React, { createContext, useContext, useState, useEffect } from "react";
import type { GroupSession, GroupMember, MemberOrderItem, AppUser, FoodCourt } from "../types";
import {
  loadSavedGroupSession,
  saveGroupSession,
  groupSyncService,
  getRandomColor,
  findGroupById,
  saveKnownGroup,
} from "../services/groupSyncService";
import { searchUserByIdOrTag } from "../services/authService";

interface GroupOrderContextType {
  groupSession: GroupSession | null;
  currentMemberId: string | null;
  initialTableCode: string;
  setInitialTableCode: (code: string) => void;
  isGroupModalOpen: boolean;
  setIsGroupModalOpen: (open: boolean) => void;
  isGroupBillOpen: boolean;
  setIsGroupBillOpen: (open: boolean) => void;
  handleJoinOrCreateSession: (session: GroupSession, memberId: string) => void;
  handleLeaveSession: () => void;
  handleDisbandGroup: () => void;
  handleRemoveMember: (memberId: string) => void;
  handleAddMemberByUserId: (
    identifier: string
  ) => Promise<{ success: boolean; message: string; member?: GroupMember }>;
  handleJoinSessionByGroupId: (
    groupId: string,
    user: AppUser | null,
    fallbackCourt?: FoodCourt
  ) => Promise<{ success: boolean; message: string }>;
  handleUpdateMemberItems: (items: MemberOrderItem[]) => void;
  groupNotification: string | null;
  clearNotification: () => void;
}

const defaultGroupOrderContext: GroupOrderContextType = {
  groupSession: null,
  currentMemberId: null,
  initialTableCode: "",
  setInitialTableCode: () => {},
  isGroupModalOpen: false,
  setIsGroupModalOpen: () => {},
  isGroupBillOpen: false,
  setIsGroupBillOpen: () => {},
  handleJoinOrCreateSession: () => {},
  handleLeaveSession: () => {},
  handleDisbandGroup: () => {},
  handleRemoveMember: () => {},
  handleAddMemberByUserId: async () => ({ success: false, message: "" }),
  handleJoinSessionByGroupId: async () => ({ success: false, message: "" }),
  handleUpdateMemberItems: () => {},
  groupNotification: null,
  clearNotification: () => {},
};

const GroupOrderContext = createContext<GroupOrderContextType>(defaultGroupOrderContext);

export const GroupOrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const savedState = loadSavedGroupSession();
  const [groupSession, setGroupSession] = useState<GroupSession | null>(savedState.session);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(savedState.memberId);
  const [groupNotification, setGroupNotification] = useState<string | null>(null);

  const [initialTableCode, setInitialTableCode] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tableParam = params.get("table");
      if (tableParam && (!savedState.session || savedState.session.tableCode !== tableParam)) {
        return tableParam;
      }
    }
    return "";
  });

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(() => Boolean(initialTableCode));
  const [isGroupBillOpen, setIsGroupBillOpen] = useState(false);

  // Sync with real-time backend
  useEffect(() => {
    if (!groupSession?.tableCode || !currentMemberId) {
      groupSyncService.destroy();
      return;
    }

    groupSyncService.init(
      groupSession.tableCode,
      currentMemberId,
      (remoteSession) => {
        setGroupSession(remoteSession);
        saveGroupSession(remoteSession, currentMemberId);
      },
      undefined,
      // onMemberRemoved callback
      () => {
        setGroupSession(null);
        setCurrentMemberId(null);
        saveGroupSession(null, null);
        groupSyncService.destroy();
        setGroupNotification("You were removed from the table group by the host.");
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("table");
          window.history.replaceState({}, "", url.toString());
        }
      }
    );

    return () => {
      groupSyncService.destroy();
    };
  }, [groupSession?.tableCode, currentMemberId]);

  const handleJoinOrCreateSession = (session: GroupSession, memberId: string) => {
    setGroupSession(session);
    setCurrentMemberId(memberId);
    saveGroupSession(session, memberId);
    groupSyncService.broadcastSession(session);
  };

  const handleLeaveSession = () => {
    if (groupSession && currentMemberId) {
      groupSyncService.broadcastMemberLeft(currentMemberId);
    }
    setGroupSession(null);
    setCurrentMemberId(null);
    saveGroupSession(null, null);
    groupSyncService.destroy();

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("table");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleDisbandGroup = () => {
    if (!groupSession) return;
    groupSyncService.broadcastGroupDisbanded();
    setGroupSession(null);
    setCurrentMemberId(null);
    saveGroupSession(null, null);
    groupSyncService.destroy();

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("table");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (!groupSession) return;

    // Cannot remove self via remove member — use handleLeaveSession instead
    if (memberId === currentMemberId) {
      handleLeaveSession();
      return;
    }

    const remainingMembers = { ...groupSession.members };
    delete remainingMembers[memberId];

    const updatedSession: GroupSession = {
      ...groupSession,
      updatedAt: Date.now(),
      members: remainingMembers,
    };

    setGroupSession(updatedSession);
    saveGroupSession(updatedSession, currentMemberId);
    groupSyncService.broadcastMemberRemoved(memberId);
  };

  const handleAddMemberByUserId = async (
    identifier: string
  ): Promise<{ success: boolean; message: string; member?: GroupMember }> => {
    if (!groupSession) {
      return { success: false, message: "No active group table." };
    }

    const clean = identifier.trim();
    if (!clean) {
      return { success: false, message: "Please enter a valid User ID, Tag, or Email." };
    }

    // Try finding the user in local / Supabase database
    const foundUser = await searchUserByIdOrTag(clean);

    let newMemberId: string;
    let memberName: string;
    let memberTag: string;
    let avatarColor: string;
    let email: string | undefined;

    const currentCount = Object.keys(groupSession.members).length;

    if (foundUser) {
      newMemberId = foundUser.id;
      memberName = foundUser.name;
      memberTag = foundUser.userTag;
      avatarColor = foundUser.avatarColor || getRandomColor(currentCount);
      email = foundUser.email;
    } else {
      // Allow adding a friend with a custom ID or Name
      newMemberId = `usr_${clean.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now().toString().slice(-4)}`;
      memberName = clean.includes("@") ? clean.split("@")[0] : clean;
      memberTag = clean.toUpperCase().startsWith("USR-") ? clean.toUpperCase() : `USR-${clean.toUpperCase().slice(-4)}`;
      avatarColor = getRandomColor(currentCount);
      email = clean.includes("@") ? clean : undefined;
    }

    // Check if already in group
    const alreadyExists = Object.values(groupSession.members).some(
      (m) =>
        m.id === newMemberId ||
        (m.userTag && m.userTag.toLowerCase() === clean.toLowerCase()) ||
        (m.email && m.email.toLowerCase() === clean.toLowerCase())
    );

    if (alreadyExists) {
      return { success: false, message: `${memberName} is already in this table group!` };
    }

    const newMember: GroupMember = {
      id: newMemberId,
      name: memberName,
      avatarColor,
      userTag: memberTag,
      email,
      isHost: false,
      items: [],
      joinedAt: Date.now(),
    };

    const updatedSession: GroupSession = {
      ...groupSession,
      updatedAt: Date.now(),
      members: {
        ...groupSession.members,
        [newMemberId]: newMember,
      },
    };

    setGroupSession(updatedSession);
    saveGroupSession(updatedSession, currentMemberId);
    groupSyncService.broadcastMemberAdded(newMember);

    return {
      success: true,
      message: `Added ${memberName} (${memberTag}) to the table!`,
      member: newMember,
    };
  };

  const handleJoinSessionByGroupId = async (
    groupId: string,
    user: AppUser | null,
    fallbackCourt?: FoodCourt
  ): Promise<{ success: boolean; message: string }> => {
    const cleanId = groupId.trim().toUpperCase();
    if (!cleanId) {
      return { success: false, message: "Please enter a valid Group ID." };
    }

    const myMemberId = user?.id || `usr_${Date.now().toString().slice(-4)}`;
    const myUserTag =
      user?.userTag ||
      (user?.id ? `USR-${user.id.slice(-4).toUpperCase()}` : `USR-${myMemberId.slice(-4).toUpperCase()}`);

    // Look up group session
    const existing = await findGroupById(cleanId);
    let sessionToJoin: GroupSession;

    if (existing) {
      sessionToJoin = { ...existing, members: { ...existing.members } };
    } else {
      // Connect directly using cleanId as table channel
      sessionToJoin = {
        id: cleanId,
        tableCode: cleanId,
        name: `Group ${cleanId}`,
        courtId: fallbackCourt?.id || "court-1",
        courtName: fallbackCourt?.name || "Food Court",
        courtEmoji: fallbackCourt?.emoji || "🍽️",
        hostId: "host_remote",
        hostName: "Group Host",
        members: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    const newMember: GroupMember = {
      id: myMemberId,
      name: user?.name || "Friend",
      avatarColor: user?.avatarColor || getRandomColor(Object.keys(sessionToJoin.members).length),
      userTag: myUserTag,
      email: user?.email,
      isHost: false,
      items: [],
      joinedAt: Date.now(),
    };

    sessionToJoin.members[myMemberId] = newMember;
    sessionToJoin.updatedAt = Date.now();

    handleJoinOrCreateSession(sessionToJoin, myMemberId);
    saveKnownGroup(sessionToJoin);
    groupSyncService.broadcastMemberAdded(newMember);

    return { success: true, message: `Connected to group ${cleanId}!` };
  };

  const handleUpdateMemberItems = (items: MemberOrderItem[]) => {
    if (!groupSession || !currentMemberId) return;
    const currentMember = groupSession.members[currentMemberId];
    if (!currentMember) return;

    const updatedMember = {
      ...currentMember,
      items,
    };

    const updatedSession: GroupSession = {
      ...groupSession,
      updatedAt: Date.now(),
      members: {
        ...groupSession.members,
        [currentMemberId]: updatedMember,
      },
    };

    setGroupSession(updatedSession);
    saveGroupSession(updatedSession, currentMemberId);
    groupSyncService.broadcastMemberUpdate(updatedMember);
  };

  const clearNotification = () => setGroupNotification(null);

  return (
    <GroupOrderContext.Provider
      value={{
        groupSession,
        currentMemberId,
        initialTableCode,
        setInitialTableCode,
        isGroupModalOpen,
        setIsGroupModalOpen,
        isGroupBillOpen,
        setIsGroupBillOpen,
        handleJoinOrCreateSession,
        handleLeaveSession,
        handleDisbandGroup,
        handleRemoveMember,
        handleAddMemberByUserId,
        handleJoinSessionByGroupId,
        handleUpdateMemberItems,
        groupNotification,
        clearNotification,
      }}
    >
      {children}
    </GroupOrderContext.Provider>
  );
};

export function useGroupOrder() {
  const context = useContext(GroupOrderContext);
  return context || defaultGroupOrderContext;
}

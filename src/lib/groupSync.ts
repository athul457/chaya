import { supabase, isSupabaseConfigured } from "./supabase";
import type { GroupSession, GroupMember } from "../types";

const LOCAL_STORAGE_SESSION = "foodcourt_active_group_session";
const LOCAL_STORAGE_MEMBER = "foodcourt_active_member_id";

const AVATAR_COLORS = [
  "#f97316", // Orange
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f59e0b", // Amber
];

// Browser-level BroadcastChannel for instant local multi-tab/window testing
let localBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    localBroadcastChannel = new BroadcastChannel("foodcourt_group_order_channel");
  }
} catch {
  // Ignore in restricted environments
}

export function getRandomColor(index = 0): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function generateTableCode(): string {
  // Easy to type 4-digit code e.g. "4821"
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function generateGroupId(): string {
  // Clean, memorable shareable Group ID e.g. GRP-4821 or GRP-8F2A
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GRP-${code}`;
}

const KNOWN_GROUPS_KEY = "foodcourt_all_known_groups";

export function saveKnownGroup(session: GroupSession | null) {
  if (!session) return;
  try {
    const raw = localStorage.getItem(KNOWN_GROUPS_KEY);
    const map: Record<string, GroupSession> = raw ? JSON.parse(raw) : {};
    map[session.id.toUpperCase()] = session;
    if (session.tableCode) {
      map[session.tableCode.toUpperCase()] = session;
    }
    localStorage.setItem(KNOWN_GROUPS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export async function findGroupById(groupId: string): Promise<GroupSession | null> {
  const clean = groupId.trim().toUpperCase();
  if (!clean) return null;

  // 1. Check known groups in localStorage
  try {
    const raw = localStorage.getItem(KNOWN_GROUPS_KEY);
    if (raw) {
      const map: Record<string, GroupSession> = JSON.parse(raw);
      if (map[clean]) return map[clean];
    }
  } catch {
    // ignore
  }

  // 2. Check currently active saved session
  const saved = loadSavedGroupSession();
  if (
    saved.session &&
    (saved.session.id?.toUpperCase() === clean ||
      saved.session.tableCode?.toUpperCase() === clean)
  ) {
    return saved.session;
  }

  // 3. Check Supabase group_orders table if configured
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("group_orders")
        .select("session_data")
        .or(`table_code.eq.${clean},table_code.eq.${groupId.trim()}`)
        .maybeSingle();

      if (!error && data?.session_data) {
        return data.session_data as GroupSession;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export function loadSavedGroupSession(): { session: GroupSession | null; memberId: string | null } {
  try {
    const rawSession = localStorage.getItem(LOCAL_STORAGE_SESSION);
    const memberId = localStorage.getItem(LOCAL_STORAGE_MEMBER);
    if (rawSession && memberId) {
      const session = JSON.parse(rawSession) as GroupSession;
      return { session, memberId };
    }
  } catch {
    // fallback
  }
  return { session: null, memberId: null };
}

export function saveGroupSession(session: GroupSession | null, memberId: string | null) {
  try {
    if (session && memberId) {
      localStorage.setItem(LOCAL_STORAGE_SESSION, JSON.stringify(session));
      localStorage.setItem(LOCAL_STORAGE_MEMBER, memberId);
      saveKnownGroup(session);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_SESSION);
      localStorage.removeItem(LOCAL_STORAGE_MEMBER);
    }
  } catch {
    // ignore
  }
}

export type SyncStatus = "cloud_connected" | "local_broadcast" | "connecting" | "offline";

export class GroupOrderSyncService {
  private tableCode: string | null = null;
  private currentMemberId: string | null = null;
  private supabaseChannel: any = null;
  private onSessionUpdated: ((session: GroupSession) => void) | null = null;
  private onStatusChange: ((status: SyncStatus) => void) | null = null;
  private onMemberRemoved: (() => void) | null = null;

  init(
    tableCode: string,
    currentMemberId: string,
    onSessionUpdated: (session: GroupSession) => void,
    onStatusChange?: (status: SyncStatus) => void,
    onMemberRemoved?: () => void
  ) {
    this.tableCode = tableCode;
    this.currentMemberId = currentMemberId;
    this.onSessionUpdated = onSessionUpdated;
    this.onStatusChange = onStatusChange || null;
    this.onMemberRemoved = onMemberRemoved || null;

    this.setupLocalBroadcast();
    this.setupSupabaseRealtime();
    this.tryFetchFromDatabase();
  }

  private setStatus(status: SyncStatus) {
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  private setupLocalBroadcast() {
    if (!localBroadcastChannel) return;

    localBroadcastChannel.onmessage = (event) => {
      const { type, tableCode, payload, senderId } = event.data || {};
      if (tableCode !== this.tableCode || senderId === this.currentMemberId) return;

      this.handleIncomingEvent(type, payload);
    };
  }

  private setupSupabaseRealtime() {
    if (!supabase || !this.tableCode) {
      this.setStatus(localBroadcastChannel ? "local_broadcast" : "offline");
      return;
    }

    this.setStatus("connecting");

    const channelName = `group_table_${this.tableCode}`;
    this.supabaseChannel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: this.currentMemberId || undefined },
      },
    });

    this.supabaseChannel
      .on("broadcast", { event: "sync_event" }, ({ payload }: any) => {
        if (!payload || payload.senderId === this.currentMemberId) return;
        this.handleIncomingEvent(payload.type, payload.data);
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          this.setStatus("cloud_connected");
          // Request latest snapshot from peers in case we joined after others
          this.broadcastEvent("REQUEST_SNAPSHOT", { requesterId: this.currentMemberId });
        } else if (status === "CHANNEL_ERROR") {
          this.setStatus(localBroadcastChannel ? "local_broadcast" : "offline");
        }
      });
  }

  private async tryFetchFromDatabase() {
    if (!supabase || !this.tableCode) return;
    try {
      const { data, error } = await supabase
        .from("group_orders")
        .select("session_data")
        .eq("table_code", this.tableCode)
        .maybeSingle();

      if (!error && data?.session_data) {
        const remoteSession = data.session_data as GroupSession;
        if (this.onSessionUpdated) {
          this.onSessionUpdated(remoteSession);
        }
      }
    } catch {
      // Table group_orders might not exist yet in Supabase — Realtime Broadcast handles it!
    }
  }

  private handleIncomingEvent(type: string, data: any) {
    if (!data) return;

    if (type === "FULL_SNAPSHOT") {
      const incomingSession = data as GroupSession;
      if (this.onSessionUpdated && incomingSession.tableCode === this.tableCode) {
        this.onSessionUpdated(incomingSession);
      }
    } else if (type === "MEMBER_UPDATED") {
      const { member }: { member: GroupMember } = data;
      const { session } = loadSavedGroupSession();
      if (session && session.tableCode === this.tableCode && member) {
        const updatedSession: GroupSession = {
          ...session,
          updatedAt: Date.now(),
          members: {
            ...session.members,
            [member.id]: member,
          },
        };
        saveGroupSession(updatedSession, this.currentMemberId);
        if (this.onSessionUpdated) {
          this.onSessionUpdated(updatedSession);
        }
      }
    } else if (type === "REQUEST_SNAPSHOT") {
      // An existing peer has the state, send them our current state
      const { session } = loadSavedGroupSession();
      if (session && session.tableCode === this.tableCode) {
        this.broadcastEvent("FULL_SNAPSHOT", session);
      }
    } else if (type === "MEMBER_LEFT") {
      const { memberId }: { memberId: string } = data;
      const { session } = loadSavedGroupSession();
      if (session && session.tableCode === this.tableCode && memberId) {
        const remainingMembers = { ...session.members };
        delete remainingMembers[memberId];
        const updatedSession: GroupSession = {
          ...session,
          updatedAt: Date.now(),
          members: remainingMembers,
        };
        saveGroupSession(updatedSession, this.currentMemberId);
        if (this.onSessionUpdated) {
          this.onSessionUpdated(updatedSession);
        }
      }
    } else if (type === "MEMBER_REMOVED") {
      const { memberId }: { memberId: string } = data;
      if (memberId === this.currentMemberId) {
        saveGroupSession(null, null);
        if (this.onMemberRemoved) {
          this.onMemberRemoved();
        }
        return;
      }
      const { session } = loadSavedGroupSession();
      if (session && session.tableCode === this.tableCode && memberId) {
        const remainingMembers = { ...session.members };
        delete remainingMembers[memberId];
        const updatedSession: GroupSession = {
          ...session,
          updatedAt: Date.now(),
          members: remainingMembers,
        };
        saveGroupSession(updatedSession, this.currentMemberId);
        if (this.onSessionUpdated) {
          this.onSessionUpdated(updatedSession);
        }
      }
    } else if (type === "MEMBER_ADDED") {
      const { member }: { member: GroupMember } = data;
      const { session } = loadSavedGroupSession();
      if (session && session.tableCode === this.tableCode && member) {
        const updatedSession: GroupSession = {
          ...session,
          updatedAt: Date.now(),
          members: {
            ...session.members,
            [member.id]: member,
          },
        };
        saveGroupSession(updatedSession, this.currentMemberId);
        if (this.onSessionUpdated) {
          this.onSessionUpdated(updatedSession);
        }
      }
    } else if (type === "GROUP_DISBANDED") {
      saveGroupSession(null, null);
      if (this.onMemberRemoved) {
        this.onMemberRemoved();
      }
    }
  }

  broadcastGroupDisbanded() {
    this.broadcastEvent("GROUP_DISBANDED", { id: this.tableCode });
    if (this.tableCode && supabase) {
      try {
        supabase.from("group_orders").delete().eq("table_code", this.tableCode);
      } catch {
        // ignore
      }
    }
    saveGroupSession(null, null);
  }

  broadcastSession(session: GroupSession) {
    this.broadcastEvent("FULL_SNAPSHOT", session);
    this.persistToSupabase(session);
  }

  broadcastMemberUpdate(member: GroupMember) {
    this.broadcastEvent("MEMBER_UPDATED", { member });

    // Also update full session in DB if available
    const { session } = loadSavedGroupSession();
    if (session && session.tableCode === this.tableCode) {
      const updatedSession: GroupSession = {
        ...session,
        updatedAt: Date.now(),
        members: {
          ...session.members,
          [member.id]: member,
        },
      };
      this.persistToSupabase(updatedSession);
    }
  }

  broadcastMemberLeft(memberId: string) {
    this.broadcastEvent("MEMBER_LEFT", { memberId });
  }

  broadcastMemberRemoved(memberId: string) {
    this.broadcastEvent("MEMBER_REMOVED", { memberId });
    const { session } = loadSavedGroupSession();
    if (session && session.tableCode === this.tableCode) {
      const remainingMembers = { ...session.members };
      delete remainingMembers[memberId];
      const updatedSession = { ...session, updatedAt: Date.now(), members: remainingMembers };
      this.persistToSupabase(updatedSession);
    }
  }

  broadcastMemberAdded(member: GroupMember) {
    this.broadcastEvent("MEMBER_ADDED", { member });
    const { session } = loadSavedGroupSession();
    if (session && session.tableCode === this.tableCode) {
      const updatedSession = {
        ...session,
        updatedAt: Date.now(),
        members: {
          ...session.members,
          [member.id]: member,
        },
      };
      this.persistToSupabase(updatedSession);
    }
  }

  private broadcastEvent(type: string, data: any) {
    // 1. Send via local BroadcastChannel
    if (localBroadcastChannel && this.tableCode) {
      try {
        localBroadcastChannel.postMessage({
          type,
          tableCode: this.tableCode,
          senderId: this.currentMemberId,
          payload: data,
        });
      } catch {
        // ignore
      }
    }

    // 2. Send via Supabase Realtime broadcast
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: "broadcast",
          event: "sync_event",
          payload: {
            type,
            senderId: this.currentMemberId,
            data,
          },
        });
      } catch {
        // ignore
      }
    }
  }

  private async persistToSupabase(session: GroupSession) {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from("group_orders").upsert(
        {
          table_code: session.tableCode,
          court_id: session.courtId,
          session_data: session,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "table_code" }
      );
    } catch {
      // Ignored if table is not yet created in Supabase SQL editor
    }
  }

  destroy() {
    if (this.supabaseChannel && supabase) {
      try {
        supabase.removeChannel(this.supabaseChannel);
      } catch {
        // ignore
      }
      this.supabaseChannel = null;
    }
    this.tableCode = null;
    this.currentMemberId = null;
    this.onSessionUpdated = null;
    this.onStatusChange = null;
  }
}

export const groupSyncService = new GroupOrderSyncService();

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  checked: boolean;
  count: number;
}

export interface FoodCourt {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tagline: string;
  items: MenuItem[];
}

export interface MemberOrderItem {
  itemId: string;
  name: string;
  price: number;
  count: number;
}

export interface GroupMember {
  id: string;
  name: string;
  avatarColor: string;
  userTag?: string;
  email?: string;
  isHost?: boolean;
  items: MemberOrderItem[];
  joinedAt: number;
}

export interface GroupSession {
  id: string;
  name: string;
  courtId: string;
  courtName: string;
  courtEmoji: string;
  hostId: string;
  hostName: string;
  tableCode?: string;
  members: Record<string, GroupMember>;
  createdAt: number;
  updatedAt: number;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  userTag: string;
  createdAt: string;
}

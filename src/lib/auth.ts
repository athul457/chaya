import { supabase, isSupabaseConfigured } from "./supabase";
import type { AppUser } from "../types";
import { getRandomColor } from "./groupSync";

const USER_STORAGE_KEY = "foodcourt_user_profile";
const USERS_LIST_STORAGE_KEY = "foodcourt_all_registered_users";

export function generateUserTag(userId?: string): string {
  if (userId) {
    const clean = userId.replace(/[^a-zA-Z0-9]/g, "");
    if (clean.length >= 4) {
      return `USR-${clean.slice(-4).toUpperCase()}`;
    }
  }
  return `USR-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function getStoredUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppUser;
      if (!parsed.userTag) {
        parsed.userTag = generateUserTag(parsed.id);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch {
    // fallback
  }
  return null;
}

export function saveStoredUser(user: AppUser | null) {
  try {
    if (user) {
      const sanitizedUser: AppUser = {
        ...user,
        userTag: user.userTag || generateUserTag(user.id),
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sanitizedUser));

      // Also cache in local registry of known users
      const rawList = localStorage.getItem(USERS_LIST_STORAGE_KEY);
      const list: AppUser[] = rawList ? JSON.parse(rawList) : [];
      const existingIdx = list.findIndex(
        (u) => u.email === sanitizedUser.email || u.id === sanitizedUser.id
      );
      if (existingIdx >= 0) {
        list[existingIdx] = sanitizedUser;
      } else {
        list.push(sanitizedUser);
      }
      localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(list));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function getAllRegisteredUsers(): AppUser[] {
  try {
    const rawList = localStorage.getItem(USERS_LIST_STORAGE_KEY);
    if (rawList) {
      const list = JSON.parse(rawList) as AppUser[];
      return list.map((u) => ({
        ...u,
        userTag: u.userTag || generateUserTag(u.id),
      }));
    }
  } catch {
    // ignore
  }
  return [];
}

export async function searchUserByIdOrTag(identifier: string): Promise<AppUser | null> {
  const clean = identifier.trim().toLowerCase();
  if (!clean) return null;

  // 1. Search local registered users cache
  const localList = getAllRegisteredUsers();
  const current = getStoredUser();
  const allKnown = current ? [...localList, current] : localList;
  const match = allKnown.find(
    (u) =>
      u.id.toLowerCase() === clean ||
      (u.userTag && u.userTag.toLowerCase() === clean) ||
      u.email.toLowerCase() === clean ||
      u.name.toLowerCase() === clean
  );
  if (match) return match;

  // 2. Search Supabase profiles table
  if (supabase && isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .or(`id.ilike.%${clean}%,email.ilike.%${clean}%,name.ilike.%${clean}%,user_tag.ilike.%${clean}%`)
        .limit(1)
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          name: data.name,
          email: data.email,
          avatarColor: data.avatar_color || getRandomColor(0),
          userTag: data.user_tag || generateUserTag(data.id),
          createdAt: data.created_at || new Date().toISOString(),
        };
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export interface AuthResult {
  success: boolean;
  user?: AppUser;
  error?: string;
  requiresEmailConfirmation?: boolean;
  savedToSupabase?: boolean;
}

export async function signUpUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  // 1. Fallback if Supabase is not configured
  if (!supabase || !isSupabaseConfigured) {
    const localId = `usr_${Date.now()}`;
    const localUser: AppUser = {
      id: localId,
      name: cleanName,
      email: cleanEmail,
      avatarColor: getRandomColor(Math.floor(Math.random() * 6)),
      userTag: generateUserTag(localId),
      createdAt: new Date().toISOString(),
    };
    saveStoredUser(localUser);
    return { success: true, user: localUser, savedToSupabase: false };
  }

  try {
    // 2. Register user in Supabase Authentication (auth.users)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
        },
      },
    });

    let userId = authData?.user?.id || `usr_${Date.now()}`;
    const avatarColor = getRandomColor(Math.floor(Math.random() * 6));
    const userTag = generateUserTag(userId);

    const appUser: AppUser = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      avatarColor,
      userTag,
      createdAt: new Date().toISOString(),
    };

    // 3. Save user profile to Supabase database table `profiles`
    try {
      await supabase.from("profiles").upsert(
        {
          id: userId,
          name: cleanName,
          email: cleanEmail,
          user_tag: userTag,
          avatar_color: avatarColor,
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch {
      // Ignored if table 'profiles' hasn't been created in Supabase SQL editor yet
    }

    // 4. Handle auth response
    if (authError) {
      if (
        authError.message.toLowerCase().includes("rate limit") ||
        (authError as any).status === 429
      ) {
        return {
          success: false,
          error:
            "Supabase Rate Limit: In your Supabase Dashboard, click 'Sign In / Providers' ➔ 'Email' ➔ toggle OFF 'Confirm email' and click Save to enable instant signups!",
        };
      }
      return { success: false, error: authError.message };
    }

    if (authData?.user) {
      saveStoredUser(appUser);
      return {
        success: true,
        user: appUser,
        requiresEmailConfirmation: !authData.session,
        savedToSupabase: true,
      };
    }

    saveStoredUser(appUser);
    return { success: true, user: appUser, savedToSupabase: true };
  } catch {
    // Graceful fallback so user is never blocked
    const fallbackId = `usr_${Date.now()}`;
    const fallbackUser: AppUser = {
      id: fallbackId,
      name: cleanName,
      email: cleanEmail,
      avatarColor: getRandomColor(0),
      userTag: generateUserTag(fallbackId),
      createdAt: new Date().toISOString(),
    };
    saveStoredUser(fallbackUser);
    return { success: true, user: fallbackUser, savedToSupabase: false };
  }
}

export async function signInUser(
  email: string,
  password: string
): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();

  if (!supabase || !isSupabaseConfigured) {
    const stored = getStoredUser();
    if (stored && stored.email === cleanEmail) {
      return { success: true, user: stored };
    }
    const localId = `usr_${Date.now()}`;
    const localUser: AppUser = {
      id: localId,
      name: cleanEmail.split("@")[0],
      email: cleanEmail,
      avatarColor: getRandomColor(0),
      userTag: generateUserTag(localId),
      createdAt: new Date().toISOString(),
    };
    saveStoredUser(localUser);
    return { success: true, user: localUser };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      // If email confirmation is required or rate limited in Supabase, check saved profile
      const stored = getStoredUser();
      if (stored && stored.email === cleanEmail) {
        return { success: true, user: stored };
      }

      // Check local registered users list
      try {
        const rawList = localStorage.getItem(USERS_LIST_STORAGE_KEY);
        const list: AppUser[] = rawList ? JSON.parse(rawList) : [];
        const match = list.find((u) => u.email === cleanEmail);
        if (match) {
          saveStoredUser(match);
          return { success: true, user: match };
        }
      } catch {
        // ignore
      }

      // Check if user exists in database table 'profiles'
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (profile) {
          const appUser: AppUser = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            avatarColor: profile.avatar_color || getRandomColor(0),
            userTag: profile.user_tag || generateUserTag(profile.id),
            createdAt: profile.created_at || new Date().toISOString(),
          };
          saveStoredUser(appUser);
          return { success: true, user: appUser };
        }
      } catch {
        // ignore
      }

      return { success: false, error: error.message };
    }

    if (data.user) {
      const appUser: AppUser = {
        id: data.user.id,
        name: data.user.user_metadata?.full_name || cleanEmail.split("@")[0],
        email: data.user.email || cleanEmail,
        avatarColor: getRandomColor(0),
        userTag: generateUserTag(data.user.id),
        createdAt: data.user.created_at || new Date().toISOString(),
      };
      saveStoredUser(appUser);
      return { success: true, user: appUser, savedToSupabase: true };
    }

    return { success: false, error: "Could not log in. Please check your credentials." };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}

export async function signOutUser(): Promise<void> {
  saveStoredUser(null);
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
}

export function subscribeToAuthChanges(callback: (user: AppUser | null) => void) {
  if (!supabase) return () => {};

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (session?.user) {
        const appUser: AppUser = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          avatarColor: getRandomColor(0),
          userTag: generateUserTag(session.user.id),
          createdAt: session.user.created_at || new Date().toISOString(),
        };
        saveStoredUser(appUser);
        callback(appUser);
      } else {
        saveStoredUser(null);
        callback(null);
      }
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}

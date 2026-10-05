import { supabase, isSupabaseConfigured } from "./supabase";
import type { FoodCourt, MenuItem } from "../types";
import { initialFoodCourts } from "../data";

const STORAGE_KEY = "foodcourt_data";

export function getCachedCourts(): FoodCourt[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as FoodCourt[];
      return parsed.map((c) => {
        if (c.id === "dhoshakkad" || c.name === "Dhoshakkad") {
          return { ...c, id: "doshakkada", name: "Doshakkada" };
        }
        return c;
      });
    }
  } catch {
    // fallback
  }
  return initialFoodCourts;
}

export function saveCachedCourts(courts: FoodCourt[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courts));
  } catch {
    // ignore
  }
}

/**
 * Fetch shops and menu items from Supabase database tables
 */
export async function fetchShopsWithItems(): Promise<FoodCourt[]> {
  if (!supabase || !isSupabaseConfigured) {
    return getCachedCourts();
  }

  try {
    // 1. Fetch all shops
    const { data: shopsData, error: shopsError } = await supabase
      .from("shops")
      .select("*")
      .order("created_at", { ascending: true });

    if (shopsError) {
      console.warn(
        "ℹ️ [Splitwale] Supabase 'shops' table not found in database. Run the SQL script from `supabase_schema.sql` in your Supabase project's SQL Editor to create the tables. Falling back to local storage.",
        shopsError
      );
      return getCachedCourts();
    }

    // If table exists but is empty, automatically seed initial shops
    if (!shopsData || shopsData.length === 0) {
      await seedInitialShopsToSupabase();
      return initialFoodCourts;
    }

    // 2. Fetch all menu items
    const { data: itemsData, error: itemsError } = await supabase
      .from("menu_items")
      .select("*")
      .order("created_at", { ascending: true });

    if (itemsError) {
      console.warn(
        "ℹ️ [Splitwale] Supabase 'menu_items' table error. Run `supabase_schema.sql` in Supabase SQL Editor:",
        itemsError
      );
      return getCachedCourts();
    }

    // 3. Merge shops with their items
    const courts: FoodCourt[] = shopsData.map((s: any) => {
      const shopItems: MenuItem[] = (itemsData || [])
        .filter((item: any) => item.shop_id === s.id)
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          checked: false,
          count: 1,
        }));

      return {
        id: s.id,
        name: s.name,
        description: s.description || "",
        emoji: s.emoji || "🍽️",
        tagline: s.tagline || "",
        items: shopItems,
      };
    });

    saveCachedCourts(courts);
    return courts;
  } catch {
    return getCachedCourts();
  }
}

/**
 * Seed initial shops & menu items to Supabase
 */
export async function seedInitialShopsToSupabase() {
  if (!supabase || !isSupabaseConfigured) return;

  try {
    for (const court of initialFoodCourts) {
      await supabase.from("shops").upsert(
        {
          id: court.id,
          name: court.name,
          description: court.description,
          emoji: court.emoji,
          tagline: court.tagline,
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      for (const item of court.items) {
        await supabase.from("menu_items").upsert(
          {
            id: item.id,
            shop_id: court.id,
            name: item.name,
            price: item.price,
            created_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      }
    }
  } catch {
    // Ignored if tables not created yet
  }
}

/**
 * Add / Update shop in Supabase database
 */
export async function saveShopToSupabase(shop: FoodCourt) {
  if (!supabase || !isSupabaseConfigured) return;

  try {
    await supabase.from("shops").upsert(
      {
        id: shop.id,
        name: shop.name,
        description: shop.description,
        emoji: shop.emoji,
        tagline: shop.tagline,
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (shop.items && shop.items.length > 0) {
      for (const item of shop.items) {
        await supabase.from("menu_items").upsert(
          {
            id: item.id,
            shop_id: shop.id,
            name: item.name,
            price: item.price,
            created_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Delete shop from Supabase database
 */
export async function deleteShopFromSupabase(shopId: string) {
  if (!supabase || !isSupabaseConfigured) return;

  try {
    await supabase.from("shops").delete().eq("id", shopId);
  } catch {
    // ignore
  }
}

/**
 * Add / Update menu item in Supabase database
 */
export async function saveMenuItemToSupabase(shopId: string, item: MenuItem) {
  if (!supabase || !isSupabaseConfigured) return;

  try {
    await supabase.from("menu_items").upsert(
      {
        id: item.id,
        shop_id: shopId,
        name: item.name,
        price: item.price,
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch {
    // ignore
  }
}

/**
 * Delete menu item from Supabase database
 */
export async function deleteMenuItemFromSupabase(itemId: string) {
  if (!supabase || !isSupabaseConfigured) return;

  try {
    await supabase.from("menu_items").delete().eq("id", itemId);
  } catch {
    // ignore
  }
}

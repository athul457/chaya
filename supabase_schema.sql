-- ============================================================
-- Supabase Schema for Food Court App
-- Tables: public.shops, public.menu_items
-- ============================================================

-- 1. Create the 'shops' table
CREATE TABLE IF NOT EXISTS public.shops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  emoji TEXT DEFAULT '🍽️',
  tagline TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Allow public read and write access for all users
CREATE POLICY "Allow public read access to shops"
  ON public.shops FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert/update to shops"
  ON public.shops FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to shops"
  ON public.shops FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to shops"
  ON public.shops FOR DELETE
  USING (true);


-- 2. Create the 'menu_items' table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Allow public read and write access for all items
CREATE POLICY "Allow public read access to menu_items"
  ON public.menu_items FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to menu_items"
  ON public.menu_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to menu_items"
  ON public.menu_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to menu_items"
  ON public.menu_items FOR DELETE
  USING (true);


-- 3. (Optional) Initial Seed Data for Default Shops & Dishes
INSERT INTO public.shops (id, name, description, emoji, tagline) VALUES
  ('doshakkada', 'Doshakkada', 'Authentic South Indian crispy dosas, fluffy idlis, and traditional chutneys.', '🥞', 'Taste of Tradition'),
  ('tappas', 'Tappas', 'Fresh street snacks, rolls, spicy bites, and quick afternoon munchies.', '🌯', 'Quick & Flavorful'),
  ('blackcoffee', 'Black Coffee', 'Brewed specialty coffees, iced coolers, teas, and delectable bakery bites.', '☕', 'Freshly Brewed Every Day')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.menu_items (id, shop_id, name, price) VALUES
  -- Doshakkada
  ('d1', 'doshakkada', 'Plain Dosa', 40),
  ('d2', 'doshakkada', 'Ghee Roast Dosa', 70),
  ('d3', 'doshakkada', 'Masala Dosa', 65),
  ('d4', 'doshakkada', 'Egg Dosa', 60),
  ('d5', 'doshakkada', 'Onion Uthappam', 55),
  ('d6', 'doshakkada', 'Idli (3 pcs) with Sambar', 35),
  ('d7', 'doshakkada', 'Medu Vada (2 pcs)', 30),
  ('d8', 'doshakkada', 'Filter Coffee', 20),

  -- Tappas
  ('t1', 'tappas', 'Chicken Kathi Roll', 90),
  ('t2', 'tappas', 'Paneer Tikka Roll', 80),
  ('t3', 'tappas', 'Egg Roll', 60),
  ('t4', 'tappas', 'Veg Spring Rolls (4 pcs)', 70),
  ('t5', 'tappas', 'Crispy Chicken Wings (4 pcs)', 120),
  ('t6', 'tappas', 'Peri Peri French Fries', 60),
  ('t7', 'tappas', 'Cheese Samosa (3 pcs)', 50),
  ('t8', 'tappas', 'Fresh Mint Lemonade', 35),

  -- Black Coffee
  ('b1', 'blackcoffee', 'Espresso (Single shot)', 50),
  ('b2', 'blackcoffee', 'Americano (Black Coffee)', 60),
  ('b3', 'blackcoffee', 'Cappuccino', 80),
  ('b4', 'blackcoffee', 'Café Latte', 85),
  ('b5', 'blackcoffee', 'Cold Brew Coffee', 95),
  ('b6', 'blackcoffee', 'Iced Caramel Macchiato', 110),
  ('b7', 'blackcoffee', 'Masala Chai', 30),
  ('b8', 'blackcoffee', 'Chocolate Brownie', 65)
ON CONFLICT (id) DO NOTHING;

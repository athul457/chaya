import type { FoodCourt } from "./types";

export const initialFoodCourts: FoodCourt[] = [
  {
    id: "doshakkada",
    name: "Doshakkada",
    description: "South Indian street food",
    emoji: "🫓",
    tagline: "Crispy dosas & authentic chaat, straight from the griddle",
    items: [
      { id: "dk-1", name: "Tea", price: 12, checked: false, count: 1 },
      { id: "dk-2", name: "Coffee", price: 12, checked: false, count: 1 },
      { id: "dk-3", name: "Dosha", price: 10, checked: false, count: 1 },
      { id: "dk-4", name: "Porotta", price: 12, checked: false, count: 1 },
      { id: "dk-5", name: "Samoosa", price: 12, checked: false, count: 1 },
      { id: "dk-6", name: "Motta (Puzhungoyath)", price: 10, checked: false, count: 1 },
      { id: "dk-7", name: "Omlette", price: 20, checked: false, count: 1 },
      { id: "dk-8", name: "Bull's Eye Egg", price: 10, checked: false, count: 1 },
      { id: "dk-9", name: "Pass Pass", price: 1, checked: false, count: 1 },
    ],
  },
  {
    id: "tappas",
    name: "Tappas",
    description: "Tapas & small plates",
    emoji: "🥘",
    tagline: "Share the joy — bold bites made for good company",
    items: [
      { id: "tp-1", name: "Patatas Bravas", price: 150, checked: false, count: 1 },
      { id: "tp-2", name: "Garlic Mushrooms", price: 130, checked: false, count: 1 },
      { id: "tp-3", name: "Chicken Skewers", price: 220, checked: false, count: 1 },
      { id: "tp-4", name: "Cheese Croquettes", price: 160, checked: false, count: 1 },
      { id: "tp-5", name: "Mixed Olives", price: 100, checked: false, count: 1 },
    ],
  },
  {
    id: "black-coffee",
    name: "Black Coffee",
    description: "Coffee & light bites",
    emoji: "☕",
    tagline: "Dark roasts, warm vibes & bites that hit just right",
    items: [
      { id: "bc-1", name: "Espresso", price: 80, checked: false, count: 1 },
      { id: "bc-2", name: "Cold Brew", price: 120, checked: false, count: 1 },
      { id: "bc-3", name: "Cappuccino", price: 110, checked: false, count: 1 },
      { id: "bc-4", name: "Chocolate Muffin", price: 90, checked: false, count: 1 },
      { id: "bc-5", name: "Croissant", price: 100, checked: false, count: 1 },
    ],
  },
];


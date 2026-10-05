# Splitwale 🍽️

**Splitwale** is a modern Single Page Application (SPA) designed for real-time collaborative food ordering and bill splitting across food courts and street stalls.

## ✨ Features

- **Collaborative Real-time Group Orders**: Multiple friends can join the same table group using a unique Group ID or User ID and select their dishes simultaneously.
- **Dedicated Itemized Bill Breakdown (`/group-bill`)**:
  - 👤 **Personal Share**: View your exact eaten items, counts, unit prices, and personal subtotal.
  - 👥 **Team Breakdown**: View each friend's individual order and subtotal.
  - 🍱 **Whole Team Food Basket**: Aggregated list of all dishes combined for easy counter ordering.
  - 💰 **Grand Total Bill**: Clear split stats comparing your share vs. team share vs. grand total.
- **Multi-Shop / Food Court Management**: Browse food stalls (e.g. Doshakkada, Tapas, Black Coffee) or add custom shops with interactive menu editors.
- **Real-time Sync**: Multi-device cloud sync powered by Supabase Realtime with local multi-tab broadcast fallback.

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Supabase credentials if using cloud sync.

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

import React, { useState } from "react";
import type { FoodCourt, MenuItem } from "../../../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddShop: (newShop: FoodCourt) => void;
}

const POPULAR_EMOJIS = ["🧃", "🍔", "🍕", "🍜", "🍛", "🥪", "🍰", "🥗", "🍦", "🍗", "🌮", "🥞", "☕", "🫓"];

export const AddShopModal: React.FC<Props> = ({ isOpen, onClose, onAddShop }) => {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🧃");
  const [description, setDescription] = useState("");
  const [tagline, setTagline] = useState("");
  const [initialItemName, setInitialItemName] = useState("");
  const [initialItemPrice, setInitialItemPrice] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const newShopId = `shop-${slug || "custom"}-${Date.now()}`;

    const starterItems: MenuItem[] = [];
    if (initialItemName.trim()) {
      starterItems.push({
        id: `${newShopId}-1`,
        name: initialItemName.trim(),
        price: parseFloat(initialItemPrice) > 0 ? parseFloat(initialItemPrice) : 20,
        checked: false,
        count: 1,
      });
    }

    const newShop: FoodCourt = {
      id: newShopId,
      name: name.trim(),
      emoji: emoji.trim() || "🍽️",
      description: description.trim() || "Delicious food & beverages",
      tagline: tagline.trim() || "Freshly made to order",
      items: starterItems,
    };

    onAddShop(newShop);
    onClose();

    // Reset form
    setName("");
    setEmoji("🧃");
    setDescription("");
    setTagline("");
    setInitialItemName("");
    setInitialItemPrice("");
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box add-shop-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="group-modal-title-row">
            <span className="group-modal-icon">🏪</span>
            <div>
              <h2 className="modal-title">Add New Food Court Shop</h2>
              <p className="modal-subtitle">Add a food stall or shop with custom menu items</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="group-form add-shop-form">
          {/* Shop Emoji Selector */}
          <div className="form-group">
            <label className="form-label">Shop Icon / Emoji</label>
            <div className="emoji-picker-container">
              <input
                type="text"
                className="form-input emoji-single-input"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
                required
              />
              <div className="emoji-quick-picks">
                {POPULAR_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className={`emoji-chip-btn ${emoji === em ? "active" : ""}`}
                    onClick={() => setEmoji(em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Shop Name */}
          <div className="form-group">
            <label className="form-label">Shop Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Juice Bar, Burger Hub, Biryani House"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Category / Description */}
          <div className="form-group">
            <label className="form-label">Category / Short Description</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Fresh juices, shakes & mocktails"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Tagline */}
          <div className="form-group">
            <label className="form-label">Tagline</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Cold pressed & fresh fruit refreshment"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>

          {/* Optional Initial Menu Item */}
          <div className="initial-item-card">
            <span className="initial-item-title">🍽️ Add First Menu Item (Optional)</span>
            <div className="initial-item-grid">
              <input
                type="text"
                className="form-input"
                placeholder="Item name (e.g. Mango Shake)"
                value={initialItemName}
                onChange={(e) => setInitialItemName(e.target.value)}
              />
              <div className="price-input-wrapper">
                <span className="price-prefix">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="form-input price-input"
                  placeholder="Price (e.g. 50)"
                  value={initialItemPrice}
                  onChange={(e) => setInitialItemPrice(e.target.value)}
                />
              </div>
            </div>
            <span className="form-hint">
              You can also add more items anytime inside the shop's menu!
            </span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              + Create Shop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddShopModal;

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCourts } from "../context/CourtsContext";
import type { FoodCourt, MenuItem } from "../types";

const POPULAR_EMOJIS = [
  "🧃", "🍔", "🍕", "🍜", "🍛", "🥪", "🍰", "🥗",
  "🍦", "🍗", "🌮", "🥞", "☕", "🫓", "🥟", "🍣",
  "🥨", "🍩", "🥤", "🍲"
];

export const AddShopPage: React.FC = () => {
  const navigate = useNavigate();
  const { handleAddShop } = useCourts();

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🧃");
  const [description, setDescription] = useState("");
  const [tagline, setTagline] = useState("");
  const [initialItemName, setInitialItemName] = useState("");
  const [initialItemPrice, setInitialItemPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);

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

    // Add to context and synchronize with Supabase
    handleAddShop(newShop);

    // Redirect straight into the new shop's menu
    navigate(`/court/${newShop.id}`);
  };

  return (
    <div className="add-shop-page-wrapper">
      <div className="add-shop-container">
        {/* Top Navigation / Breadcrumb */}
        <div className="add-shop-header-nav">
          <Link to="/dashboard" className="add-shop-back-link">
            <span>←</span> Back to Food Courts
          </Link>
          <span className="add-shop-breadcrumb-badge">New Stall Creation</span>
        </div>

        {/* Page Card */}
        <div className="add-shop-card">
          <div className="add-shop-card-hero">
            <div className="add-shop-preview-icon">{emoji}</div>
            <div className="add-shop-hero-text">
              <h1 className="add-shop-title">Create a New Shop</h1>
              <p className="add-shop-subtitle">
                Set up a new food counter, restaurant stall, or beverage bar with custom dishes
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="add-shop-form-body">
            {/* 1. Emoji Selection */}
            <div className="form-section">
              <label className="section-label">1. Choose Shop Icon / Emoji</label>
              <div className="emoji-selection-row">
                <div className="emoji-display-box">
                  <span className="emoji-large">{emoji}</span>
                </div>
                <div className="emoji-grid-picker">
                  {POPULAR_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className={`emoji-grid-btn ${emoji === em ? "active" : ""}`}
                      onClick={() => setEmoji(em)}
                      aria-label={`Select ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Shop Identity */}
            <div className="form-section">
              <label className="section-label">2. Shop Details</label>

              <div className="input-group">
                <label className="input-label" htmlFor="shop-name">
                  Shop / Stall Name <span className="req">*</span>
                </label>
                <input
                  id="shop-name"
                  type="text"
                  className="clean-input"
                  placeholder="e.g. Fresh Juice Bar, Biryani Hub, Chai & Snacks"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="shop-desc">
                  Category / Short Description
                </label>
                <input
                  id="shop-desc"
                  type="text"
                  className="clean-input"
                  placeholder="e.g. Fresh fruit juices, milkshakes and fruit salads"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="shop-tagline">
                  Tagline / Catchphrase
                </label>
                <input
                  id="shop-tagline"
                  type="text"
                  className="clean-input"
                  placeholder="e.g. 100% Pure & Cold Pressed"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>
            </div>

            {/* 3. Starter Dish Item */}
            <div className="form-section highlight-section">
              <div className="starter-header">
                <div>
                  <label className="section-label" style={{ marginBottom: "0.2rem" }}>
                    3. First Menu Item <span className="optional-tag">(Optional)</span>
                  </label>
                  <p className="starter-desc">
                    Add your first signature dish now. You can add more items anytime inside the shop's menu!
                  </p>
                </div>
                <span className="starter-badge">🍽️ Initial Dish</span>
              </div>

              <div className="starter-inputs-grid">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="item-name">Dish / Beverage Name</label>
                  <input
                    id="item-name"
                    type="text"
                    className="clean-input"
                    placeholder="e.g. Mango Milkshake"
                    value={initialItemName}
                    onChange={(e) => setInitialItemName(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="item-price">Price (₹)</label>
                  <div className="price-box-wrapper">
                    <span className="currency-symbol">₹</span>
                    <input
                      id="item-price"
                      type="number"
                      step="any"
                      min="0"
                      className="clean-input price-clean-input"
                      placeholder="60"
                      value={initialItemPrice}
                      onChange={(e) => setInitialItemPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="add-shop-actions">
              <button
                type="button"
                className="btn btn-secondary btn-action-cancel"
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-action-submit"
                disabled={!name.trim() || submitting}
              >
                {submitting ? "Creating Shop..." : "🏪 Create & Open Shop"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddShopPage;

import React from "react";
import type { FoodCourt } from "../../../types";

interface Props {
  courts: FoodCourt[];
  onSelect: (id: string) => void;
  onAddNewShop?: () => void;
  onDeleteShop?: (id: string) => void;
}

export const FoodCourtCard: React.FC<Props> = ({
  courts,
  onSelect,
  onAddNewShop,
  onDeleteShop,
}) => {
  return (
    <div className="home-grid">
      {courts.map((court) => (
        <div key={court.id} className="court-card-wrapper">
          <button
            className="court-card"
            onClick={() => onSelect(court.id)}
            aria-label={`Open ${court.name} menu`}
          >
            <div className="court-emoji">{court.emoji}</div>
            <div className="court-info">
              <h2 className="court-name">{court.name}</h2>
              <p className="court-desc">{court.description}</p>
              <p className="court-tagline">{court.tagline}</p>
              <span className="court-items-count">
                {court.items.length} menu item{court.items.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="court-arrow">›</div>
          </button>

          {onDeleteShop && (
            <button
              type="button"
              className="court-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to remove "${court.name}"?`)) {
                  onDeleteShop(court.id);
                }
              }}
              title={`Remove ${court.name}`}
              aria-label={`Remove ${court.name}`}
            >
              ✕
            </button>
          )}
        </div>
      ))}

      {/* Add New Shop Card */}
      {onAddNewShop && (
        <button
          type="button"
          className="court-card court-card--add"
          onClick={onAddNewShop}
          aria-label="Add new food court shop"
        >
          <div className="court-emoji add-emoji">+</div>
          <div className="court-info">
            <h2 className="court-name">Add New Shop</h2>
            <p className="court-desc">Open a new food counter or stall</p>
            <p className="court-tagline">Customize menu items, emoji, and prices</p>
          </div>
          <div className="court-arrow court-arrow--add">+</div>
        </button>
      )}
    </div>
  );
};

export default FoodCourtCard;

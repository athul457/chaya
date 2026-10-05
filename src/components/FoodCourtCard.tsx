import React, { useState } from "react";
import type { FoodCourt } from "../types";

interface Props {
  courts: FoodCourt[];
  onSelect: (id: string) => void;
  onAddNewShop?: () => void;
  onDeleteShop?: (id: string) => void;
}

const FoodCourtCard: React.FC<Props> = ({
  courts,
  onSelect,
  onAddNewShop,
  onDeleteShop,
}) => {
  const [shopToDelete, setShopToDelete] = useState<FoodCourt | null>(null);
  const [confirmName, setConfirmName] = useState("");

  const handleOpenDeleteConfirm = (e: React.MouseEvent, court: FoodCourt) => {
    e.stopPropagation();
    setShopToDelete(court);
    setConfirmName("");
  };

  const handleCloseDeleteConfirm = () => {
    setShopToDelete(null);
    setConfirmName("");
  };

  const isNameMatching =
    shopToDelete !== null &&
    confirmName.trim().toLowerCase() === shopToDelete.name.trim().toLowerCase();

  const handleConfirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopToDelete || !isNameMatching) return;
    if (onDeleteShop) {
      onDeleteShop(shopToDelete.id);
    }
    handleCloseDeleteConfirm();
  };

  return (
    <>
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
                onClick={(e) => handleOpenDeleteConfirm(e, court)}
                title={`Delete ${court.name}`}
                aria-label={`Delete ${court.name}`}
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

      {/* Delete Confirmation Modal Requiring Shop Name */}
      {shopToDelete && (
        <div
          className="modal-overlay"
          onClick={handleCloseDeleteConfirm}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-box delete-confirm-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header delete-confirm-header">
              <div className="group-modal-title-row">
                <span className="delete-modal-icon">⚠️</span>
                <div>
                  <h3 className="modal-title delete-modal-title">Delete Shop</h3>
                  <p className="modal-subtitle">Permanent action requiring confirmation</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={handleCloseDeleteConfirm}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDelete} className="modal-form delete-confirm-form">
              <div className="delete-warning-box">
                <p className="delete-warning-text">
                  Are you sure you want to permanently delete{" "}
                  <strong>
                    {shopToDelete.emoji} {shopToDelete.name}
                  </strong>{" "}
                  and all of its {shopToDelete.items.length} menu items?
                </p>
                <p className="delete-instruction">
                  To confirm deletion, please type the shop name{" "}
                  <code className="delete-code-highlight">{shopToDelete.name}</code> below:
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm-shop-name-input">
                  Enter Shop Name to Confirm:
                </label>
                <input
                  id="confirm-shop-name-input"
                  type="text"
                  className={`form-input ${confirmName && !isNameMatching ? "input-error" : ""}`}
                  placeholder={`Type "${shopToDelete.name}"`}
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  autoFocus
                  autoComplete="off"
                />
                {confirmName && !isNameMatching && (
                  <span className="error-msg">
                    Name does not match "{shopToDelete.name}"
                  </span>
                )}
              </div>

              <div className="modal-footer delete-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseDeleteConfirm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={!isNameMatching}
                  title={
                    isNameMatching
                      ? `Permanently delete ${shopToDelete.name}`
                      : `Type "${shopToDelete.name}" to enable button`
                  }
                >
                  🗑️ Delete Shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FoodCourtCard;

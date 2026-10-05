import React, { useEffect, useRef, useState } from "react";
import type { MenuItem } from "../types";

interface Props {
  item?: MenuItem | null;
  onSave: (name: string, price: number) => void;
  onClose: () => void;
}

const ItemModal: React.FC<Props> = ({ item, onSave, onClose }) => {
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    setName(item?.name ?? "");
    setPrice(item ? String(item.price) : "");
    setErrors({});
  }, [item]);

  const validate = () => {
    const e: { name?: string; price?: string } = {};
    if (!name.trim()) e.name = "Item name is required";
    const p = parseFloat(price);
    if (!price || isNaN(p) || p <= 0) e.price = "Enter a valid price (> 0)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(name.trim(), parseFloat(price));
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleBackdrop} role="dialog" aria-modal="true">
      <div className="modal-box">
        <div className="modal-header">
          <h3 className="modal-title">{item ? "Edit Item" : "Add New Item"}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          <div className="form-group">
            <label htmlFor="item-name" className="form-label">
              Item Name
            </label>
            <input
              id="item-name"
              ref={nameRef}
              type="text"
              className={`form-input ${errors.name ? "input-error" : ""}`}
              placeholder="e.g. Butter Chicken"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <p className="error-msg">{errors.name}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="item-price" className="form-label">
              Price (₹)
            </label>
            <input
              id="item-price"
              type="number"
              min="0.01"
              step="0.01"
              className={`form-input ${errors.price ? "input-error" : ""}`}
              placeholder="e.g. 250"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {errors.price && <p className="error-msg">{errors.price}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {item ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemModal;

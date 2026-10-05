import React, { useState } from "react";
import type { MenuItem } from "../types";

export interface GroupMemberItemInfo {
  memberId: string;
  memberName: string;
  avatarColor: string;
  count: number;
  isMe: boolean;
}

interface Props {
  item: MenuItem;
  onToggle: (id: string) => void;
  onCountChange: (id: string, delta: number) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  groupMemberOrders?: GroupMemberItemInfo[];
}

const MenuItemRow: React.FC<Props> = ({
  item,
  onToggle,
  onCountChange,
  onEdit,
  onDelete,
  groupMemberOrders = [],
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(item.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
    }
  };

  const otherOrders = groupMemberOrders.filter((o) => !o.isMe && o.count > 0);

  return (
    <div className={`menu-row ${item.checked ? "menu-row--checked" : ""}`}>
      <label className="menu-checkbox" title="Select item">
        <input
          type="checkbox"
          checked={item.checked}
          onChange={() => onToggle(item.id)}
          aria-label={`Select ${item.name}`}
        />
        <span className="checkmark" />
      </label>

      <div className="menu-details">
        <div className="menu-name-row">
          <span className="menu-name">{item.name}</span>
          <span className="menu-price">₹{item.price.toFixed(2)}</span>
        </div>

        {/* Live group indicators: shows what other friends on this table ordered */}
        {otherOrders.length > 0 && (
          <div className="row-group-badges" title="Friends at your table ordering this item">
            <span className="group-ordered-label">Friends ordering:</span>
            {otherOrders.map((o) => (
              <span
                key={o.memberId}
                className="friend-order-badge"
                style={{ borderColor: `${o.avatarColor}66` }}
              >
                <span className="friend-badge-dot" style={{ backgroundColor: o.avatarColor }} />
                <span className="friend-badge-text">
                  {o.memberName}: <strong>{o.count}</strong>
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="menu-counter">
        <button
          className="counter-btn"
          onClick={() => onCountChange(item.id, -1)}
          disabled={item.count <= 1}
          aria-label="Decrease count"
        >
          −
        </button>
        <span className="counter-value">{item.count}</span>
        <button
          className="counter-btn"
          onClick={() => onCountChange(item.id, 1)}
          aria-label="Increase count"
        >
          +
        </button>
      </div>

      <div className="menu-subtotal">
        ₹{(item.price * item.count).toFixed(2)}
      </div>

      <div className="menu-actions">
        <button
          className="btn-icon btn-edit"
          onClick={() => onEdit(item)}
          title="Edit item"
          aria-label={`Edit ${item.name}`}
        >
          ✏️
        </button>
        <button
          className={`btn-icon btn-delete ${confirmDelete ? "btn-delete--confirm" : ""}`}
          onClick={handleDelete}
          title={confirmDelete ? "Click again to confirm" : "Delete item"}
          aria-label={`Delete ${item.name}`}
        >
          {confirmDelete ? "✓?" : "🗑️"}
        </button>
      </div>
    </div>
  );
};

export default MenuItemRow;

import React, { useState, useEffect } from "react";
import type { FoodCourt, MenuItem, GroupSession, MemberOrderItem } from "../types";
import MenuItemRow, { type GroupMemberItemInfo } from "./MenuItemRow";
import ItemModal from "./ItemModal";
import { saveMenuItemToSupabase, deleteMenuItemFromSupabase } from "../lib/shopService";

interface Props {
  court: FoodCourt;
  onBack: () => void;
  onUpdateCourt: (updated: FoodCourt) => void;
  groupSession: GroupSession | null;
  currentMemberId: string | null;
  onOpenGroupModal: () => void;
  onOpenGroupBill: () => void;
  onUpdateMemberItems: (items: MemberOrderItem[]) => void;
}

const MenuPage: React.FC<Props> = ({
  court,
  onBack,
  onUpdateCourt,
  groupSession,
  currentMemberId,
  onOpenGroupModal,
  onOpenGroupBill,
  onUpdateMemberItems,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Sync member items when entering or when group session changes externally
  useEffect(() => {
    if (!groupSession || !currentMemberId) return;
    const currentMember = groupSession.members[currentMemberId];
    if (!currentMember) return;

    // Check if court.items matches currentMember.items
    const myItemsMap = new Map(currentMember.items.map((i) => [i.itemId, i.count]));
    const needsUpdate = court.items.some((item) => {
      const myCount = myItemsMap.get(item.id);
      const isChecked = Boolean(myCount);
      return item.checked !== isChecked || (isChecked && item.count !== myCount);
    });

    if (needsUpdate) {
      const updated = court.items.map((item) => {
        const myCount = myItemsMap.get(item.id);
        if (myCount) {
          return { ...item, checked: true, count: myCount };
        }
        return { ...item, checked: false };
      });
      onUpdateCourt({ ...court, items: updated });
    }
  }, [groupSession?.tableCode, currentMemberId]);

  const checkedItems = court.items.filter((i) => i.checked);
  const myTotalAmount = checkedItems.reduce((sum, i) => sum + i.price * i.count, 0);
  const myTotalCount = checkedItems.reduce((sum, i) => sum + i.count, 0);

  // Calculate Group-wide totals
  const allMembersList = groupSession ? Object.values(groupSession.members) : [];
  const groupTotalAmount = allMembersList.reduce(
    (sum, m) => sum + m.items.reduce((s, i) => s + i.price * i.count, 0),
    0
  );
  const groupTotalCount = allMembersList.reduce(
    (sum, m) => sum + m.items.reduce((s, i) => s + i.count, 0),
    0
  );

  const syncItemsToGroup = (items: MenuItem[]) => {
    if (!groupSession || !currentMemberId) return;
    const myOrder: MemberOrderItem[] = items
      .filter((i) => i.checked)
      .map((i) => ({
        itemId: i.id,
        name: i.name,
        price: i.price,
        count: i.count,
      }));
    onUpdateMemberItems(myOrder);
  };

  const updateItems = (items: MenuItem[]) => {
    onUpdateCourt({ ...court, items });
    syncItemsToGroup(items);
  };

  const handleToggle = (id: string) => {
    const updated = court.items.map((i) =>
      i.id === id ? { ...i, checked: !i.checked } : i
    );
    updateItems(updated);
  };

  const handleCountChange = (id: string, delta: number) => {
    const updated = court.items.map((i) =>
      i.id === id ? { ...i, count: Math.max(1, i.count + delta) } : i
    );
    updateItems(updated);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = court.items.filter((i) => i.id !== id);
    updateItems(updated);
    deleteMenuItemFromSupabase(id);
  };

  const handleSave = (name: string, price: number) => {
    if (editingItem) {
      const updatedItem = { ...editingItem, name, price };
      const updated = court.items.map((i) =>
        i.id === editingItem.id ? { ...i, name, price } : i
      );
      updateItems(updated);
      saveMenuItemToSupabase(court.id, updatedItem);
    } else {
      const newItem: MenuItem = {
        id: `${court.id}-${Date.now()}`,
        name,
        price,
        checked: false,
        count: 1,
      };
      updateItems([...court.items, newItem]);
      saveMenuItemToSupabase(court.id, newItem);
    }
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSelectAll = () => {
    const allChecked = court.items.every((i) => i.checked);
    const updated = court.items.map((i) => ({ ...i, checked: !allChecked }));
    updateItems(updated);
  };

  // Helper to extract orders of other members for an item
  const getItemMemberOrders = (itemId: string, itemName: string): GroupMemberItemInfo[] => {
    if (!groupSession) return [];

    const result: GroupMemberItemInfo[] = [];
    Object.values(groupSession.members).forEach((member) => {
      // Find by id or by name
      const orderItem = member.items.find(
        (i) => i.itemId === itemId || i.name.toLowerCase() === itemName.toLowerCase()
      );
      if (orderItem && orderItem.count > 0) {
        result.push({
          memberId: member.id,
          memberName: member.name,
          avatarColor: member.avatarColor,
          count: orderItem.count,
          isMe: member.id === currentMemberId,
        });
      }
    });

    return result;
  };

  return (
    <div className="menu-page">
      {/* Header */}
      <div className="menu-header">
        <button className="back-btn" onClick={onBack} aria-label="Back to home">
          ← Back
        </button>
        <div className="menu-header-info">
          <span className="menu-header-emoji">{court.emoji}</span>
          <div>
            <h1 className="menu-header-title">{court.name}</h1>
            <p className="menu-header-sub">{court.tagline}</p>
          </div>
        </div>

        <div className="menu-header-buttons">
          {!groupSession ? (
            <button
              className="btn btn-group-order"
              onClick={onOpenGroupModal}
              title="Start or join a group table to order with friends"
            >
              👥 Group Order
            </button>
          ) : (
            <button
              className="btn btn-group-bill"
              onClick={onOpenGroupBill}
              title="View full group bill breakdown"
            >
              🧾 Group Bill (₹{groupTotalAmount.toFixed(2)})
            </button>
          )}

          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            aria-label="Add new menu item"
          >
            + Add Item
          </button>
        </div>
      </div>

      {/* Column headings */}
      <div className="menu-table">
        <div className="menu-table-head">
          <label className="select-all-label">
            <input
              type="checkbox"
              onChange={handleSelectAll}
              checked={court.items.length > 0 && court.items.every((i) => i.checked)}
              ref={(el) => {
                if (el) {
                  el.indeterminate =
                    court.items.some((i) => i.checked) &&
                    !court.items.every((i) => i.checked);
                }
              }}
              aria-label="Select all items"
            />
            <span className="checkmark" />
          </label>
          <span className="col-name">Item</span>
          <span className="col-price">Qty</span>
          <span className="col-qty">Unit Price</span>
          <span className="col-subtotal">Subtotal</span>
          <span className="col-actions">Actions</span>
        </div>

        {/* Items */}
        <div className="menu-list">
          {court.items.length === 0 ? (
            <div className="empty-state">
              <p>No items yet.</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingItem(null);
                  setModalOpen(true);
                }}
              >
                + Add your first item
              </button>
            </div>
          ) : (
            court.items.map((item) => (
              <MenuItemRow
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onCountChange={handleCountChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                groupMemberOrders={getItemMemberOrders(item.id, item.name)}
              />
            ))
          )}
        </div>
      </div>

      {/* Order summary / Group bill drawer */}
      {groupSession ? (
        <div className="order-summary group-order-summary">
          <div className="order-summary-inner">
            <div className="order-summary-info">
              <div className="group-summary-pills">
                <span className="order-badge">
                  My Selection: {myTotalCount} item{myTotalCount === 1 ? "" : "s"} (₹
                  {myTotalAmount.toFixed(2)})
                </span>
                <span className="group-badge">
                  👥 {allMembersList.length} members ordered {groupTotalCount} items
                </span>
              </div>
              <span className="order-items">
                {checkedItems.length > 0
                  ? checkedItems.map((i) => `${i.count}x ${i.name}`).join(", ")
                  : "Pick items above to add to your order"}
              </span>
            </div>

            <div className="order-total-group-box">
              <div className="order-total">
                <span className="order-total-label">Group Total</span>
                <span className="order-total-amount group-total-val">
                  ₹{groupTotalAmount.toFixed(2)}
                </span>
              </div>
              <button
                className="btn btn-primary btn-sm view-group-bill-btn"
                onClick={onOpenGroupBill}
              >
                View Group Bill ➔
              </button>
            </div>
          </div>
        </div>
      ) : (
        checkedItems.length > 0 && (
          <div className="order-summary">
            <div className="order-summary-inner">
              <div className="order-summary-info">
                <span className="order-badge">
                  {myTotalCount} item{myTotalCount > 1 ? "s" : ""} selected
                </span>
                <span className="order-items">
                  {checkedItems.map((i) => i.name).join(", ")}
                </span>
              </div>
              <div className="order-total">
                <span className="order-total-label">Total</span>
                <span className="order-total-amount">₹{myTotalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )
      )}

      {/* Item Modal */}
      {modalOpen && (
        <ItemModal
          item={editingItem}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

export default MenuPage;

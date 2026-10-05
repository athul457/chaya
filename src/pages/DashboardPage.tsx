import React from "react";
import { useNavigate } from "react-router-dom";
import FoodCourtCard from "../components/FoodCourtCard";
import { useCourts } from "../context/CourtsContext";
import { useGroupOrder } from "../context/GroupOrderContext";

export const DashboardPage: React.FC = () => {
  const { courts, handleDeleteShop } = useCourts();
  const { groupSession } = useGroupOrder();
  const navigate = useNavigate();

  const handleSelectCourt = (courtId: string) => {
    navigate(`/court/${courtId}`);
  };

  const handleAddNewShop = () => {
    navigate("/add-shop");
  };

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="hero-title">Welcome to FoodCourt</h1>
        <p className="hero-sub">
          Choose a food court to explore their menu or start a Group Order with friends
        </p>
        <div className="home-hero-actions">
          <button
            type="button"
            className="btn btn-secondary btn-hero-add-shop"
            onClick={handleAddNewShop}
          >
            🏪 + Add New Shop
          </button>
          {groupSession ? (
            <button
              type="button"
              className="btn btn-primary btn-hero-group"
              onClick={() => navigate("/group-order")}
            >
              👥 View Active Group ({Object.keys(groupSession.members).length})
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-hero-group"
              onClick={() => navigate("/group-order")}
            >
              👥 Create Friends Group
            </button>
          )}
        </div>
      </div>

      <FoodCourtCard
        courts={courts}
        onSelect={handleSelectCourt}
        onAddNewShop={handleAddNewShop}
        onDeleteShop={handleDeleteShop}
      />
    </div>
  );
};

export default DashboardPage;

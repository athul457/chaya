import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import MenuPage from "../components/MenuPage";
import { useCourts } from "../context/CourtsContext";
import { useGroupOrder } from "../context/GroupOrderContext";

export const ShopMenuPage: React.FC = () => {
  const { courtId } = useParams<{ courtId: string }>();
  const navigate = useNavigate();
  const { getCourtById, handleUpdateCourt } = useCourts();
  const {
    groupSession,
    currentMemberId,
    handleUpdateMemberItems,
  } = useGroupOrder();

  const court = courtId ? getCourtById(courtId) : null;

  if (!court) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1.5rem", maxWidth: "480px", margin: "0 auto" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🏪❓</div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Shop Not Found
        </h2>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
          The food court or shop you are looking for does not exist or has been removed.
        </p>
        <Link
          to="/dashboard"
          className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          <span>← Back to Food Courts</span>
        </Link>
      </div>
    );
  }

  return (
    <MenuPage
      court={court}
      onBack={() => navigate("/dashboard")}
      onUpdateCourt={handleUpdateCourt}
      groupSession={groupSession}
      currentMemberId={currentMemberId}
      onOpenGroupModal={() => navigate("/group-order")}
      onOpenGroupBill={() => navigate("/group-bill")}
      onUpdateMemberItems={handleUpdateMemberItems}
    />
  );
};

export default ShopMenuPage;

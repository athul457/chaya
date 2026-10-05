import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCourts } from "../../context/CourtsContext";
import { useGroupOrder } from "../../context/GroupOrderContext";
import UserNavButton from "../UserNavButton";

export const Navbar: React.FC = () => {
  const { currentUser, setIsAuthModalOpen, signOut } = useAuth();
  const { getCourtById } = useCourts();
  const { groupSession } = useGroupOrder();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract court ID if currently on /court/:courtId or /shop/:courtId
  const match = location.pathname.match(/^\/(court|shop)\/([^/]+)/);
  const currentCourtId = match ? match[2] : null;
  const currentCourt = currentCourtId ? getCourtById(currentCourtId) : null;
  const isAddShopPage = location.pathname === "/add-shop";
  const isGroupPage = location.pathname === "/group-order" || location.pathname === "/group";
  const isGroupBillPage = location.pathname === "/group-bill" || location.pathname === "/bill";

  return (
    <header className="navbar">
      <div className="navbar-left">
        <Link to="/dashboard" className="navbar-brand" aria-label="Go to Splitwale Home">
          <span className="navbar-logo">🍽️</span>
          <span className="navbar-title">Splitwale</span>
        </Link>

        {currentCourt && (
          <nav className="navbar-crumb" aria-label="Breadcrumb">
            <Link to="/dashboard" className="crumb-home">
              Home
            </Link>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">{currentCourt.name}</span>
          </nav>
        )}

        {isAddShopPage && (
          <nav className="navbar-crumb" aria-label="Breadcrumb">
            <Link to="/dashboard" className="crumb-home">
              Home
            </Link>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Add New Shop</span>
          </nav>
        )}

        {isGroupPage && (
          <nav className="navbar-crumb" aria-label="Breadcrumb">
            <Link to="/dashboard" className="crumb-home">
              Home
            </Link>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Friends Group</span>
          </nav>
        )}

        {isGroupBillPage && (
          <nav className="navbar-crumb" aria-label="Breadcrumb">
            <Link to="/dashboard" className="crumb-home">
              Home
            </Link>
            <span className="crumb-sep">›</span>
            <Link to="/group-order" className="crumb-home">
              Friends Group
            </Link>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">Group Bill Breakdown</span>
          </nav>
        )}
      </div>

      <div className="navbar-right">
        <UserNavButton
          user={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onSignOut={signOut}
        />

        {groupSession ? (
          <button
            className="btn-nav-group active"
            onClick={() => navigate("/group-order")}
            title="View Friends Group & Members"
          >
            <span className="pulse-dot"></span>
            <span>{groupSession.name || "Friends Group"}</span>
            <span className="nav-member-badge">
              {Object.keys(groupSession.members).length} 👤
            </span>
          </button>
        ) : (
          <button
            className="btn-nav-group"
            onClick={() => navigate("/group-order")}
            title="Connect with friends using User ID"
          >
            <span>👥 Friends Group</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;

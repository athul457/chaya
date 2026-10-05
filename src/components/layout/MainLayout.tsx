import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "../common/Navbar";
import GroupOrderBanner from "../GroupOrderBanner";
import AuthModal from "../AuthModal";
import { useAuth } from "../../context/AuthContext";
import { useGroupOrder } from "../../context/GroupOrderContext";

export const MainLayout: React.FC = () => {
  const { setCurrentUser, isAuthModalOpen, setIsAuthModalOpen } = useAuth();
  const {
    groupSession,
    currentMemberId,
    handleLeaveSession,
    groupNotification,
    clearNotification,
  } = useGroupOrder();
  const navigate = useNavigate();

  return (
    <div className="app">
      {/* Top Navigation */}
      <Navbar />

      {/* Global Group Notification (e.g. removed by host) */}
      {groupNotification && (
        <div className="group-notification-bar">
          <div className="notif-content">
            <span className="notif-icon">⚠️</span>
            <span className="notif-text">{groupNotification}</span>
          </div>
          <button type="button" onClick={clearNotification} className="notif-close-btn">
            ✕
          </button>
        </div>
      )}

      {/* Real-time Group Order Banner when active */}
      {groupSession && (
        <GroupOrderBanner
          session={groupSession}
          currentMemberId={currentMemberId}
          onOpenModal={() => navigate("/group-order")}
          onOpenBill={() => navigate("/group-bill")}
          onLeave={handleLeaveSession}
        />
      )}

      {/* Dynamic Route Content */}
      <main className="main">
        <Outlet />
      </main>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
};

export default MainLayout;

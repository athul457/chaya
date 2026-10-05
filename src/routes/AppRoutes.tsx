import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import LandingPage from "../pages/LandingPage";
import DashboardPage from "../pages/DashboardPage";
import ShopMenuPage from "../pages/ShopMenuPage";
import AddShopPage from "../pages/AddShopPage";
import GroupOrderPage from "../pages/GroupOrderPage";
import GroupBillPage from "../pages/GroupBillPage";
import NotFoundPage from "../pages/NotFoundPage";

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing & Authentication Routes */}
      <Route path="/" element={<LandingPage defaultView="register" />} />
      <Route path="/register" element={<LandingPage defaultView="register" />} />
      <Route path="/login" element={<LandingPage defaultView="login" />} />

      {/* Protected App Routes wrapped inside MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/add-shop" element={<AddShopPage />} />
        <Route path="/shops/new" element={<Navigate to="/add-shop" replace />} />
        <Route path="/group-order" element={<GroupOrderPage />} />
        <Route path="/group" element={<Navigate to="/group-order" replace />} />
        <Route path="/group-bill" element={<GroupBillPage />} />
        <Route path="/bill" element={<Navigate to="/group-bill" replace />} />
        <Route path="/court/:courtId" element={<ShopMenuPage />} />
        <Route path="/shop/:courtId" element={<ShopMenuPage />} />
        {/* Legacy redirect */}
        <Route path="/shops" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;

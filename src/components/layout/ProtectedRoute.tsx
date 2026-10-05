import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface Props {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Preserve current query parameters (e.g. ?table=1234)
    const search = location.search ? location.search : "";
    return <Navigate to={`/login${search}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

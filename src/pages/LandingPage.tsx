import React from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import LandingAuthPage from "../components/LandingAuthPage";
import { useAuth } from "../context/AuthContext";
import type { AppUser } from "../types";

interface Props {
  defaultView?: "register" | "login";
}

export const LandingPage: React.FC<Props> = ({ defaultView = "register" }) => {
  const { isAuthenticated, setCurrentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // If already authenticated, redirect to /dashboard preserving any search query (e.g. ?table=1234)
  if (isAuthenticated) {
    const search = location.search || "";
    return <Navigate to={`/dashboard${search}`} replace />;
  }

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    const search = location.search || "";
    navigate(`/dashboard${search}`);
  };

  return <LandingAuthPage onLoginSuccess={handleLoginSuccess} initialView={defaultView} />;
};

export default LandingPage;

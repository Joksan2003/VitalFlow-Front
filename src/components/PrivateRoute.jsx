// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 20 }}>Verificando sesión...</div>;
  if (!user) return <Navigate to="/" replace />;

  // 🔐 FORZAR ONBOARDING SOLO A ROLE "user"
  if (
    user.role === "user" &&
    !user.onboardingCompleted &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
// src/App.jsx
import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
import HeaderInicio from "./components/HeaderInicio";
import LoginModal from "./components/LoginModal";
import PrivateRoute from "./components/PrivateRoute";
import { useAuth } from "./contexts/AuthContext";

// Pages usuario
import Home from "./pages/Home";
import PantallaInicio from "./pages/PantallaInicio";
import Recetas from "./pages/Recetas";
import MiPlan from "./pages/MiPlan";
import Retos from "./pages/Retos";
import Progreso from "./pages/Progreso";
import Perfil from "./pages/Perfil";
import SolicitudNutriologo from "./pages/SolicitudNutri";

// Páginas nutriólogo
import NutriPlans from "./pages/NutriPlans";
import NutriRetos from "./pages/NutriRetos";

// Páginas Admin
import AdminUsuarios from "./pages/AdminUsuarios";
import AdminSolicitudes from "./pages/AdminSolicitudes";

//Onboarding (Obtener mas datos del usuario)
import Onboarding from "./pages/Onboarding";

//Recuperacion de contraseña
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 24 }}>Cargando...</div>;
  if (!user) return <Navigate to="/" replace />;

  if (!roles.includes(user.role)) {
    return <Navigate to="/pantalla-inicio" replace />;
  }

  // 🔐 FORZAR ONBOARDING
  if (user.role === "user" && !user.onboardingCompleted && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

export default function App() {
  const { user } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <>
      {user ? (
        <HeaderInicio />
      ) : (
        <Header onOpenLogin={() => setLoginOpen(true)} />
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <Routes>
        {/* pública */}
        <Route path="/" element={<Home />} />

        {/* RUTAS PRIVADAS (cualquier rol logueado) */}
        <Route
          path="/pantalla-inicio"
          element={
            <PrivateRoute>
              <PantallaInicio />
            </PrivateRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/onboarding"
          element={
            <PrivateRoute>
              <Onboarding />
            </PrivateRoute>
          }
        />
        <Route
          path="/recetas"
          element={
            <PrivateRoute>
              <Recetas />
            </PrivateRoute>
          }
        />
        <Route
          path="/mi-plan"
          element={
            <PrivateRoute>
              <MiPlan />
            </PrivateRoute>
          }
        />
        <Route
          path="/retos"
          element={
            <PrivateRoute>
              <Retos />
            </PrivateRoute>
          }
        />
        <Route
          path="/progreso"
          element={
            <PrivateRoute>
              <Progreso />
            </PrivateRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <Perfil />
            </PrivateRoute>
          }
        />
        <Route
          path="/Solicitud-nutriologo"
          element={
            <PrivateRoute>
              <SolicitudNutriologo />
            </PrivateRoute>
          }
        />

        {/* RUTAS SOLO NUTRIÓLOGO / ADMIN */}
        <Route
          path="/nutri/plans"
          element={
            <RoleRoute roles={["nutriologo", "admin"]}>
              <NutriPlans />
            </RoleRoute>
          }
        />
        <Route
          path="/nutri/retos"
          element={
            <RoleRoute roles={["nutriologo", "admin"]}>
              <NutriRetos />
            </RoleRoute>
          }
        />

        {/* RUTAS SOLO ADMIN */}
        <Route
          path="/admin/usuarios"
          element={
            <RoleRoute roles={["admin"]}>
              <AdminUsuarios />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/solicitudes"
          element={
            <RoleRoute roles={["admin"]}>
              <AdminSolicitudes />
            </RoleRoute>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
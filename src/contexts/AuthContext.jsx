import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // null = no auth, obj = auth
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const tokenKey = "vitalflow_token";

  const getToken = () => localStorage.getItem(tokenKey);
  const setToken = (t) => {
    if (t) localStorage.setItem(tokenKey, t);
    else localStorage.removeItem(tokenKey);
  };

  const login = async ({ email, password }) => {
    const res = await api.post("/api/auth/login", { email, password });
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const register = async ({ name, email, password }) => {
    const res = await api.post("/api/auth/register", { name, email, password });
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    navigate("/");
  };

  // On mount: verify stored token by calling /api/auth/me
  useEffect(() => {
    const init = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/api/auth/me", token);
        setUser(res.user);
      } catch (err) {
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // src/contexts/AuthContext.jsx
  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,      // 👈 expón setUser en el contexto
        loading,
        login,
        register,
        logout,
        token: getToken(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
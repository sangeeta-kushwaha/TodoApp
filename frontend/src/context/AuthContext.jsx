/* The provider component and useAuth hook belong together. */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { hasSessionHint } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem("AppAuthtoken");
    localStorage.removeItem("RefreshToken");
  }, []);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (!hasSessionHint()) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api.get("/auth/me");
        if (active) setUser(response.data.user);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(payload) {
        const response = await api.post("/auth/login", payload);
        setUser(response.data.user);
        return response.data;
      },
      async signup(payload) {
        const response = await api.post("/auth/signup", payload);
        return response.data;
      },
      async logout() {
        try {
          await api.post("/auth/logout");
        } catch {
          // Clearing local state still sends the person back to the login page.
        }
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

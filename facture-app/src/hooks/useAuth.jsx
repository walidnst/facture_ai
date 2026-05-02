import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000/api";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    const token  = localStorage.getItem("access_token");
    if (stored && token) {
      setUser(JSON.parse(stored));
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await axios.post(`${API}/auth/login/`, { email, password });
    const { tokens, user } = res.data;
    const { access, refresh } = tokens;

    localStorage.setItem("access_token",  access);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("auth_user",     JSON.stringify(user));

    axios.defaults.headers.common["Authorization"] = `Bearer ${access}`;
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("auth_user");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  }, []);

  // ✅ updateUser — met à jour le contexte ET localStorage
  const updateUser = useCallback((patch) => {
    setUser(prev => {
      const updated = { ...prev, ...patch };
      localStorage.setItem("auth_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ✅ refreshMe — recharge le profil complet depuis l'API
  const refreshMe = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/users/me/`);
      const fresh = res.data;
      setUser(prev => {
        const updated = { ...prev, ...fresh };
        localStorage.setItem("auth_user", JSON.stringify(updated));
        return updated;
      });
    } catch {
      // silencieux
    }
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      r => r,
      async error => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
          original._retry = true;
          try {
            const refresh = localStorage.getItem("refresh_token");
            const res = await axios.post(`${API}/token/refresh/`, { refresh });
            const newToken = res.data.access;
            localStorage.setItem("access_token", newToken);
            axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
            original.headers["Authorization"] = `Bearer ${newToken}`;
            return axios(original);
          } catch {
            logout();
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
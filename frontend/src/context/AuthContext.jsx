import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = sessionStorage.getItem('zae_jwt');
        if (!token) {
          sessionStorage.removeItem('zae_admin');
          setUser(null);
          return;
        }

        const profile = await api.auth.me();
        if (profile) {
          sessionStorage.setItem('zae_admin', JSON.stringify(profile));
          setUser(profile);
        } else {
          sessionStorage.removeItem('zae_admin');
          sessionStorage.removeItem('zae_jwt');
          setUser(null);
        }
      } catch {
        sessionStorage.removeItem('zae_admin');
        sessionStorage.removeItem('zae_jwt');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const session = await api.auth.login(email, password);
    if (!session) {
      throw new Error("Authentication failed");
    }
    sessionStorage.setItem('zae_admin', JSON.stringify(session));
    setUser(session);
    return session;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore */
    }
    sessionStorage.removeItem('zae_admin');
    sessionStorage.removeItem('zae_jwt');
    setUser(null);
  };

  const can = (roles) => user && (Array.isArray(roles) ? roles.includes(user.role) : user.role === roles);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

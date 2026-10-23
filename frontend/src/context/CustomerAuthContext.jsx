import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { customerApi } from '../lib/customerApi';

/**
 * CustomerAuthContext — storefront customer authentication.
 * Completely separate from AuthContext (admin).
 *
 * Uses:
 *   sessionStorage key: zae_customer  (admin uses zae_admin — no collision)
 *   cookie:             zae_customer_token (admin uses zae_token — no collision)
 *   JWT secret:         CUSTOMER_JWT_SECRET (backend — different from admin JWT_SECRET)
 */

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from sessionStorage, then verify with backend
  useEffect(() => {
    const init = async () => {
      // Optimistic: restore from sessionStorage immediately for fast UI
      const stored = sessionStorage.getItem('zae_customer');
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
      }

      // Verify with backend (handles cookie-based session)
      try {
        const profile = await customerApi.auth.me();
        if (profile) {
          sessionStorage.setItem('zae_customer', JSON.stringify(profile));
          setUser(profile);
        } else {
          sessionStorage.removeItem('zae_customer');
          setUser(null);
        }
      } catch {
        // If backend is unreachable, keep the sessionStorage state
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  /** Login with email OTP */
  const loginWithEmailOTP = useCallback(async (email, otp) => {
    const res = await customerApi.auth.verifyEmailOtp(email, otp);
    sessionStorage.setItem('zae_customer', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  }, []);

  /** Login with phone OTP */
  const loginWithPhoneOTP = useCallback(async (phone, otp, countryCode) => {
    const res = await customerApi.auth.verifyPhoneOtp(phone, otp, countryCode);
    sessionStorage.setItem('zae_customer', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  }, []);

  /** Login with Google credential */
  const loginWithGoogle = useCallback(async (credential) => {
    const res = await customerApi.auth.googleLogin(credential);
    sessionStorage.setItem('zae_customer', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  }, []);

  /** Logout */
  const logout = useCallback(async () => {
    await customerApi.auth.logout();
    sessionStorage.removeItem('zae_customer');
    setUser(null);
  }, []);

  /** Refresh user from backend (e.g. after profile update) */
  const refreshUser = useCallback(async () => {
    const profile = await customerApi.auth.me();
    if (profile) {
      sessionStorage.setItem('zae_customer', JSON.stringify(profile));
      setUser(profile);
    }
    return profile;
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        loginWithEmailOTP,
        loginWithPhoneOTP,
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export const useCustomerAuth = () => {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
};

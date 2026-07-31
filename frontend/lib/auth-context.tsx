"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "./api";
import * as api from "./api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  continueAsGuest: (name: string, email: string) => Promise<User>;
  requestOtp: (phone: string) => Promise<{ message: string; resendSecondsLeft: number; devOtp?: string }>;
  verifyOtp: (phone: string, code: string) => Promise<User>;
  updateProfile: (name: string) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedIn = await api.login({ email, password });
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const created = await api.register({ name, email, password });
    setUser(created);
    return created;
  }, []);

  const continueAsGuest = useCallback(async (name: string, email: string) => {
    const created = await api.guestCheckout({ name, email });
    setUser(created);
    return created;
  }, []);

  const requestOtp = useCallback(async (phone: string) => {
    return api.requestOtp(phone);
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const loggedIn = await api.verifyOtp(phone, code);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const updateProfile = useCallback(async (name: string) => {
    const updated = await api.updateProfile(name);
    setUser(updated);
    return updated;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, continueAsGuest, requestOtp, verifyOtp, updateProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

const STORAGE_KEY = "avimor_ligador_token";

type LigadorAuthContextType = {
  token: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  isReady: boolean;
};

const LigadorAuthContext = createContext<LigadorAuthContextType | null>(null);

export function LigadorAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) setToken(stored);
    setIsReady(true);
  }, []);

  const login = useCallback(async (password: string) => {
    const res = await fetch("/api/ligador/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      sessionStorage.setItem(STORAGE_KEY, password);
      setToken(password);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken(null);
  }, []);

  return (
    <LigadorAuthContext.Provider value={{ token, login, logout, isReady }}>
      {children}
    </LigadorAuthContext.Provider>
  );
}

export function useLigadorAuth() {
  const ctx = useContext(LigadorAuthContext);
  if (!ctx) throw new Error("useLigadorAuth must be used within LigadorAuthProvider");
  return ctx;
}

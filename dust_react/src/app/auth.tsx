import { createContext, useContext, useMemo, useState } from "react";
import { AuthUser, UserRole } from "./types";
import { loginAsAdmin, loginWithGbox } from "./api/lostItems";

const AUTH_STORAGE_KEY = "dust-auth-user";

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole;
  isGuest: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  loginGbox: (input: { credential: string }) => Promise<void>;
  loginAdmin: (input: { username: string; password: string }) => Promise<void>;
  continueAsGuest: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const value = useMemo<AuthContextValue>(() => {
    const role: UserRole = user?.role || "guest";

    return {
      user,
      role,
      isGuest: role === "guest",
      isStudent: role === "student",
      isAdmin: role === "admin",
      async loginGbox(input) {
        const nextUser = await loginWithGbox(input);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
      },
      async loginAdmin(input) {
        const nextUser = await loginAsAdmin(input);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
      },
      continueAsGuest() {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
      },
      logout() {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
      },
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

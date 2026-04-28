"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Storage } from "@/lib/storage";
import type { User, Session } from "@/types/auth";



export function signUp(
  email: string,
  password: string,
): { success: true; session: Session } | { success: false; error: string } {
  const existingUsers = Storage.getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const duplicate = existingUsers.some(
    (u) => u.email.toLowerCase() === normalizedEmail,
  );
  if (duplicate) {
    return { success: false, error: "User already exists" };
  }

  const newUser: User = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    password,
    createdAt: new Date().toISOString(),
  };

  Storage.saveUsers([...existingUsers, newUser]);

  const session: Session = {
    userId: newUser.id,
    email: newUser.email,
  };

  Storage.saveSession(session);

  return { success: true, session };
}

export function logIn(
  email: string,
  password: string,
): { success: true; session: Session } | { success: false; error: string } {
  const users = Storage.getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password,
  );

  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }

  const session: Session = {
    userId: user.id,
    email: user.email,
  };

  Storage.saveSession(session);

  return { success: true, session };
}



interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);


export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSessionState] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate session from localStorage on mount
  useEffect(() => {
    const stored = Storage.getSession();
    // eslint-disable-next-line
    setSessionState(stored);
    setIsLoading(false);
  }, []);

  const setSession = useCallback((newSession: Session | null) => {
    setSessionState(newSession);
    Storage.saveSession(newSession);
  }, []);

  const logout = useCallback(() => {
    Storage.clearSession();
    setSessionState(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ session, isLoading, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}



export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db, supabase } from "../lib/supabase";

export interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role_id: string;
  status: string;
  roles?: {
    name: string;
    nav_items: any[];
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await auth.getCurrentUser();
        setUser(currentUser);
      } catch (err: any) {
        // If the error is "Auth session missing!", this is normal for unauthenticated users
        if (err.message === "Auth session missing!") {
          console.log("No active session found, user is not logged in");
        } else {
          console.error("Session check error:", err);
          setError(err.message || "Failed to check authentication session");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch {
      return "Unknown";
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const authData = await auth.signIn(email, password);

      if (authData.user) {
        const userData = await auth.getCurrentUser();
        if (userData) {
          // Buat session baru
          const sessionData = {
            ip_address: await getClientIP(),
            user_agent: navigator.userAgent,
          };
          await db.sessions.createSession(userData.id, sessionData);
          await db.logs.logActivity({
            user_id: userData.id,
            action: "login",
            module: "auth",
            description: "User logged in successfully",
            ip_address: await getClientIP(),
          });

          await db.logs.logActivity({
            user_id: userData.id,
            action: "login",
            module: "auth",
            description: "User logged in successfully",
            ip_address: await getClientIP(),
          });

          setUser(userData);
          return true;
        }
      }

      throw new Error("Failed to get user data after login");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during login");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user) {
        const { data: session } = await supabase
          .from("user_sessions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        if (session) {
          await Promise.all([
            db.sessions.logoutSession(session.id),
            db.logs.logActivity({
              user_id: user.id,
              action: "logout",
              module: "auth",
              description: "User logged out successfully",
              ip_address: await getClientIP(),
            }),
          ]);
        }
      }

      await auth.signOut();
      setUser(null);
      setError(null);
    } catch (err: any) {
      console.error("Logout error:", err);
      setError(err.message || "An error occurred during logout");
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

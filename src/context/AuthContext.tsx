import React, { createContext, useContext, useState, useEffect } from "react";
import type { AppUser } from "../types";
import {
  getStoredUser,
  signOutUser,
  subscribeToAuthChanges,
} from "../services/authService";

interface AuthContextType {
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser | null) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const defaultAuthContext: AuthContextType = {
  currentUser: getStoredUser(),
  setCurrentUser: () => {},
  isAuthModalOpen: false,
  setIsAuthModalOpen: () => {},
  signOut: async () => {},
  isAuthenticated: Boolean(getStoredUser()),
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(getStoredUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await signOutUser();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        signOut,
        isAuthenticated: Boolean(currentUser),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
}

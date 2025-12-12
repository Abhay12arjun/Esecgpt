import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../services/firebase";
import { onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { authService } from "../services/authService";

/**
 * AuthContext provides:
 * - user: firebase user object | null
 * - loading: boolean while auth initializing
 * - signup, login, loginWithGoogle, resetPassword, logout
 * - setPersistenceType: "local" or "session"
 */

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // default persistence type
  const [persistenceType, setPersistenceType] = useState("local");

  // set firebase persistence when persistenceType changes
  useEffect(() => {
    (async () => {
      try {
        if (persistenceType === "local") {
          await setPersistence(auth, browserLocalPersistence);
        } else {
          await setPersistence(auth, browserSessionPersistence);
        }
      } catch (err) {
        console.error("Error setting persistence:", err);
      }
    })();
  }, [persistenceType]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email, password, name) => {
    return authService.signup(email, password, name);
  };

  const login = async (email, password) => {
    return authService.login(email, password);
  };

  const loginWithGoogle = async () => {
    return authService.loginWithGoogle();
  };

  const resetPassword = async (email) => {
    return authService.resetPassword(email);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    loginWithGoogle,
    resetPassword,
    logout,
    persistenceType,
    setPersistenceType, // allow UI to toggle local/session
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

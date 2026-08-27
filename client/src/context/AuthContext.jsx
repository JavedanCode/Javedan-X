import { useEffect, useState } from "react";
import { updateProfile, updateUsername } from "../api/user.js";

import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "../api/auth.js";

import { AuthContext } from "./auth-context.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      try {
        const response = await getCurrentUser();

        if (!isMounted) {
          return;
        }

        setUser(response.user);
        setStatus("authenticated");
      } catch {
        if (!isMounted) {
          return;
        }

        setUser(null);
        setStatus("unauthenticated");
      }
    }

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function login(credentials) {
    const response = await loginRequest(credentials);

    setUser(response.user);
    setStatus("authenticated");

    return response;
  }

  async function register(credentials) {
    return registerRequest(credentials);
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }

  async function updateUserProfile(data) {
    const response = await updateProfile(data);

    setUser(response.user);

    return response;
  }

  async function changeUsername(username) {
    const response = await updateUsername(username);

    setUser((currentUser) => ({
      ...currentUser,
      username: response.user.username,
    }));

    return response;
  }

  const value = {
    user,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    login,
    register,
    logout,
    updateUserProfile,
    changeUsername,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

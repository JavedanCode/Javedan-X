import { apiRequest } from "./client.js";

export function login(credentials) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function register(credentials) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function getCurrentUser() {
  return apiRequest("/auth/me");
}

export function refreshSession() {
  return apiRequest("/auth/refresh", {
    method: "POST",
  });
}

export function logout() {
  return apiRequest("/auth/logout", {
    method: "POST",
  });
}

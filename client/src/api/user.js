import { apiRequest } from "./client.js";

export function updateProfile(data) {
  return apiRequest("/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function updateUsername(username) {
  return apiRequest("/users/me/username", {
    method: "PATCH",
    body: JSON.stringify({ username }),
  });
}

export function changePassword(data) {
  return apiRequest("/users/me/password", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function requestEmailChange(email) {
  return apiRequest("/users/me/email", {
    method: "PATCH",
    body: JSON.stringify({ email }),
  });
}

export function confirmEmailChange(token) {
  return apiRequest("/users/me/email/confirm", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function deleteAccount(currentPassword) {
  return apiRequest("/users/me", {
    method: "DELETE",
    body: JSON.stringify(currentPassword ? { currentPassword } : {}),
  });
}

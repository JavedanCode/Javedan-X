import { apiRequest } from "./client.js";

export function getUsers() {
  return apiRequest("/users");
}

export function getUser(userId) {
  return apiRequest(`/users/${userId}`);
}

export function getUserPosts(userId) {
  return apiRequest(`/users/${userId}/posts`);
}

export function updateProfile(data) {
  return apiRequest("/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

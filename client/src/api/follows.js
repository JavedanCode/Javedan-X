import { apiRequest } from "./client.js";

export function sendFollowRequest(userId) {
  return apiRequest(`/follows/users/${userId}/follow`, {
    method: "POST",
  });
}

export function getFollowing() {
  return apiRequest("/follows/users/me/following");
}

export function getFollowers() {
  return apiRequest("/follows/users/me/followers");
}

export function getPendingFollowRequests() {
  return apiRequest("/follows/users/me/follow-requests");
}

export function getPendingSentFollowRequests() {
  return apiRequest("/follows/users/me/follow-requests/sent");
}

export function cancelFollowRequest(followId) {
  return apiRequest(`/follows/${followId}/request`, {
    method: "DELETE",
  });
}

export function removeFollow(followId) {
  return apiRequest(`/follows/${followId}`, {
    method: "DELETE",
  });
}

export function acceptFollowRequest(followId) {
  return apiRequest(`/follows/${followId}/accept`, {
    method: "PATCH",
  });
}

export function declineFollowRequest(followId) {
  return apiRequest(`/follows/${followId}/decline`, {
    method: "PATCH",
  });
}

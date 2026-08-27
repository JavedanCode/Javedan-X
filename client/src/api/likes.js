import { apiRequest } from "./client.js";

export function likePost(postId) {
  return apiRequest(`/posts/${postId}/likes`, {
    method: "POST",
  });
}

export function unlikePost(postId) {
  return apiRequest(`/posts/${postId}/likes`, {
    method: "DELETE",
  });
}

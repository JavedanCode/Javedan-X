import { apiRequest } from "./client.js";

export function getFeed() {
  return apiRequest("/posts/feed");
}

export function createPost(content) {
  return apiRequest("/posts", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function updatePost(postId, content) {
  return apiRequest(`/posts/${postId}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
}

export function deletePost(postId) {
  return apiRequest(`/posts/${postId}`, {
    method: "DELETE",
  });
}

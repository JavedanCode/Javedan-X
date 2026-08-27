import { apiRequest } from "./client.js";

export function getComments(postId) {
  return apiRequest(`/posts/${postId}/comments`);
}

export function createComment(postId, content) {
  return apiRequest(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function updateComment(commentId, content) {
  return apiRequest(`/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
}

export function deleteComment(commentId) {
  return apiRequest(`/comments/${commentId}`, {
    method: "DELETE",
  });
}

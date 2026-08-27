import { useState } from "react";
import {
  Edit3,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";

import { deletePost, updatePost } from "../../api/posts.js";
import { likePost, unlikePost } from "../../api/likes.js";
import CommentSection from "../comments/CommentSection.jsx";
import { useAuth } from "../../context/useAuth.js";
import UserAvatar from "../users/UserAvatar.jsx";
import { Link } from "react-router-dom";

function formatDate(date) {
  const value = new Date(date);

  return value.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PostCard({ post, onDeleted, onUpdated }) {
  const { user } = useAuth();

  const [liked, setLiked] = useState(post.likedByCurrentUser);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(
    post.comments?.length ?? post.commentCount ?? 0,
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const isOwner = user?.id === post.authorId;

  async function handleLike() {
    const previousLiked = liked;
    const previousCount = likeCount;

    setLiked(!previousLiked);
    setLikeCount(previousLiked ? previousCount - 1 : previousCount + 1);

    try {
      if (previousLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch (err) {
      setLiked(previousLiked);
      setLikeCount(previousCount);
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (isDeleting) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this post?",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await deletePost(post.id);
      onDeleted(post.id);
    } catch (err) {
      setError(err.message);
      setIsDeleting(false);
    }
  }

  async function handleUpdate(event) {
    event.preventDefault();

    const content = editedContent.trim();

    if (!content || isSaving) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await updatePost(post.id, content);

      setIsEditing(false);
      setEditedContent(response.post.content);
      onUpdated(response.post);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCommentCountChange(change) {
    setCommentCount((current) => Math.max(0, current + change));
  }

  return (
    <article className="border-b border-white/10 px-5 py-5 transition hover:bg-white/[0.015]">
      <div className="flex gap-3">
        <UserAvatar user={post.author} />

        <div className="min-w-0 flex-1">
          {/* Post header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <Link
                  to={`/profile/${post.author.id}`}
                  className="font-semibold text-white transition hover:text-indigo-300"
                >
                  {post.author.displayName || post.author.username}
                </Link>

                <Link
                  to={`/profile/${post.author.id}`}
                  className="text-sm text-slate-500 transition hover:text-indigo-300"
                >
                  @{post.author.username}
                </Link>

                <span className="text-sm text-slate-600">
                  · {formatDate(post.createdAt)}
                </span>
              </div>
            </div>

            {/* Owner menu */}
            {isOwner && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((current) => !current)}
                  className="rounded-full p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                  aria-label="Post options"
                >
                  <MoreHorizontal size={19} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-10 z-10 w-36 overflow-hidden rounded-xl border border-white/10 bg-[#111126] p-1 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                        setIsMenuOpen(false);
                        setError("");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Edit3 size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleDelete();
                      }}
                      disabled={isDeleting}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Post content / edit form */}
          {isEditing ? (
            <form onSubmit={handleUpdate} className="mt-4">
              <textarea
                value={editedContent}
                onChange={(event) => setEditedContent(event.target.value)}
                rows={4}
                autoFocus
                disabled={isSaving}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white outline-none transition focus:border-indigo-400/50"
              />

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(post.content);
                    setError("");
                  }}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:text-white disabled:opacity-50"
                >
                  <X size={16} />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!editedContent.trim() || isSaving}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#08081c] transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-6 text-slate-200">
              {post.content}
            </p>
          )}

          {/* Post error */}
          {error && <p className="mt-2 text-sm text-red-300">{error}</p>}

          {/* Actions */}
          <div className="mt-4 flex items-center gap-5">
            <button
              type="button"
              onClick={handleLike}
              className={`group flex items-center gap-2 text-sm transition ${
                liked ? "text-pink-400" : "text-slate-500 hover:text-pink-400"
              }`}
              aria-label={liked ? "Unlike post" : "Like post"}
            >
              <Heart
                size={19}
                fill={liked ? "currentColor" : "none"}
                className="transition group-hover:scale-105"
              />

              <span>{likeCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowComments((current) => !current)}
              className={`flex items-center gap-2 text-sm transition ${
                showComments
                  ? "text-indigo-300"
                  : "text-slate-500 hover:text-indigo-300"
              }`}
              aria-label={showComments ? "Hide comments" : "Show comments"}
            >
              <MessageCircle size={19} />

              <span>{commentCount}</span>
            </button>
          </div>

          {/* Comments */}
          {showComments && (
            <CommentSection
              postId={post.id}
              onCommentCountChange={handleCommentCountChange}
            />
          )}
        </div>
      </div>
    </article>
  );
}

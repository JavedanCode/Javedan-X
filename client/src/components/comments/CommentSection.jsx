import { useEffect, useState } from "react";
import {
  Edit3,
  LoaderCircle,
  MessageCircle,
  MoreHorizontal,
  Send,
  Trash2,
  X,
} from "lucide-react";

import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from "../../api/comments.js";

import { Link } from "react-router-dom";
import UserAvatar from "../users/UserAvatar.jsx";

import { useAuth } from "../../context/useAuth.js";

function formatDate(date) {
  const value = new Date(date);

  return value.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Comment({ comment, onDeleted, onUpdated }) {
  const { user } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const isOwner = user?.id === comment.authorId;

  async function handleUpdate(event) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent || isSaving) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await updateComment(comment.id, trimmedContent);

      setEditing(false);
      onUpdated(response.comment);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?",
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await deleteComment(comment.id);
      onDeleted(comment.id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex gap-3">
      <Link to={`/profile/${comment.author.id}`}>
        <UserAvatar user={comment.author} size="h-8 w-8" />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-white/[0.035] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <Link
                  to={`/profile/${comment.author.id}`}
                  className="text-sm font-semibold text-white transition hover:text-indigo-300"
                >
                  {comment.author.displayName || comment.author.username}
                </Link>

                <Link
                  to={`/profile/${comment.author.id}`}
                  className="text-xs text-slate-600 transition hover:text-slate-400"
                >
                  @{comment.author.username}
                </Link>
              </div>

              {editing ? (
                <form onSubmit={handleUpdate} className="mt-3">
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={2}
                    autoFocus
                    disabled={isSaving}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-5 text-white outline-none focus:border-indigo-400/50"
                  />

                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setContent(comment.content);
                      }}
                      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:text-white"
                    >
                      <X size={14} />
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={!content.trim() || isSaving}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#08081c] disabled:opacity-40"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-slate-300">
                  {comment.content}
                </p>
              )}
            </div>

            {isOwner && !editing && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setMenuOpen((current) => !current)}
                  className="rounded-full p-1.5 text-slate-600 transition hover:bg-white/[0.06] hover:text-white"
                  aria-label="Comment options"
                >
                  <MoreHorizontal size={16} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-8 z-10 w-28 overflow-hidden rounded-xl border border-white/10 bg-[#111126] p-1 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(true);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        handleDelete();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-1 px-2 text-xs text-slate-600">
          {formatDate(comment.createdAt)}
        </div>

        {error && <p className="mt-1 px-2 text-xs text-red-300">{error}</p>}
      </div>
    </div>
  );
}

export default function CommentSection({ postId, onCommentCountChange }) {
  const { user } = useAuth();

  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadComments() {
      setStatus("loading");

      try {
        const response = await getComments(postId);

        if (!mounted) {
          return;
        }

        setComments(response.comments);
        setStatus("success");
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(err.message);
        setStatus("error");
      }
    }

    loadComments();

    return () => {
      mounted = false;
    };
  }, [postId]);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent || isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await createComment(postId, trimmedContent);

      setComments((current) => [...current, response.comment]);
      setContent("");

      onCommentCountChange?.(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeleted(commentId) {
    setComments((current) =>
      current.filter((comment) => comment.id !== commentId),
    );

    onCommentCountChange?.(-1);
  }

  function handleUpdated(updatedComment) {
    setComments((current) =>
      current.map((comment) =>
        comment.id === updatedComment.id ? updatedComment : comment,
      ),
    );
  }

  return (
    <div className="mt-5 border-t border-white/[0.06] pt-5">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <MessageCircle size={17} />
        Comments
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
        <Link to={`/profile/${user.id}`}>
          <UserAvatar user={user} size="h-8 w-8" />
        </Link>

        <div className="flex min-w-0 flex-1 gap-2">
          <input
            value={content}
            onChange={(event) => {
              setContent(event.target.value);

              if (error) {
                setError("");
              }
            }}
            placeholder="Write a comment..."
            disabled={isSubmitting}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-indigo-400/40 focus:bg-white/[0.05]"
          />

          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#08081c] transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Post comment"
          >
            {isSubmitting ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </form>

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

      {status === "loading" && (
        <div className="flex justify-center py-6">
          <LoaderCircle size={18} className="animate-spin text-slate-600" />
        </div>
      )}

      {status === "success" && comments.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-600">
          No comments yet. Be the first to say something.
        </p>
      )}

      {comments.length > 0 && (
        <div className="mt-5 space-y-4">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

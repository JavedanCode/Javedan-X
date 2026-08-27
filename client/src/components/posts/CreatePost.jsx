import { useState } from "react";
import { Image, LoaderCircle, Send } from "lucide-react";

import { createPost } from "../../api/posts.js";
import { useAuth } from "../../context/useAuth.js";

export default function CreatePost({ onCreated }) {
  const { user } = useAuth();

  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent || isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await createPost(trimmedContent);

      setContent("");
      onCreated(response.post);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="border-b border-white/10 px-5 py-5">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          )}

          <textarea
            value={content}
            onChange={(event) => {
              setContent(event.target.value);

              if (error) {
                setError("");
              }
            }}
            placeholder="What's happening?"
            disabled={isSubmitting}
            rows={3}
            className="min-h-[90px] flex-1 resize-none bg-transparent pt-1 text-base text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
          />
        </div>

        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}

        <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
          <button
            type="button"
            disabled
            title="Image posts coming soon"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-slate-600"
          >
            <Image size={19} />
            <span className="text-xs">Media</span>
          </button>

          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#08081c] transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                Posting...
              </>
            ) : (
              <>
                Post
                <Send size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";

import { getFeed } from "../../api/posts.js";
import CreatePost from "../../components/posts/CreatePost.jsx";
import PostCard from "../../components/posts/PostCard.jsx";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const loadFeed = useCallback(async () => {
    setError("");

    try {
      setStatus("loading");

      const response = await getFeed();

      setPosts(response.posts);
      setStatus("success");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    getFeed()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setPosts(response.posts);
        setStatus("success");
      })
      .catch((err) => {
        if (!isMounted) {
          return;
        }

        setError(err.message);
        setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleCreated(post) {
    setPosts((current) => [post, ...current]);
  }

  function handleDeleted(postId) {
    setPosts((current) => current.filter((post) => post.id !== postId));
  }

  function handleUpdated(updatedPost) {
    setPosts((current) =>
      current.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#08081c]/90 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Home</h1>

            <p className="mt-0.5 text-xs text-slate-500">Your latest posts</p>
          </div>

          <button
            type="button"
            onClick={loadFeed}
            disabled={status === "loading"}
            className="rounded-full p-2.5 text-slate-500 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
            aria-label="Refresh feed"
          >
            <RefreshCw
              size={18}
              className={status === "loading" ? "animate-spin" : ""}
            />
          </button>
        </div>
      </header>

      <CreatePost onCreated={handleCreated} />

      {status === "error" && (
        <div className="border-b border-white/10 px-5 py-8 text-center">
          <p className="text-sm text-red-300">{error}</p>

          <button
            type="button"
            onClick={loadFeed}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#08081c]"
          >
            Try again
          </button>
        </div>
      )}

      {status === "loading" && posts.length === 0 && (
        <div className="flex justify-center py-16">
          <LoaderCircle size={24} className="animate-spin text-indigo-300" />
        </div>
      )}

      {status === "success" && posts.length === 0 && (
        <div className="px-5 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300">
            <RefreshCw size={22} />
          </div>

          <h2 className="mt-5 font-semibold text-white">Your feed is quiet.</h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Follow some people or create your first post to get things moving.
          </p>
        </div>
      )}

      <div>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDeleted={handleDeleted}
            onUpdated={handleUpdated}
          />
        ))}
      </div>
    </div>
  );
}

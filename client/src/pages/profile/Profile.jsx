import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Edit3,
  LoaderCircle,
  UserRound,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { getUser, getUserPosts, updateProfile } from "../../api/users.js";

import {
  getFollowing,
  getPendingSentFollowRequests,
  sendFollowRequest,
  cancelFollowRequest,
  removeFollow,
} from "../../api/follows.js";

import FollowButton from "../../components/users/FollowButton.jsx";
import PostCard from "../../components/posts/PostCard.jsx";
import UserAvatar from "../../components/users/UserAvatar.jsx";

import { useAuth } from "../../context/useAuth.js";

function formatJoinDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default function Profile() {
  const { user: currentUser } = useAuth();
  const { userId } = useParams();

  const profileId = userId || currentUser?.id;
  const isOwnProfile = profileId === currentUser?.id;

  const [profile, setProfile] = useState(isOwnProfile ? currentUser : null);

  const [posts, setPosts] = useState([]);

  const [followStatus, setFollowStatus] = useState("idle");
  const [followId, setFollowId] = useState(null);

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [bioError, setBioError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!profileId) {
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const userResponse = await getUser(profileId);

      const user = userResponse?.user ?? null;

      if (!user) {
        throw new Error("User not found.");
      }

      setProfile(user);
      setBio(user.bio ?? "");

      if (isOwnProfile) {
        setFollowStatus("idle");
        setFollowId(null);

        const postsResponse = await getUserPosts(profileId);

        setPosts(postsResponse?.posts ?? []);
        setStatus("success");

        return;
      }

      const [followingResponse, sentRequestsResponse] = await Promise.all([
        getFollowing(),
        getPendingSentFollowRequests(),
      ]);

      const following = followingResponse?.following ?? [];
      const sentRequests = sentRequestsResponse?.sentRequests ?? [];

      const existingFollow = following.find(
        (follow) => follow.recipient?.id === profileId,
      );

      const pendingRequest = sentRequests.find(
        (follow) => follow.recipient?.id === profileId,
      );

      if (existingFollow) {
        setFollowStatus("following");
        setFollowId(existingFollow.id);

        const postsResponse = await getUserPosts(profileId);

        setPosts(postsResponse?.posts ?? []);
      } else if (pendingRequest) {
        setFollowStatus("pending");
        setFollowId(pendingRequest.id);
        setPosts([]);
      } else {
        setFollowStatus("idle");
        setFollowId(null);
        setPosts([]);
      }

      setStatus("success");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }, [profileId, isOwnProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleFollow() {
    if (!profileId || isOwnProfile) {
      return;
    }

    setFollowStatus("loading");
    setError("");

    try {
      const response = await sendFollowRequest(profileId);

      setFollowId(response?.follow?.id ?? null);
      setFollowStatus("pending");
      setPosts([]);
    } catch (err) {
      setError(err.message);

      if (followId) {
        setFollowStatus("following");
      } else {
        setFollowStatus("idle");
      }
    }
  }

  async function handleCancelRequest() {
    if (!followId) {
      return;
    }

    setFollowStatus("loading");
    setError("");

    try {
      await cancelFollowRequest(followId);

      setFollowId(null);
      setFollowStatus("idle");
      setPosts([]);
    } catch (err) {
      setError(err.message);
      setFollowStatus("pending");
    }
  }

  async function handleUnfollow() {
    if (!followId) {
      return;
    }

    setFollowStatus("loading");
    setError("");

    try {
      await removeFollow(followId);

      setFollowId(null);
      setFollowStatus("idle");
      setPosts([]);
    } catch (err) {
      setError(err.message);
      setFollowStatus("following");
    }
  }

  async function handleFollowButton() {
    if (followStatus === "following") {
      await handleUnfollow();
      return;
    }

    if (followStatus === "pending") {
      await handleCancelRequest();
      return;
    }

    await handleFollow();
  }

  function handleStartBioEdit() {
    setBio(profile.bio ?? "");
    setBioError("");
    setIsEditingBio(true);
  }

  function handleCancelBioEdit() {
    setBio(profile.bio ?? "");
    setBioError("");
    setIsEditingBio(false);
  }

  async function handleSaveBio(event) {
    event.preventDefault();

    if (isSavingBio) {
      return;
    }

    setIsSavingBio(true);
    setBioError("");

    try {
      const response = await updateProfile({
        bio: bio.trim(),
      });

      const updatedUser = response?.user;

      if (updatedUser) {
        setProfile((current) => ({
          ...current,
          ...updatedUser,
        }));

        setBio(updatedUser.bio ?? "");
      } else {
        setProfile((current) => ({
          ...current,
          bio: bio.trim(),
        }));
      }

      setIsEditingBio(false);
    } catch (err) {
      setBioError(err.message);
    } finally {
      setIsSavingBio(false);
    }
  }

  function handleDeleted(postId) {
    setPosts((current) => current.filter((post) => post.id !== postId));
  }

  function handleUpdated(updatedPost) {
    setPosts((current) =>
      current.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
    );
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle size={24} className="animate-spin text-indigo-300" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-sm text-red-300">{error}</p>

        <Link
          to="/"
          className="mt-5 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back home
        </Link>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const canViewPosts = isOwnProfile || followStatus === "following";

  return (
    <main>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#08081c]/90 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="rounded-full p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Go back"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <h1 className="text-lg font-bold text-white">
              {profile.displayName || profile.username}
            </h1>

            <p className="text-xs text-slate-600">
              {canViewPosts
                ? `${posts.length} ${posts.length === 1 ? "post" : "posts"}`
                : "Posts are private"}
            </p>
          </div>
        </div>
      </header>

      <section className="border-b border-white/10">
        <div className="h-36 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent" />

        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end justify-between gap-4">
            <UserAvatar user={profile} size="h-24 w-24" />

            {!isOwnProfile && (
              <FollowButton
                status={followStatus}
                onClick={handleFollowButton}
                disabled={followStatus === "loading"}
              />
            )}
          </div>

          <div className="mt-4">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {profile.displayName || profile.username}
            </h2>

            <p className="mt-1 text-sm text-slate-500">@{profile.username}</p>

            {isOwnProfile && isEditingBio ? (
              <form onSubmit={handleSaveBio} className="mt-4 max-w-xl">
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={4}
                  maxLength={500}
                  autoFocus
                  disabled={isSavingBio}
                  placeholder="Tell people a little about yourself..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/50"
                />

                {bioError && (
                  <p className="mt-2 text-sm text-red-300">{bioError}</p>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-600">
                    {bio.length}/500
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelBioEdit}
                      disabled={isSavingBio}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:text-white disabled:opacity-50"
                    >
                      <X size={15} />
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSavingBio}
                      className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#08081c] transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSavingBio ? (
                        <LoaderCircle size={15} className="animate-spin" />
                      ) : (
                        <Check size={15} />
                      )}
                      Save
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <>
                {profile.bio ? (
                  <p className="mt-4 max-w-xl whitespace-pre-wrap text-sm leading-6 text-slate-300">
                    {profile.bio}
                  </p>
                ) : isOwnProfile ? (
                  <button
                    type="button"
                    onClick={handleStartBioEdit}
                    className="mt-4 flex items-center gap-2 text-sm text-slate-500 transition hover:text-indigo-300"
                  >
                    <Edit3 size={15} />
                    Add a bio
                  </button>
                ) : null}

                {isOwnProfile && profile.bio && (
                  <button
                    type="button"
                    onClick={handleStartBioEdit}
                    className="mt-3 flex items-center gap-2 text-sm text-slate-500 transition hover:text-indigo-300"
                  >
                    <Edit3 size={15} />
                    Edit bio
                  </button>
                )}
              </>
            )}

            {profile.createdAt && (
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                <CalendarDays size={14} />

                <span>Joined {formatJoinDate(profile.createdAt)}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="border-b border-red-400/10 bg-red-400/5 px-6 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <section>
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-300">Posts</h2>
        </div>

        {!canViewPosts ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300">
              <UserRound size={20} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-white">
              Follow this user to see their posts.
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Their posts will become visible once they accept your follow
              request.
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300">
              <UserRound size={20} />
            </div>

            <p className="mt-4 text-sm text-slate-500">No posts yet.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
            />
          ))
        )}
      </section>
    </main>
  );
}

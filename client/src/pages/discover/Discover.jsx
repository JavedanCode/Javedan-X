import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LoaderCircle, Search, Sparkles, Users } from "lucide-react";

import { getUsers } from "../../api/users.js";

import {
  getFollowing,
  getPendingFollowRequests,
  getPendingSentFollowRequests,
  sendFollowRequest,
  cancelFollowRequest,
  removeFollow,
} from "../../api/follows.js";

import UserAvatar from "../../components/users/UserAvatar.jsx";
import FollowButton from "../../components/users/FollowButton.jsx";
import { useAuth } from "../../context/useAuth.js";

function getFollowId(value) {
  return value?.id || value?.followId || null;
}

export default function Discover() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState([]);
  const search = searchParams.get("search") ?? "";

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const [followStates, setFollowStates] = useState({});

  useEffect(() => {
    let mounted = true;

    async function loadUsers() {
      setStatus("loading");
      setError("");

      try {
        const [
          usersResponse,
          followingResponse,
          requestsResponse,
          sentRequestsResponse,
        ] = await Promise.all([
          getUsers(),
          getFollowing(),
          getPendingFollowRequests(),
          getPendingSentFollowRequests(),
        ]);

        if (!mounted) {
          return;
        }

        const allUsers = usersResponse?.users ?? [];

        // The backend returns { following }, { requests }, and { sentRequests }.
        const allFollowing = followingResponse?.following ?? [];
        const receivedRequests = requestsResponse?.requests ?? [];
        const sentRequests = sentRequestsResponse?.sentRequests ?? [];

        setUsers(allUsers);

        const initialStates = {};

        for (const relation of allFollowing) {
          const targetId = relation?.recipient?.id;

          if (targetId) {
            initialStates[targetId] = {
              status: "following",
              followId: getFollowId(relation),
            };
          }
        }

        for (const request of sentRequests) {
          const targetId = request?.recipient?.id;

          if (targetId) {
            initialStates[targetId] = {
              status: "pending",
              followId: getFollowId(request),
            };
          }
        }

        // Received requests are intentionally not used here.
        // They are handled by the Follow Requests page.
        void receivedRequests;

        setFollowStates(initialStates);
        setStatus("success");
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(err.message);
        setStatus("error");
      }
    }

    loadUsers();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((candidate) => {
      if (candidate.id === user?.id) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const username = candidate.username?.toLowerCase() ?? "";
      const displayName = candidate.displayName?.toLowerCase() ?? "";

      return (
        username.includes(normalizedSearch) ||
        displayName.includes(normalizedSearch)
      );
    });
  }, [users, search, user?.id]);

  function handleSearchChange(event) {
    const value = event.target.value;

    const params = new URLSearchParams(searchParams);

    if (value.trim()) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    setSearchParams(params, { replace: true });
  }

  async function handleFollow(userId) {
    const current = followStates[userId];

    if (current?.status === "loading") {
      return;
    }

    if (current?.status === "following") {
      if (!current.followId) {
        setError("Unable to remove this follow relationship.");
        return;
      }

      setFollowStates((states) => ({
        ...states,
        [userId]: {
          ...current,
          status: "loading",
        },
      }));

      try {
        await removeFollow(current.followId);

        setFollowStates((states) => ({
          ...states,
          [userId]: {
            status: "idle",
            followId: null,
          },
        }));
      } catch (err) {
        setFollowStates((states) => ({
          ...states,
          [userId]: {
            ...current,
            status: "following",
          },
        }));

        setError(err.message);
      }

      return;
    }

    if (current?.status === "pending") {
      if (!current.followId) {
        setError("Unable to cancel this follow request.");
        return;
      }

      setFollowStates((states) => ({
        ...states,
        [userId]: {
          ...current,
          status: "loading",
        },
      }));

      try {
        await cancelFollowRequest(current.followId);

        setFollowStates((states) => ({
          ...states,
          [userId]: {
            status: "idle",
            followId: null,
          },
        }));
      } catch (err) {
        setFollowStates((states) => ({
          ...states,
          [userId]: {
            ...current,
            status: "pending",
          },
        }));

        setError(err.message);
      }

      return;
    }

    setFollowStates((states) => ({
      ...states,
      [userId]: {
        status: "loading",
        followId: null,
      },
    }));

    try {
      const response = await sendFollowRequest(userId);

      setFollowStates((states) => ({
        ...states,
        [userId]: {
          status: "pending",
          followId: response?.follow?.id ?? null,
        },
      }));
    } catch (err) {
      setFollowStates((states) => ({
        ...states,
        [userId]: {
          status: "idle",
          followId: null,
        },
      }));

      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-white/10 px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              <Sparkles size={20} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">Discover</h1>

              <p className="mt-1 text-sm text-slate-500">
                Find people and connect with them.
              </p>
            </div>
          </div>

          <div className="relative mt-6">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
            />

            <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search people..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.035] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/40 focus:bg-white/[0.05]"
            />
          </div>
        </header>

        {error && (
          <div className="border-b border-red-400/10 bg-red-400/5 px-6 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <section>
          <div className="flex items-center gap-2 px-6 py-5">
            <Users size={17} className="text-slate-500" />

            <h2 className="text-sm font-semibold text-slate-300">People</h2>

            <span className="text-xs text-slate-600">
              {filteredUsers.length}
            </span>
          </div>

          {status === "loading" && (
            <div className="flex justify-center py-20">
              <LoaderCircle size={22} className="animate-spin text-slate-600" />
            </div>
          )}

          {status === "error" && (
            <div className="mx-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="ml-3 font-medium text-white underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          {status === "success" && filteredUsers.length === 0 && (
            <div className="px-6 py-20 text-center">
              <p className="text-sm text-slate-500">
                {search
                  ? "No users match your search."
                  : "There are no other users yet."}
              </p>
            </div>
          )}

          {status === "success" && filteredUsers.length > 0 && (
            <div className="divide-y divide-white/[0.06]">
              {filteredUsers.map((candidate) => {
                const followState = followStates[candidate.id];

                return (
                  <article
                    key={candidate.id}
                    className="flex items-center gap-4 px-6 py-4 transition hover:bg-white/[0.015]"
                  >
                    <UserAvatar user={candidate} size="h-12 w-12" />

                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/profile/${candidate.id}`}
                        className="block min-w-0"
                      >
                        <p className="truncate text-sm font-semibold text-white transition hover:text-indigo-300">
                          {candidate.displayName || candidate.username}
                        </p>

                        <p className="mt-0.5 truncate text-sm text-slate-500">
                          @{candidate.username}
                        </p>
                      </Link>

                      {candidate.bio && (
                        <p className="mt-1 truncate text-xs text-slate-600">
                          {candidate.bio}
                        </p>
                      )}
                    </div>

                    <FollowButton
                      status={followState?.status || "idle"}
                      onClick={() => handleFollow(candidate.id)}
                    />
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

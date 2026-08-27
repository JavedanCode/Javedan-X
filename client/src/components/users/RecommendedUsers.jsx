import { useEffect, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";

import { getUsers } from "../../api/users.js";
import {
  getFollowing,
  getPendingSentFollowRequests,
  sendFollowRequest,
} from "../../api/follows.js";

import UserAvatar from "./UserAvatar.jsx";
import FollowButton from "./FollowButton.jsx";
import { useAuth } from "../../context/useAuth.js";

export default function RecommendedUsers() {
  const { user } = useAuth();

  const [recommendations, setRecommendations] = useState([]);
  const [followStates, setFollowStates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadRecommendations() {
      setLoading(true);

      try {
        const [usersResponse, followingResponse, sentRequestsResponse] =
          await Promise.all([
            getUsers(),
            getFollowing(),
            getPendingSentFollowRequests(),
          ]);

        if (!mounted) {
          return;
        }

        const users = usersResponse?.users ?? [];
        const following = followingResponse?.following ?? [];
        const sentRequests = sentRequestsResponse?.sentRequests ?? [];

        const followingIds = new Set(
          following.map((relation) => relation?.recipient?.id).filter(Boolean),
        );

        const pendingIds = new Set(
          sentRequests.map((request) => request?.recipient?.id).filter(Boolean),
        );

        const available = users.filter((candidate) => {
          if (candidate.id === user?.id) {
            return false;
          }

          if (followingIds.has(candidate.id)) {
            return false;
          }

          if (pendingIds.has(candidate.id)) {
            return false;
          }

          return true;
        });

        setRecommendations(available.slice(0, 5));

        const initialStates = {};

        for (const relation of following) {
          const targetId = relation?.recipient?.id;

          if (targetId) {
            initialStates[targetId] = {
              status: "following",
              followId: relation.id,
            };
          }
        }

        for (const request of sentRequests) {
          const targetId = request?.recipient?.id;

          if (targetId) {
            initialStates[targetId] = {
              status: "pending",
              followId: request.id,
            };
          }
        }

        setFollowStates(initialStates);
      } catch {
        if (!mounted) {
          return;
        }

        setRecommendations([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadRecommendations();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  async function handleFollow(userId) {
    const current = followStates[userId];

    if (
      current?.status === "loading" ||
      current?.status === "following" ||
      current?.status === "pending"
    ) {
      return;
    }

    setFollowStates((states) => ({
      ...states,
      [userId]: {
        status: "loading",
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
    } catch {
      setFollowStates((states) => ({
        ...states,
        [userId]: {
          status: "idle",
        },
      }));
    }
  }

  return (
    <aside className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.015]">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <Sparkles size={16} className="text-indigo-300" />

        <h2 className="text-sm font-semibold text-white">Discover people</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <LoaderCircle size={18} className="animate-spin text-slate-600" />
        </div>
      ) : recommendations.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm leading-6 text-slate-600">
          You're following everyone for now.
        </p>
      ) : (
        <div className="divide-y divide-white/[0.06]">
          {recommendations.map((candidate) => (
            <div
              key={candidate.id}
              className="flex items-center gap-3 px-4 py-4"
            >
              <UserAvatar user={candidate} size="h-9 w-9" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">
                  {candidate.displayName || candidate.username}
                </p>

                <p className="truncate text-xs text-slate-600">
                  @{candidate.username}
                </p>
              </div>

              <FollowButton
                status={followStates[candidate.id]?.status || "idle"}
                onClick={() => handleFollow(candidate.id)}
              />
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

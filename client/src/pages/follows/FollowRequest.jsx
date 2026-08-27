import { useCallback, useEffect, useState } from "react";
import { Check, LoaderCircle, UserCheck, UserPlus, X } from "lucide-react";

import {
  acceptFollowRequest,
  declineFollowRequest,
  getPendingFollowRequests,
} from "../../api/follows.js";

import UserAvatar from "../../components/users/UserAvatar.jsx";

export default function FollowRequests() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [actionStates, setActionStates] = useState({});

  const loadRequests = useCallback(async () => {
    setStatus("loading");
    setError("");

    try {
      const response = await getPendingFollowRequests();

      setRequests(response?.requests ?? []);
      setStatus("success");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    getPendingFollowRequests()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setRequests(response?.requests ?? []);
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

  async function handleAccept(request) {
    const requestId = request.id;

    if (actionStates[requestId]) {
      return;
    }

    setActionStates((current) => ({
      ...current,
      [requestId]: "accepting",
    }));

    try {
      await acceptFollowRequest(requestId);

      setRequests((current) => current.filter((item) => item.id !== requestId));
    } catch (err) {
      setError(err.message);

      setActionStates((current) => ({
        ...current,
        [requestId]: null,
      }));
    }
  }

  async function handleDecline(request) {
    const requestId = request.id;

    if (actionStates[requestId]) {
      return;
    }

    setActionStates((current) => ({
      ...current,
      [requestId]: "declining",
    }));

    try {
      await declineFollowRequest(requestId);

      setRequests((current) => current.filter((item) => item.id !== requestId));
    } catch (err) {
      setError(err.message);

      setActionStates((current) => ({
        ...current,
        [requestId]: null,
      }));
    }
  }

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-white/10 px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
              <UserPlus size={20} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Follow requests
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage people who want to follow you.
              </p>
            </div>
          </div>
        </header>

        {status === "loading" && (
          <div className="flex justify-center py-20">
            <LoaderCircle size={22} className="animate-spin text-indigo-300" />
          </div>
        )}

        {status === "error" && (
          <div className="px-6 py-8">
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>

            <button
              type="button"
              onClick={loadRequests}
              className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#08081c] transition hover:bg-slate-200"
            >
              Try again
            </button>
          </div>
        )}

        {status === "success" && requests.length === 0 && (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] text-slate-500">
              <UserCheck size={23} />
            </div>

            <h2 className="mt-5 font-semibold text-white">
              No pending requests
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              When someone wants to follow you, their request will appear here.
            </p>
          </div>
        )}

        {status === "success" && requests.length > 0 && (
          <section>
            <div className="flex items-center gap-2 px-6 py-5">
              <UserPlus size={17} className="text-slate-500" />

              <h2 className="text-sm font-semibold text-slate-300">
                Pending requests
              </h2>

              <span className="text-xs text-slate-600">{requests.length}</span>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {requests.map((request) => {
                const requester = request.requester;
                const action = actionStates[request.id];

                const isAccepting = action === "accepting";
                const isDeclining = action === "declining";
                const isProcessing = Boolean(action);

                return (
                  <article
                    key={request.id}
                    className="flex items-center gap-4 px-6 py-5 transition hover:bg-white/[0.015]"
                  >
                    <UserAvatar user={requester} size="h-12 w-12" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {requester?.displayName || requester?.username}
                      </p>

                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        @{requester?.username}
                      </p>

                      {requester?.bio && (
                        <p className="mt-1 truncate text-xs text-slate-600">
                          {requester.bio}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDecline(request)}
                        disabled={isProcessing}
                        className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeclining ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : (
                          <X size={14} />
                        )}
                        Decline
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAccept(request)}
                        disabled={isProcessing}
                        className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#08081c] transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isAccepting ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        Accept
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

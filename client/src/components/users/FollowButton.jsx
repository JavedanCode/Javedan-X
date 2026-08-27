import { LoaderCircle, UserMinus, UserPlus } from "lucide-react";

export default function FollowButton({
  status = "idle",
  onClick,
  disabled = false,
}) {
  const isFollowing = status === "following";
  const isPending = status === "pending";
  const isLoading = status === "loading";

  if (isFollowing) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isLoading}
        className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <UserMinus size={14} />
        Following
      </button>
    );
  }

  if (isPending) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isLoading}
        className="flex items-center gap-2 rounded-lg border border-indigo-400/20 bg-indigo-400/10 px-3 py-2 text-xs font-medium text-indigo-300 transition hover:bg-red-400/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <LoaderCircle size={14} className="animate-spin" />
        ) : (
          <UserPlus size={14} />
        )}
        Requested
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#08081c] transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? (
        <LoaderCircle size={14} className="animate-spin" />
      ) : (
        <UserPlus size={14} />
      )}
      Follow
    </button>
  );
}

import { Link } from "react-router-dom";

export default function UserAvatar({ user, size = "h-11 w-11" }) {
  const content = user?.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt=""
      className={`${size} shrink-0 rounded-full object-cover`}
    />
  ) : (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300`}
    >
      {user?.username?.charAt(0).toUpperCase() || "?"}
    </div>
  );

  if (!user?.id) {
    return content;
  }

  return (
    <Link
      to={`/profile/${user.id}`}
      className="shrink-0 rounded-full"
      aria-label={`View ${user.displayName || user.username}'s profile`}
    >
      {content}
    </Link>
  );
}

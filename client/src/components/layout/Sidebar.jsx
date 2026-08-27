import { Bell, Compass, Home, LogOut, Settings, User } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/useAuth.js";

const navigation = [
  {
    label: "Home",
    to: "/",
    icon: Home,
  },
  {
    label: "Discover",
    to: "/discover",
    icon: Compass,
  },
  {
    label: "Requests",
    to: "/requests",
    icon: Bell,
  },
  {
    label: "Profile",
    to: "/profile",
    icon: User,
  },
  {
    label: "Settings",
    to: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-0 flex h-screen flex-col px-5 py-6">
        {/* Brand */}
        <NavLink to="/" className="mb-10 flex items-center gap-3 px-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-black text-[#08081c]">
            J
          </div>

          <span className="text-lg font-bold tracking-tight">Javedan-X</span>
        </NavLink>

        {/* Navigation */}
        <nav className="space-y-2">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-4 rounded-xl px-4 py-3.5",
                  "text-sm font-medium transition",
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white",
                ].join(" ")
              }
            >
              <Icon size={21} strokeWidth={1.8} />

              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="mt-auto">
          <div className="mb-3 border-t border-white/10 pt-5">
            <NavLink
              to="/profile"
              className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-white/[0.04]"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.displayName || user?.username}
                </p>

                <p className="truncate text-xs text-slate-500">
                  @{user?.username}
                </p>
              </div>
            </NavLink>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-400/10 hover:text-red-300"
          >
            <LogOut size={20} strokeWidth={1.8} />
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}

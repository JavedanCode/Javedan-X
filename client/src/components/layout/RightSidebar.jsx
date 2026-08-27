import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import RecommendedUsers from "../users/RecommendedUsers.jsx";

export default function RightSidebar() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const value = search.trim();

    if (!value) {
      navigate("/discover");
      return;
    }

    navigate(`/discover?search=${encodeURIComponent(value)}`);
  }

  return (
    <aside className="hidden w-80 shrink-0 xl:block">
      <div className="sticky top-0 space-y-5 px-5 py-6">
        <form onSubmit={handleSubmit} className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/50 focus:bg-white/[0.06]"
          />
        </form>

        <RecommendedUsers />
      </div>
    </aside>
  );
}

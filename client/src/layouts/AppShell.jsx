import { Outlet } from "react-router-dom";

import RightSidebar from "../components/layout/RightSidebar.jsx";
import Sidebar from "../components/layout/Sidebar.jsx";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-[#08081c] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <Sidebar />

        <main className="min-w-0 flex-1 border-x border-white/10">
          <Outlet />
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

import { Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import Settings from "../pages/settings/Settings.jsx";
import Feed from "../pages/feed/Feed.jsx";
import Discover from "../pages/discover/Discover.jsx";
import FollowRequests from "../pages/follows/FollowRequest.jsx";
import Profile from "../pages/profile/Profile.jsx";

import AppShell from "../layouts/AppShell.jsx";

import GuestRoute from "./GuestRoute.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

export default function AppRouter() {
  return (
    <Routes>
      {/* Guest routes */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected application */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Feed />} />

          <Route path="/discover" element={<Discover />} />

          <Route path="/requests" element={<FollowRequests />} />

          <Route path="/profile" element={<Profile />} />

          <Route path="/profile/:userId" element={<Profile />} />

          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

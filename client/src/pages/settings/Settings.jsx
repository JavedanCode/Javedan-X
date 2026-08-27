import { useState } from "react";
import {
  AlertTriangle,
  Check,
  LoaderCircle,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { deleteAccount } from "../../api/user.js";
import { useAuth } from "../../context/useAuth.js";

export default function Settings() {
  const { user, updateUserProfile, changeUsername, logout } = useAuth();

  const [username, setUsername] = useState(user?.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");

  const [usernameMessage, setUsernameMessage] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const [avatarMessage, setAvatarMessage] = useState("");
  const [avatarError, setAvatarError] = useState("");

  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleUsernameSubmit(event) {
    event.preventDefault();

    setUsernameMessage("");
    setUsernameError("");

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setUsernameError("Username cannot be empty.");
      return;
    }

    setIsUpdatingUsername(true);

    try {
      await changeUsername(trimmedUsername);

      setUsername(trimmedUsername);

      setUsernameMessage("Username updated successfully.");
    } catch (error) {
      setUsernameError(error.message);
    } finally {
      setIsUpdatingUsername(false);
    }
  }

  async function handleAvatarSubmit(event) {
    event.preventDefault();

    setAvatarMessage("");
    setAvatarError("");

    setIsUpdatingAvatar(true);

    try {
      await updateUserProfile({
        avatarUrl: avatarUrl.trim() || null,
      });

      setAvatarUrl(avatarUrl.trim());
      setAvatarMessage("Profile picture updated successfully.");
    } catch (error) {
      setAvatarError(error.message);
    } finally {
      setIsUpdatingAvatar(false);
    }
  }

  function openDeleteModal() {
    setDeletePassword("");
    setDeleteError("");
    setIsDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    if (isDeleting) {
      return;
    }

    setIsDeleteModalOpen(false);
    setDeletePassword("");
    setDeleteError("");
  }

  async function handleDeleteAccount(event) {
    event.preventDefault();

    setDeleteError("");

    const isLocalAccount = Boolean(user?.hasPassword);

    if (isLocalAccount && !deletePassword.trim()) {
      setDeleteError("Enter your current password to delete your account.");
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAccount(isLocalAccount ? deletePassword : undefined);

      await logout();
    } catch (error) {
      setDeleteError(error.message);
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-2xl">
        <header className="border-b border-white/10 px-6 py-7">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

            <p className="mt-1 text-sm text-slate-500">Manage your account.</p>
          </div>
        </header>

        <div className="space-y-5 p-6">
          {/* Username */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                <UserRound size={18} />
              </div>

              <div>
                <h2 className="font-semibold text-white">Username</h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Change the username associated with your account.
                </p>
              </div>
            </div>

            <form onSubmit={handleUsernameSubmit} className="mt-6">
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Username
              </label>

              <div className="flex gap-3">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setUsernameError("");
                    setUsernameMessage("");
                  }}
                  autoComplete="username"
                  disabled={isUpdatingUsername}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/50 disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={isUpdatingUsername}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#08081c] transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUpdatingUsername ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save
                </button>
              </div>

              {usernameError && (
                <p role="alert" className="mt-3 text-sm text-red-300">
                  {usernameError}
                </p>
              )}

              {usernameMessage && (
                <p
                  role="status"
                  className="mt-3 flex items-center gap-2 text-sm text-emerald-300"
                >
                  <Check size={15} />
                  {usernameMessage}
                </p>
              )}
            </form>
          </section>

          {/* Avatar */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                <UserRound size={18} />
              </div>

              <div>
                <h2 className="font-semibold text-white">Profile picture</h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Set the image URL used for your profile picture.
                </p>
              </div>
            </div>

            <form onSubmit={handleAvatarSubmit} className="mt-6">
              <div className="mb-5 flex items-center gap-4">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-white/10"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20 text-lg font-semibold text-indigo-300">
                    {user?.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
              </div>

              <label
                htmlFor="avatarUrl"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Image URL
              </label>

              <div className="flex gap-3">
                <input
                  id="avatarUrl"
                  name="avatarUrl"
                  type="url"
                  value={avatarUrl}
                  onChange={(event) => {
                    setAvatarUrl(event.target.value);
                    setAvatarError("");
                    setAvatarMessage("");
                  }}
                  placeholder="https://example.com/avatar.jpg"
                  disabled={isUpdatingAvatar}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/50 disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={isUpdatingAvatar}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#08081c] transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUpdatingAvatar ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save
                </button>
              </div>

              {avatarError && (
                <p role="alert" className="mt-3 text-sm text-red-300">
                  {avatarError}
                </p>
              )}

              {avatarMessage && (
                <p
                  role="status"
                  className="mt-3 flex items-center gap-2 text-sm text-emerald-300"
                >
                  <Check size={15} />
                  {avatarMessage}
                </p>
              )}
            </form>
          </section>

          {/* Delete */}
          <section className="rounded-2xl border border-red-400/20 bg-red-400/[0.03] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
                <AlertTriangle size={18} />
              </div>

              <div>
                <h2 className="font-semibold text-white">Delete account</h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Permanently delete your account and everything associated with
                  it.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openDeleteModal}
              className="mt-6 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/15"
            >
              <Trash2 size={16} />
              Delete account
            </button>
          </section>
        </div>
      </div>

      {/* Delete account modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111126] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
                  <AlertTriangle size={18} />
                </div>

                <div>
                  <h2
                    id="delete-account-title"
                    className="font-semibold text-white"
                  >
                    Delete your account?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    This permanently deletes your account and all associated
                    data. This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="shrink-0 rounded-full p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {user?.hasPassword ? (
              <form onSubmit={handleDeleteAccount} className="mt-6">
                <label
                  htmlFor="deletePassword"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Current password
                </label>

                <input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(event) => {
                    setDeletePassword(event.target.value);
                    setDeleteError("");
                  }}
                  autoComplete="current-password"
                  disabled={isDeleting}
                  autoFocus
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-red-400/40 disabled:opacity-50"
                />

                {deleteError && (
                  <p role="alert" className="mt-3 text-sm text-red-300">
                    {deleteError}
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    disabled={isDeleting}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isDeleting || !deletePassword.trim()}
                    className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeleting && (
                      <LoaderCircle size={16} className="animate-spin" />
                    )}
                    {isDeleting ? "Deleting..." : "Delete account"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6">
                <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-400">
                  This account does not have a local password. You can delete it
                  without entering one.
                </p>

                {deleteError && (
                  <p role="alert" className="mt-3 text-sm text-red-300">
                    {deleteError}
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    disabled={isDeleting}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeleting && (
                      <LoaderCircle size={16} className="animate-spin" />
                    )}
                    {isDeleting ? "Deleting..." : "Delete account"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

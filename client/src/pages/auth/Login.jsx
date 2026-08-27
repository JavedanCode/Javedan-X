import { useState } from "react";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import AuthInput from "../../components/auth/AuthInput.jsx";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import OAuthButton from "../../components/auth/OAuthButton.jsx";
import { useAuth } from "../../context/useAuth.js";

const DEMO_CREDENTIALS = {
  email: "clarke@example.com",
  password: "DemoPassword123!",
};

export default function Login() {
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      await login(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDemoLogin() {
    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await login(DEMO_CREDENTIALS);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout mode="login">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-5 text-red-300"
          >
            {error}
          </div>
        )}

        <AuthInput
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          disabled={isSubmitting}
        />

        <AuthInput
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          disabled={isSubmitting}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-[#08081c] transition hover:bg-slate-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle size={18} className="animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={isSubmitting}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-400/10 px-4 py-3.5 text-sm font-semibold text-indigo-300 transition hover:border-indigo-400/30 hover:bg-indigo-400/15 hover:text-indigo-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <LoaderCircle size={18} className="animate-spin" />
        ) : (
          <Sparkles size={18} />
        )}

        {isSubmitting ? "Signing in..." : "Try the demo"}
      </button>

      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />

        <span className="text-xs uppercase tracking-wider text-slate-600">
          or
        </span>

        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="space-y-3">
        <OAuthButton provider="google" />
        <OAuthButton provider="github" />
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="font-medium text-white transition hover:text-indigo-300"
        >
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}

import { ArrowUpRight } from "lucide-react";

export default function AuthLayout({ children, mode }) {
  const isLogin = mode === "login";

  return (
    <main className="min-h-screen bg-[#08081c] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* Brand side */}
        <section className="relative hidden flex-1 overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(99,102,241,0.18),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.12),transparent_30%)]" />

          <div className="relative flex w-full flex-col justify-between p-12 xl:p-16">
            <div>
              <div className="mb-10 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-black text-[#08081c]">
                  J
                </div>

                <span className="text-xl font-bold tracking-tight">
                  Javedan-X
                </span>
              </div>

              <div className="max-w-xl">
                <p className="mb-5 text-sm font-medium uppercase tracking-[0.25em] text-indigo-300">
                  Your social space
                </p>

                <h1 className="text-5xl font-bold leading-[1.05] tracking-tight xl:text-7xl">
                  Share what
                  <br />
                  matters.
                </h1>

                <p className="mt-7 max-w-md text-base leading-7 text-slate-400 xl:text-lg">
                  Connect with people, share your thoughts, and keep up with the
                  people you care about.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Javedan-X</span>

              <span className="flex items-center gap-1">
                Built with React
                <ArrowUpRight size={14} />
              </span>
            </div>
          </div>
        </section>

        {/* Authentication side */}
        <section className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:max-w-[520px] lg:border-l lg:border-white/10 lg:bg-white/[0.02]">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-black text-[#08081c]">
                J
              </div>

              <span className="text-lg font-bold">Javedan-X</span>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight">
                {isLogin ? "Welcome back." : "Create your account."}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {isLogin
                  ? "Sign in to continue to Javedan-X."
                  : "Join Javedan-X and start sharing."}
              </p>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function Nav() {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setEmail(s?.user?.email ?? null);
      router.invalidate();
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="bg-hero grid size-7 place-items-center rounded-lg text-white shadow-sm">
            <Sparkles className="size-4" />
          </span>
          Skillens
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {email ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/analyze">Analyze</NavLink>
              <NavLink to="/library">Library</NavLink>
              <button
                onClick={signOut}
                className="ml-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title={email}
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="rounded-md bg-primary px-4 py-1.5 text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      activeProps={{ className: "rounded-md px-3 py-1.5 text-foreground bg-muted font-medium" }}
    >
      {children}
    </Link>
  );
}

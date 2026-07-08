import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAnalyses } from "@/lib/analysis.functions";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(listAnalyses);
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["analyses"],
    queryFn: () => fn(),
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Your analyses</h1>
          <p className="mt-1 text-muted-foreground">Every resume ↔ JD run, and how your scores trend.</p>
        </div>
        <Link to="/analyze" className="inline-flex items-center gap-2 rounded-lg bg-hero px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:opacity-90">
          <Sparkles className="size-4" /> New analysis
        </Link>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card">
        <header className="border-b border-border px-6 py-4 font-semibold">Recent Analyses</header>
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : !data || data.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-muted-foreground">No analyses yet.</p>
            <Link to="/analyze" className="mt-3 inline-block text-primary hover:underline">
              Run your first analysis →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{a.jd_name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    {a.resume_filename ? ` · ${a.resume_filename}` : ""}
                  </div>
                </div>
                <ScorePill score={a.score} />
                <button
                  onClick={() =>
                    navigate({
                      to: "/analyze",
                      search: { rerun: a.id } as never,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <RefreshCw className="size-3.5" /> Re-run with New Resume
                </button>
                <Link to="/results/$id" params={{ id: a.id }} className="text-sm font-medium text-primary hover:underline">
                  View →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function ScorePill({ score }: { score: number }) {
  const color = score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";
  return (
    <div className={`font-display text-2xl font-bold ${color}`}>
      {score}
      <span className="text-xs text-muted-foreground">/100</span>
    </div>
  );
}

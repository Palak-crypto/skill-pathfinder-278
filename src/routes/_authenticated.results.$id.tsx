import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAnalysis } from "@/lib/analysis.functions";
import { createShare } from "@/lib/share.functions";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Share2, Check, X, Copy, TrendingUp, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export const Route = createFileRoute("/_authenticated/results/$id")({
  component: ResultsPage,
});

function ResultsPage() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getAnalysis);
  const shareFn = useServerFn(createShare);

  const q = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const shareMut = useMutation({
    mutationFn: () => shareFn({ data: { analysis_id: id } }),
    onSuccess: (r) => {
      const url = `${window.location.origin}/share/${r.token}`;
      setShareUrl(url);
      navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Share link copied to clipboard");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not create link"),
  });

  if (q.isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (q.error || !q.data) return <div className="p-10 text-destructive">Failed to load.</div>;

  const { analysis, trend } = q.data;
  const scoreColor = analysis.score >= 80 ? "text-success" : analysis.score >= 60 ? "text-warning" : "text-destructive";

  const prev = trend.filter((t) => t.id !== analysis.id).slice(-1)[0];
  const delta = prev ? analysis.score - prev.score : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Results</div>
          <h1 className="font-display text-3xl font-bold">{analysis.jd_name}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {format(new Date(analysis.created_at), "PPp")}
            {analysis.resume_filename ? ` · ${analysis.resume_filename}` : ""}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/analyze" search={{ rerun: analysis.id } as never}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
          ><RefreshCw className="size-4" /> Re-run with new resume</Link>
          <button
            onClick={() => shareMut.mutate()}
            disabled={shareMut.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-hero px-3 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:opacity-90"
          ><Share2 className="size-4" /> {shareMut.isPending ? "Creating…" : "Share"}</button>
        </div>
      </div>

      {shareUrl && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <Copy className="size-4 text-muted-foreground" />
          <code className="flex-1 truncate">{shareUrl}</code>
          <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Copied"); }} className="text-primary hover:underline">Copy</button>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">Match score</div>
          <div className={`mt-2 font-display text-6xl font-bold ${scoreColor}`}>{analysis.score}</div>
          <div className="text-sm text-muted-foreground">/ 100</div>
          {prev && (
            <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              <TrendingUp className="size-3.5" /> {delta >= 0 ? "+" : ""}{delta} vs previous
            </div>
          )}
          {analysis.summary && <p className="mt-4 text-sm text-muted-foreground">{analysis.summary}</p>}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">Score trend for “{analysis.jd_name}”</div>
            <div className="text-xs text-muted-foreground">{trend.length} run{trend.length !== 1 ? "s" : ""}</div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend.map((t, i) => ({ run: `#${i + 1}`, score: t.score }))}>
                <XAxis dataKey="run" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <ReferenceLine y={80} stroke="var(--success)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={{ r: 5, fill: "var(--primary)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SkillCard title="Matched skills" items={analysis.matched_skills as string[]} tone="success" />
        <SkillCard title="Missing skills" items={analysis.missing_skills as string[]} tone="destructive" />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="font-semibold">ATS keywords</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(analysis.ats_keywords as Array<{ keyword: string; in_resume: boolean }>).map((k) => (
            <span key={k.keyword} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${k.in_resume ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              {k.in_resume ? <Check className="size-3" /> : <X className="size-3" />}
              {k.keyword}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="font-semibold">Suggestions</div>
        <ol className="mt-3 space-y-3">
          {(analysis.suggestions as string[]).map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
              <span className="text-sm">{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}

function SkillCard({ title, items, tone }: { title: string; items: string[]; tone: "success" | "destructive" }) {
  const color = tone === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive";
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="font-semibold">{title}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length === 0 ? (
          <span className="text-sm text-muted-foreground">None</span>
        ) : items.map((s) => (
          <span key={s} className={`rounded-full px-3 py-1 text-xs font-medium ${color}`}>{s}</span>
        ))}
      </div>
    </div>
  );
}

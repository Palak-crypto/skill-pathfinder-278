import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getShareByToken } from "@/lib/share.functions";
import { format } from "date-fns";
import { Check, X, Sparkles } from "lucide-react";

export const Route = createFileRoute("/share/$token")({
  component: SharePage,
  head: ({ params }) => ({
    meta: [
      { title: "Shared Resume Analysis — Skillens" },
      { name: "description", content: "A read-only Skillens resume vs. job description analysis: ATS keywords, matched and missing skills, and tailored suggestions." },
      { property: "og:title", content: "Shared Resume Analysis — Skillens" },
      { property: "og:description", content: "View a shared read-only resume ↔ JD analysis on Skillens." },
      { property: "og:url", content: `https://skill-pathfinder-278.lovable.app/share/${params.token}` },
      { property: "og:type", content: "article" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: `https://skill-pathfinder-278.lovable.app/share/${params.token}` }],
  }),
});

function SharePage() {
  const { token } = Route.useParams();
  const fn = useServerFn(getShareByToken);
  const q = useQuery({ queryKey: ["share", token], queryFn: () => fn({ data: { token } }) });

  return (
    <div className="min-h-screen bg-mesh">
      <header className="border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="bg-hero grid size-7 place-items-center rounded-lg text-white"><Sparkles className="size-4" /></span>
            Skillens
          </Link>
          <div className="text-xs text-muted-foreground">Shared read-only report</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {q.isLoading && <div className="text-muted-foreground">Loading…</div>}
        {q.error && <div className="text-destructive">This share link is invalid or has been revoked.</div>}
        {q.data && (
          <>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Shared analysis</div>
            <h1 className="font-display text-3xl font-bold">{q.data.jd_name}</h1>
            <div className="mt-1 text-sm text-muted-foreground">{format(new Date(q.data.created_at), "PPp")}</div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-sm text-muted-foreground">Match score</div>
                <div className={`mt-2 font-display text-6xl font-bold ${q.data.score >= 80 ? "text-success" : q.data.score >= 60 ? "text-warning" : "text-destructive"}`}>{q.data.score}</div>
                <div className="text-sm text-muted-foreground">/ 100</div>
                {q.data.summary && <p className="mt-4 text-sm text-muted-foreground">{q.data.summary}</p>}
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
                <div className="font-semibold">Missing skills</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(q.data.missing_skills as string[]).map((s) => (
                    <span key={s} className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">{s}</span>
                  ))}
                </div>
                <div className="mt-6 font-semibold">Matched skills</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(q.data.matched_skills as string[]).map((s) => (
                    <span key={s} className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <div className="font-semibold">ATS keywords</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(q.data.ats_keywords as Array<{ keyword: string; in_resume: boolean }>).map((k) => (
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
                {(q.data.suggestions as string[]).map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                    <span className="text-sm">{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            <section className="mt-10 overflow-hidden rounded-2xl bg-hero p-8 text-white shadow-xl">
              <h2 className="font-display text-2xl font-bold">Create Your Own Analysis</h2>
              <p className="mt-1 max-w-xl opacity-90">Score any resume against any JD in seconds. Free — try Skillens.</p>
              <Link to="/auth" className="mt-5 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-primary hover:bg-white/90">
                Try Skillens Free →
              </Link>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/layout/nav";
import { CheckCircle2, Gauge, Library, Share2, Sparkles, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Skillens — AI Resume + JD Analyzer with ATS Scoring" },
      { name: "description", content: "Score your resume against any job description with real AI. Get ATS keywords, missing skills, tailored suggestions, and track improvements over time." },
      { property: "og:title", content: "Skillens — AI Resume + JD Analyzer with ATS Scoring" },
      { property: "og:description", content: "Score your resume against any JD in seconds. ATS keywords, missing skills, and tailored suggestions — powered by real AI." },
      { property: "og:url", content: "https://skill-pathfinder-278.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://skill-pathfinder-278.lovable.app/" }],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-mesh">
      <Nav />
      <main className="mx-auto max-w-6xl px-4">
        <section className="py-20 text-center md:py-28">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />
            Real AI analysis — never simulated
          </div>
          <h1 className="mt-6 font-display text-5xl font-bold tracking-tight md:text-6xl">
            Land the role, not <span className="text-gradient">the reject pile.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Skillens scores your resume against any job description, surfaces the exact ATS keywords
            and skills you're missing, and tracks your improvement across every revision.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/analyze"
              className="rounded-lg bg-hero px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:opacity-90"
            >
              Run a free analysis
            </Link>
            <Link
              to="/auth"
              className="rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold hover:bg-muted"
            >
              Create account
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-24 md:grid-cols-3">
          {[
            { icon: Gauge, title: "ATS score in seconds", body: "Real match score computed by AI on the exact text of your resume and the JD." },
            { icon: TrendingUp, title: "Track improvement", body: "Re-run any analysis with an updated resume. See a trend chart of your scores." },
            { icon: Library, title: "JD Library", body: "Save every JD you're targeting and reuse it across resume revisions." },
            { icon: CheckCircle2, title: "Missing skills, not fluff", body: "Concrete list of skills and keywords to add — no generic advice." },
            { icon: Share2, title: "Share with your coach", body: "One-click read-only link. No login required for viewers." },
            { icon: Sparkles, title: "Actionable rewrites", body: "4–6 specific suggestions tailored to this exact JD." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <f.icon className="size-6 text-primary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

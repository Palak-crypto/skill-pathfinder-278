import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { listJDs, getJD } from "@/lib/jd.functions";
import { getAnalysis, runAnalysis } from "@/lib/analysis.functions";
import { extractPdfText } from "@/lib/pdf-extract";
import { FileUp, Loader2, Sparkles } from "lucide-react";

const searchSchema = z.object({
  jd_id: z.string().uuid().optional(),
  rerun: z.string().uuid().optional(),
});

export const Route = createFileRoute("/_authenticated/analyze")({
  validateSearch: searchSchema,
  component: AnalyzePage,
});

function AnalyzePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const listJDsFn = useServerFn(listJDs);
  const getJDFn = useServerFn(getJD);
  const getAnalysisFn = useServerFn(getAnalysis);
  const runFn = useServerFn(runAnalysis);

  const jds = useQuery({ queryKey: ["jds"], queryFn: () => listJDsFn() });

  const [jdName, setJdName] = useState("");
  const [jdText, setJdText] = useState("");
  const [jdId, setJdId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [prefilling, setPrefilling] = useState(false);

  // Pre-populate from JD library
  useEffect(() => {
    if (!search.jd_id) return;
    setPrefilling(true);
    getJDFn({ data: { id: search.jd_id } })
      .then((jd) => {
        if (jd) { setJdName(jd.name); setJdText(jd.content); setJdId(jd.id); }
      })
      .finally(() => setPrefilling(false));
  }, [search.jd_id, getJDFn]);

  // Pre-populate from previous analysis (Re-run flow)
  useEffect(() => {
    if (!search.rerun) return;
    setPrefilling(true);
    getAnalysisFn({ data: { id: search.rerun } })
      .then(({ analysis }) => {
        setJdName(analysis.jd_name);
        setJdText(analysis.jd_text);
        setJdId(analysis.jd_id ?? null);
      })
      .finally(() => setPrefilling(false));
  }, [search.rerun, getAnalysisFn]);

  const canRun = useMemo(
    () => jdName.trim().length > 0 && jdText.trim().length > 20 && !!file && !running,
    [jdName, jdText, file, running],
  );

  async function run() {
    if (!file) return;
    setRunning(true);
    try {
      toast.info("Reading your resume…");
      const resumeText = await extractPdfText(file);
      if (resumeText.length < 40) {
        throw new Error("Couldn't extract text from that PDF. Try a text-based PDF (not a scan).");
      }
      toast.info("Analyzing with AI…");
      const { id } = await runFn({
        data: {
          jd_name: jdName.trim(),
          jd_text: jdText,
          resume_text: resumeText,
          resume_filename: file.name,
          jd_id: jdId,
        },
      });
      toast.success("Analysis complete!");
      navigate({ to: "/results/$id", params: { id } });
    } catch (err: any) {
      toast.error(err.message ?? "Analysis failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">New analysis</h1>
      <p className="mt-1 text-muted-foreground">Paste a job description, upload your resume, run.</p>

      {prefilling && <div className="mt-4 text-sm text-muted-foreground">Loading…</div>}

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <div>
            <label className="text-sm font-medium">Role name</label>
            <input
              type="text"
              placeholder="e.g. Acme Frontend Role"
              value={jdName}
              onChange={(e) => setJdName(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Job description</label>
            <textarea
              rows={14}
              placeholder="Paste the full JD here…"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">{jdText.length} characters</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {jds.data && jds.data.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-sm font-semibold">Or use a saved JD</div>
              <select
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) return;
                  navigate({ to: "/analyze", search: { jd_id: v } });
                }}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="" disabled>Select from Library…</option>
                {jds.data.map((j) => (<option key={j.id} value={j.id}>{j.name}</option>))}
              </select>
            </div>
          )}

          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-border bg-card p-6 text-center transition hover:border-primary">
            <FileUp className="mx-auto size-8 text-muted-foreground" />
            <div className="mt-2 font-semibold">{file ? file.name : "Upload resume PDF"}</div>
            <div className="mt-1 text-xs text-muted-foreground">Text-based PDF · max 10MB</div>
            <input
              type="file" accept="application/pdf" className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <button
            disabled={!canRun}
            onClick={run}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-hero px-4 py-3 font-semibold text-white shadow-md shadow-primary/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {running ? "Analyzing…" : "Run Analysis"}
          </button>
        </div>
      </div>
    </main>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listJDs, createJD, deleteJD } from "@/lib/jd.functions";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Play, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/library")({
  component: LibraryPage,
});

function LibraryPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const listFn = useServerFn(listJDs);
  const createFn = useServerFn(createJD);
  const delFn = useServerFn(deleteJD);

  const q = useQuery({ queryKey: ["jds"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);

  const create = useMutation({
    mutationFn: (v: { name: string; content: string }) => createFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["jds"] }); setOpen(false); toast.success("JD saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["jds"] }); toast.success("Deleted"); },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">JD Library</h1>
          <p className="mt-1 text-muted-foreground">Save job descriptions you're targeting and reuse them.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-hero px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:opacity-90">
          <Plus className="size-4" /> Add New JD
        </button>
      </div>

      {q.isLoading ? (
        <div className="mt-8 text-muted-foreground">Loading…</div>
      ) : !q.data || q.data.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Your library is empty.</p>
          <button onClick={() => setOpen(true)} className="mt-3 text-primary hover:underline">Add your first JD →</button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {q.data.map((j) => (
            <div key={j.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold">{j.name}</div>
                <button onClick={() => del.mutate(j.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(j.created_at), { addSuffix: true })}
              </div>
              <p className="mt-3 line-clamp-4 flex-1 text-sm text-muted-foreground">{j.content}</p>
              <button
                onClick={() => navigate({ to: "/analyze", search: { jd_id: j.id } })}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20"
              >
                <Play className="size-4" /> Use in Analysis
              </button>
            </div>
          ))}
        </div>
      )}

      {open && <AddModal onClose={() => setOpen(false)} onSave={(v) => create.mutate(v)} busy={create.isPending} />}
    </main>
  );
}

function AddModal({ onClose, onSave, busy }: { onClose: () => void; onSave: (v: { name: string; content: string }) => void; busy: boolean }) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Add New JD</h2>
            <p className="text-sm text-muted-foreground">Save a JD to reuse across resume revisions.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Google PM Role Q4"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium">Job description</label>
            <textarea rows={10} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste the full JD…"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed focus:ring-2 focus:ring-ring outline-none" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm hover:bg-muted">Cancel</button>
          <button
            disabled={busy || name.trim().length === 0 || content.trim().length < 10}
            onClick={() => onSave({ name: name.trim(), content })}
            className="rounded-md bg-hero px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50"
          >Save</button>
        </div>
      </div>
    </div>
  );
}

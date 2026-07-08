import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function randomToken(len = 16) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 22);
}

export const createShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ analysis_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    // Reuse existing token if present
    const { data: existing } = await context.supabase
      .from("shares")
      .select("token")
      .eq("analysis_id", data.analysis_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) return { token: existing.token };

    const token = randomToken();
    const { error } = await context.supabase
      .from("shares")
      .insert({ token, analysis_id: data.analysis_id, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { token };
  });

export const revokeShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ analysis_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("shares")
      .delete()
      .eq("analysis_id", data.analysis_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getShareByToken = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ token: z.string().min(4).max(64) }).parse(i))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: rows, error } = await supabase.rpc("get_shared_analysis", { _token: data.token });
    if (error) throw new Error(error.message);
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) throw new Error("Not found");
    return row;
  });

import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const AnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  matched_skills: z.array(z.string()),
  missing_skills: z.array(z.string()),
  ats_keywords: z.array(z.object({
    keyword: z.string(),
    in_resume: z.boolean(),
  })),
  suggestions: z.array(z.string()),
});

const InputSchema = z.object({
  jd_name: z.string().min(1).max(200),
  jd_text: z.string().min(20),
  resume_text: z.string().min(20),
  resume_filename: z.string().optional(),
  jd_id: z.string().uuid().nullable().optional(),
});

export const runAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service not configured");

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-2.5-flash");

    const prompt = `You are an expert ATS (Applicant Tracking System) and resume analyzer. Analyze the following resume against the job description and return a JSON object with:
- score: integer 0-100, how well the resume matches the JD (weight required skills, experience, keyword coverage)
- summary: 2-3 sentence overall assessment
- matched_skills: array of skills/technologies found in BOTH the resume and JD
- missing_skills: array of important skills mentioned in the JD but absent or weak in the resume
- ats_keywords: array of the 10-15 most important ATS keywords from the JD, each with in_resume boolean
- suggestions: array of 4-6 concrete, actionable recommendations to improve the resume for this specific JD

Base every field ONLY on the exact content provided. Do not invent skills.

--- JOB DESCRIPTION ---
${data.jd_text}

--- RESUME ---
${data.resume_text}`;

    let result: z.infer<typeof AnalysisSchema>;
    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: AnalysisSchema }),
        prompt,
      });
      result = output;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        throw new Error("Analysis failed: model output was invalid. Please retry.");
      }
      throw err;
    }

    const score = Math.round(Math.max(0, Math.min(100, result.score)));

    const { data: inserted, error } = await context.supabase
      .from("analyses")
      .insert({
        user_id: context.userId,
        jd_id: data.jd_id ?? null,
        jd_name: data.jd_name,
        jd_text: data.jd_text,
        resume_text: data.resume_text,
        resume_filename: data.resume_filename ?? null,
        score,
        matched_skills: result.matched_skills,
        missing_skills: result.missing_skills,
        ats_keywords: result.ats_keywords,
        suggestions: result.suggestions,
        summary: result.summary,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const getAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("analyses")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Analysis not found");

    // Fetch trend: prior analyses with same jd_name for this user
    const { data: trend } = await context.supabase
      .from("analyses")
      .select("id, score, created_at")
      .eq("user_id", context.userId)
      .eq("jd_name", row.jd_name)
      .order("created_at", { ascending: true });

    return { analysis: row, trend: trend ?? [] };
  });

export const listAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("analyses")
      .select("id, jd_name, score, created_at, resume_filename, jd_id")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

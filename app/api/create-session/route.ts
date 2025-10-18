// aidejuridic-forgemini/app/api/create-session/route.ts
import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { WORKFLOW_ID } from "@/lib/config"; // Assurez-vous que ce chemin est correct

export const runtime = "edge";

interface CreateSessionRequestBody {
  workflow?: { id?: string | null } | null;
  workflowId?: string | null;
  chatkit_configuration?: {
    file_upload?: {
      enabled?: boolean;
    };
  };
}

const DEFAULT_CHATKIT_BASE = "https://api.openai.com";

export async function POST(request: Request): Promise<Response> {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value ?? '';
        },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }); } catch (error) { console.error("(set cookie edge):", error); }
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }); } catch (error) { console.error("(remove cookie edge):", error); }
        },
      },
    }
  );

  // Utilisation de getSession pour l'instant, mais getUser() est recommandé pour la sécurité
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error("Auth Error in create-session:", sessionError?.message || "No active session");
    return NextResponse.json({ error: 'Unauthorized - No active session' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error("Missing OPENAI_API_KEY environment variable");
      return NextResponse.json({ error: "Server configuration error: Missing API Key" }, { status: 500 });
    }

    const parsedBody = await safeParseJson<CreateSessionRequestBody>(request);
    const resolvedWorkflowId = parsedBody?.workflow?.id ?? parsedBody?.workflowId ?? WORKFLOW_ID;

    if (process.env.NODE_ENV !== "production") {
      console.info("[create-session] handling request for authenticated user", {
        userId: userId,
        resolvedWorkflowId,
      });
    }

    if (!resolvedWorkflowId) {
       console.error("Missing workflow id in request or config");
      return NextResponse.json({ error: "Missing workflow id" }, { status: 400 });
    }

    const apiBase = process.env.CHATKIT_API_BASE ?? DEFAULT_CHATKIT_BASE;
    const url = `${apiBase}/v1/chatkit/sessions`;

    const requestBodyToOpenAI = {
      user: userId, // ID utilisateur ajouté
      workflow: { id: resolvedWorkflowId },
      chatkit_configuration: {
        file_upload: { enabled: parsedBody?.chatkit_configuration?.file_upload?.enabled ?? true },
      },
    };

    const upstreamResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
        "OpenAI-Beta": "chatkit_beta=v1",
      },
      body: JSON.stringify(requestBodyToOpenAI),
    });

    const upstreamJson = (await upstreamResponse.json().catch(() => ({}))) as Record<string, unknown> | undefined;

    if (!upstreamResponse.ok) {
      // Utilisation de la nouvelle fonction extractUpstreamError
      const upstreamError = extractUpstreamError(upstreamJson);
      console.error("OpenAI ChatKit session creation failed", { status: upstreamResponse.status, statusText: upstreamResponse.statusText, body: upstreamJson });
      return NextResponse.json({ error: upstreamError ?? `Failed to create session: ${upstreamResponse.statusText}`, details: upstreamJson }, { status: upstreamResponse.status });
    }

    const clientSecret = upstreamJson?.client_secret ?? null;
    const expiresAfter = upstreamJson?.expires_after ?? null;

    if (!clientSecret) {
        console.error("Missing client_secret in upstream response");
        return NextResponse.json({ error: "Failed to initialize session: Missing client secret" }, { status: 500 });
    }

    const responsePayload = { client_secret: clientSecret, expires_after: expiresAfter };
    return NextResponse.json(responsePayload, { status: 200 });

  } catch (error) {
    console.error("Create session unexpected error", error);
    const errorMessage = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: "Unexpected server error", details: errorMessage }, { status: 500 });
  }
}

// Handler GET (inchangé)
export async function GET(): Promise<Response> {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405, headers: { Allow: "POST" } });
}

// Helper safeParseJson (inchangé)
async function safeParseJson<T>(req: Request): Promise<T | null> {
    try { const text = await req.text(); return text ? (JSON.parse(text) as T) : null; } catch { return null; }
}

// --- Nouvelle fonction extractUpstreamError typée ---
type WithMessage = { message?: unknown };
type WithError = { error?: unknown };
type WithDetails = { details?: unknown };

function hasStringMessage(v: unknown): v is { message: string } {
  return typeof v === 'object' && v !== null && typeof (v as WithMessage).message === 'string';
}

function extractUpstreamError(
  payload: Record<string, unknown> | undefined
): string | null {
  if (!payload) return null;

  // 1) error: string | { message?: string } | unknown
  const errField: unknown = (payload as WithError).error;

  if (typeof errField === 'string') return errField;
  if (hasStringMessage(errField)) return errField.message;

  // 2) details: string | { error?: string | { message?: string } } | unknown
  const detailsField: unknown = (payload as WithDetails).details;

  if (typeof detailsField === 'string') return detailsField;

  if (typeof detailsField === 'object' && detailsField !== null) {
    const nested = (detailsField as WithError).error;
    if (typeof nested === 'string') return nested;
    if (hasStringMessage(nested)) return nested.message;
  }

  // 3) message au top-level
  if (typeof payload.message === 'string') return payload.message;

  return null;
}
// ---------------------------------------------------
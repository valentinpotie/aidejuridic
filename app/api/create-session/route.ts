// aidejuridic-forgemini/app/api/create-session/route.ts
import { type CookieOptions, createServerClient } from '@supabase/ssr'; // Utilisation de @supabase/ssr
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { WORKFLOW_ID } from "@/lib/config"; //

export const runtime = "edge"; // Runtime edge conservé

interface CreateSessionRequestBody { //
  workflow?: { id?: string | null } | null;
  workflowId?: string | null;
  chatkit_configuration?: {
    file_upload?: {
      enabled?: boolean;
    };
  };
}

const DEFAULT_CHATKIT_BASE = "https://api.openai.com"; //

export async function POST(request: Request): Promise<Response> {
  // Correction clé pour Next.js 15 : `cookies()` est maintenant asynchrone
  const cookieStore = await cookies();

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

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error("Auth Error in create-session:", sessionError?.message || "No active session");
    return NextResponse.json({ error: 'Unauthorized - No active session' }, { status: 401 });
  }

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
        userId: session.user.id,
        resolvedWorkflowId,
      });
    }

    if (!resolvedWorkflowId) {
       console.error("Missing workflow id in request or config");
      return NextResponse.json({ error: "Missing workflow id" }, { status: 400 });
    }

    const apiBase = process.env.CHATKIT_API_BASE ?? DEFAULT_CHATKIT_BASE;
    const url = `${apiBase}/v1/chatkit/sessions`;
    const upstreamResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
        "OpenAI-Beta": "chatkit_beta=v1",
      },
      body: JSON.stringify({
        workflow: { id: resolvedWorkflowId },
        chatkit_configuration: {
          file_upload: { enabled: parsedBody?.chatkit_configuration?.file_upload?.enabled ?? true },
        },
      }),
    });

    const upstreamJson = (await upstreamResponse.json().catch(() => ({}))) as Record<string, unknown> | undefined;

    if (!upstreamResponse.ok) {
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

// Handler GET (renvoie 405)
export async function GET(): Promise<Response> {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405, headers: { Allow: "POST" } });
}

// Helpers (inchangés)
async function safeParseJson<T>(req: Request): Promise<T | null> {
    try { const text = await req.text(); return text ? (JSON.parse(text) as T) : null; } catch { return null; }
}
function extractUpstreamError(payload: Record<string, unknown> | undefined): string | null {
    if (!payload) return null; const error = payload.error as any; if (typeof error === 'string') return error; if (typeof error?.message === 'string') return error.message; const details = payload.details as any; if (typeof details === 'string') return details; if (typeof details?.error === 'string') return details.error; if (typeof details?.error?.message === 'string') return details.error.message; if (typeof payload.message === 'string') return payload.message; return null;
}
// aidejuridic-forgemini/app/api/create-session/route.ts
import { type CookieOptions, createServerClient } from '@supabase/ssr'; // Utilisation de @supabase/ssr
import { cookies } from 'next/headers'; // Nécessaire pour @supabase/ssr
import { NextResponse } from 'next/server';
import { WORKFLOW_ID } from "@/lib/config"; //

export const runtime = "edge"; // Runtime edge conservé

// Interface pour le corps de la requête (inchangée)
interface CreateSessionRequestBody {
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
  // Le check 'if (request.method !== "POST")' a été retiré (redondant)

  // --- Configuration Supabase avec @supabase/ssr pour le runtime Edge ---
  // !!!!! Correction clé : await cookies() !!!!!
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Utilisation de ?? '' pour retourner une chaîne vide si le cookie est absent
          return cookieStore.get(name)?.value ?? '';
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error("Failed to set cookie in edge runtime:", error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
             // Modification : passer value: '' et expires: new Date(0) n'est plus nécessaire avec set direct
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
             console.error("Failed to remove cookie in edge runtime:", error);
          }
        },
      },
    }
  );
  // --- Fin Configuration Supabase ---

  // Vérification de la session utilisateur Supabase
  // Aucun changement nécessaire ici, l'appel était déjà correct
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // Si pas de session valide, refuser l'accès
  if (sessionError || !session) {
    console.error("Auth Error in create-session:", sessionError?.message || "No active session");
    // Header Content-Type géré par NextResponse.json
    return NextResponse.json({ error: 'Unauthorized - No active session' }, { status: 401 });
  }

  // Début de la logique principale
  try {
    // Vérification de la clé API OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY; //
    if (!openaiApiKey) {
      console.error("Missing OPENAI_API_KEY environment variable");
      return NextResponse.json(
        { error: "Server configuration error: Missing API Key" },
        { status: 500 } // Header Content-Type géré par NextResponse.json
      );
    }

    // Analyse du corps de la requête
    const parsedBody = await safeParseJson<CreateSessionRequestBody>(request); //
    const resolvedWorkflowId =
      parsedBody?.workflow?.id ?? parsedBody?.workflowId ?? WORKFLOW_ID; //

    // Log simplifié en développement
    if (process.env.NODE_ENV !== "production") {
      console.info("[create-session] handling request for authenticated user", {
        userId: session.user.id,
        resolvedWorkflowId, // Garde l'essentiel
      });
    }

    // Vérification de l'ID de workflow
    if (!resolvedWorkflowId) {
       console.error("Missing workflow id in request or config");
      return NextResponse.json(
        { error: "Missing workflow id" },
        { status: 400 } // Header Content-Type géré par NextResponse.json
      );
    }

    // Appel à l'API ChatKit
    const apiBase = process.env.CHATKIT_API_BASE ?? DEFAULT_CHATKIT_BASE; //
    const url = `${apiBase}/v1/chatkit/sessions`;
    const upstreamResponse = await fetch(url, { //
      method: "POST",
      headers: { //
        "Content-Type": "application/json", // Ce header EST nécessaire pour le fetch
        Authorization: `Bearer ${openaiApiKey}`,
        "OpenAI-Beta": "chatkit_beta=v1", // Conservé
      },
      body: JSON.stringify({ //
        workflow: { id: resolvedWorkflowId },
        // user: session.user.id, // Toujours décommenté pour l'instant
        chatkit_configuration: {
          file_upload: {
            enabled:
              parsedBody?.chatkit_configuration?.file_upload?.enabled ?? true,
          },
        },
      }),
    });

    // Log de la réponse ChatKit
    if (process.env.NODE_ENV !== "production") {
      console.info("[create-session] upstream response", {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
      });
    }

    // Traitement de la réponse ChatKit
    const upstreamJson = (await upstreamResponse.json().catch(() => ({}))) as
      | Record<string, unknown>
      | undefined;

    // Gestion des erreurs de l'API ChatKit
    if (!upstreamResponse.ok) {
      const upstreamError = extractUpstreamError(upstreamJson); //
      console.error("OpenAI ChatKit session creation failed", {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        body: upstreamJson,
      });
      return NextResponse.json(
        {
          error:
            upstreamError ??
            `Failed to create session: ${upstreamResponse.statusText}`,
          details: upstreamJson,
        },
        { status: upstreamResponse.status } // Header Content-Type géré par NextResponse.json
      );
    }

    // Extraction des informations de session ChatKit
    const clientSecret = upstreamJson?.client_secret ?? null; //
    const expiresAfter = upstreamJson?.expires_after ?? null; //

    if (!clientSecret) {
        console.error("Missing client_secret in upstream response");
        return NextResponse.json(
            { error: "Failed to initialize session: Missing client secret" },
            { status: 500 }
        );
    }

    const responsePayload = { //
      client_secret: clientSecret,
      expires_after: expiresAfter,
    };

    // Retourner la réponse OK
    return NextResponse.json(responsePayload, { status: 200 }); // Header Content-Type géré par NextResponse.json

  } catch (error) {
    // Gestion des erreurs inattendues
    console.error("Create session unexpected error", error);
    const errorMessage = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      { error: "Unexpected server error", details: errorMessage },
      { status: 500 }
    );
  }
}

// Handler GET (renvoie 405)
export async function GET(): Promise<Response> { //
  return methodNotAllowedResponse();
}

// Optionnel: Handler OPTIONS pour CORS si nécessaire
/*
export async function OPTIONS() {
  // Logique CORS ici si besoin
  return new Response(null, {
    status: 204, // No Content
    headers: {
      "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*", // Configurer l'origine autorisée
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, OpenAI-Beta",
      "Access-Control-Max-Age": "86400", // Cache preflight for 1 day
    },
  });
}
*/

// Helper pour réponse 405 Method Not Allowed
function methodNotAllowedResponse(): Response {
   return NextResponse.json(
      { error: "Method Not Allowed" },
      // Header Content-Type géré par NextResponse.json
      // Ajout de l'en-tête Allow pour indiquer les méthodes acceptées
      { status: 405, headers: { "Allow": "POST" } }
  );
}

// Helper pour parser le JSON (inchangé)
async function safeParseJson<T>(req: Request): Promise<T | null> {
  try {
    const text = await req.text();
    if (!text) {
      return null;
    }
    return JSON.parse(text) as T;
  } catch (e){
    console.warn("Failed to parse request body as JSON", e);
    return null;
  }
}

// Helper pour extraire l'erreur upstream (inchangé)
function extractUpstreamError(
  payload: Record<string, unknown> | undefined
): string | null {
    if (!payload) {
        return null;
    }
    const error = payload.error;
    if (typeof error === "string") {
        return error;
    }
    if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
    ) {
        return (error as { message: string }).message;
    }
    const details = payload.details;
    if (typeof details === "string") {
        return details;
    }
    if (details && typeof details === "object" && "error" in details) {
        const nestedError = (details as { error?: unknown }).error;
        if (typeof nestedError === "string") {
        return nestedError;
        }
        if (
        nestedError &&
        typeof nestedError === "object" &&
        "message" in nestedError &&
        typeof (nestedError as { message?: unknown }).message === "string"
        ) {
        return (nestedError as { message: string }).message;
        }
    }
    if (typeof payload.message === "string") {
        return payload.message;
    }
    return null;
}
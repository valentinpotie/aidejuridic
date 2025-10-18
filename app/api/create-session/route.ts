// app/api/create-session/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Importez ceci
import { cookies } from 'next/headers'; // Importez ceci
import { NextResponse } from 'next/server'; // Importez ceci
import { WORKFLOW_ID } from "@/lib/config";

export const runtime = "edge"; // Gardez ceci

// Interface pour le corps de la requête, reste inchangée
interface CreateSessionRequestBody {
  workflow?: { id?: string | null } | null;
  scope?: { user_id?: string | null } | null; // Note: ChatKit n'utilise peut-être pas scope.user_id
  workflowId?: string | null;
  chatkit_configuration?: {
    file_upload?: {
      enabled?: boolean;
    };
  };
}

const DEFAULT_CHATKIT_BASE = "https://api.openai.com";
// Les constantes de cookies ne sont plus nécessaires pour l'ID utilisateur
// const SESSION_COOKIE_NAME = "chatkit_session_id";
// const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(request: Request): Promise<Response> {
  // Vérification de la méthode POST reste la même
  if (request.method !== "POST") {
    return methodNotAllowedResponse();
  }

  // --- Début de l'ajout Supabase ---
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Vérifier la session utilisateur Supabase
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // Si pas de session valide, refuser l'accès
  if (sessionError || !session) {
    console.error("Auth Error in create-session:", sessionError?.message || "No active session");
    return NextResponse.json({ error: 'Unauthorized - No active session' }, { status: 401 });
  }
  // --- Fin de l'ajout Supabase ---

  // Début de la logique existante (adaptée)
  try {
    // Vérification de la clé API OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error("Missing OPENAI_API_KEY environment variable");
      return NextResponse.json(
        { error: "Server configuration error: Missing API Key" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Analyse du corps de la requête
    const parsedBody = await safeParseJson<CreateSessionRequestBody>(request);
    const resolvedWorkflowId =
      parsedBody?.workflow?.id ?? parsedBody?.workflowId ?? WORKFLOW_ID;

    // Log en développement
    if (process.env.NODE_ENV !== "production") {
      console.info("[create-session] handling request for authenticated user", {
        userId: session.user.id, // Log de l'ID utilisateur Supabase
        resolvedWorkflowId,
        body: JSON.stringify(parsedBody),
      });
    }

    // Vérification de l'ID de workflow
    if (!resolvedWorkflowId) {
       console.error("Missing workflow id in request or config");
      return NextResponse.json(
        { error: "Missing workflow id" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Appel à l'API ChatKit
    const apiBase = process.env.CHATKIT_API_BASE ?? DEFAULT_CHATKIT_BASE;
    const url = `${apiBase}/v1/chatkit/sessions`;
    const upstreamResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
        "OpenAI-Beta": "chatkit_beta=v1",
      },
      // Note: On n'envoie plus `user: userId` car ChatKit gère l'utilisateur via la session authentifiée.
      // Si ChatKit *nécessite* un identifiant stable, vous pourriez passer session.user.id ici:
      // user: session.user.id,
      body: JSON.stringify({
        workflow: { id: resolvedWorkflowId },
        chatkit_configuration: {
          file_upload: {
            enabled:
              parsedBody?.chatkit_configuration?.file_upload?.enabled ?? true, // Activer par défaut pour les utilisateurs connectés
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
      const upstreamError = extractUpstreamError(upstreamJson);
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
        { status: upstreamResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extraction des informations de session ChatKit
    const clientSecret = upstreamJson?.client_secret ?? null;
    const expiresAfter = upstreamJson?.expires_after ?? null;

    if (!clientSecret) {
        console.error("Missing client_secret in upstream response");
        return NextResponse.json(
            { error: "Failed to initialize session: Missing client secret" },
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    const responsePayload = {
      client_secret: clientSecret,
      expires_after: expiresAfter,
    };

    // Retourner la réponse avec le client_secret
    return NextResponse.json(
      responsePayload,
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    // Gestion des erreurs inattendues
    console.error("Create session unexpected error", error);
    const errorMessage = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      { error: "Unexpected server error", details: errorMessage },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// La fonction GET reste la même (ou peut être supprimée si non nécessaire)
export async function GET(): Promise<Response> {
  return methodNotAllowedResponse();
}

// Helper pour réponse 405 Method Not Allowed (utilisant NextResponse)
function methodNotAllowedResponse(): Response {
  return NextResponse.json(
      { error: "Method Not Allowed" },
      { status: 405, headers: { "Content-Type": "application/json", "Allow": "POST" } }
  );
}

// Helper pour parser le JSON (reste inchangé)
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

// Helper pour extraire l'erreur de la réponse upstream (reste inchangé)
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

// Les fonctions resolveUserId, getCookieValue, serializeSessionCookie, buildJsonResponse
// ne sont plus nécessaires car l'authentification est gérée par Supabase et les réponses par NextResponse.
// Vous pouvez les supprimer.
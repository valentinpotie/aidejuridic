import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Créer un client Supabase pour le middleware en utilisant @supabase/ssr
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Mettre à jour les cookies dans la requête pour les appels suivants dans la chaîne
          req.cookies.set({ name, value, ...options });
          // Mettre à jour les cookies dans la réponse pour le navigateur
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // Mettre à jour les cookies dans la requête
          req.cookies.set({ name, value: '', ...options });
          // Mettre à jour les cookies dans la réponse
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Rafraîchit la session si elle a expiré (important)
  const { data: { session } } = await supabase.auth.getSession();

  const isAuthPage = req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup';
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/chat') || req.nextUrl.pathname === '/'; // Ajout de la racine comme route protégée

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une page protégée
  if (!session && isProtectedRoute) {
    // Redirige vers la page de connexion
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Si l'utilisateur est connecté et essaie d'accéder aux pages de login/signup
  if (session && isAuthPage) {
    // Redirige vers la page de chat (ou la racine si vous préférez)
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/chat'; // Ou '/' si c'est la destination principale après connexion
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Mettre à jour le matcher pour inclure la racine et potentiellement exclure les assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // Inclure explicitement les routes à gérer si le pattern ci-dessus est trop large
    // '/',
    // '/chat/:path*',
    // '/login',
    // '/signup',
  ],
};
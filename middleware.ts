import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Rafraîchit la session si elle a expiré (important)
  const { data: { session } } = await supabase.auth.getSession();

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une page protégée
  // (ici, on protège tout sauf les pages d'auth et la racine)
  if (!session && req.nextUrl.pathname.startsWith('/chat')) {
    // Redirige vers la page de connexion
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Si l'utilisateur est connecté et essaie d'accéder aux pages de login/signup
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    // Redirige vers la page de chat
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/chat';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Configurez le matcher pour qu'il s'exécute sur les routes que vous voulez
export const config = {
  matcher: [
    '/chat/:path*', // Protège votre page de chat
    '/login',
    '/signup',
  ],
};
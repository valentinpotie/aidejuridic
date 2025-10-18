// aidejuridic/app/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import App from './App'; // Votre composant principal qui contient ChatKitPanel

export default async function Home() {
  // Correction clé pour Next.js 15 : cookies() est maintenant asynchrone
  const cookieStore = await cookies();

  // Utilisation de createServerClient de @supabase/ssr, adapté pour les Server Components
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Fonctions set/remove ajoutées pour la complétude, même si non strictement nécessaires ici
        set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Gérer l'erreur si nécessaire (ignorer dans les Server Components si middleware gère la session)
            }
        },
        remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // Gérer l'erreur si nécessaire
            }
        },
      },
    }
  );

  // Récupération de la session sur le serveur
  const { data: { session } } = await supabase.auth.getSession();

  // Si l'utilisateur n'est pas connecté, redirection vers la page de connexion
  if (!session) {
    redirect('/login');
  }

  // Si la session est valide, affiche l'interface du chat
  return <App />;
}
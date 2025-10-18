// components/login-form.tsx
"use client";

import { useState } from "react";
// Remplacer l'import de createClientComponentClient par createBrowserClient
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator, // FieldSeparator n'est pas utilisé ici, mais l'import reste
} from "@/components/ui/field";

// Créer le client Supabase pour les composants client en dehors du composant
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
    } else {
      // Redirection après succès
      // Vérifier s'il y a une URL de redirection dans les paramètres de recherche
      const redirectUrl = searchParams.get('redirectedFrom') || '/chat'; // '/chat' par défaut
      router.push(redirectUrl);
      router.refresh(); // Important pour rafraîchir la session côté serveur/middleware
    }
  };

  return (
    <form
      onSubmit={handleSignIn}
      className={cn("w-full max-w-sm flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Sign in to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email and password below to sign in
          </p>
        </div>
        <Field>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </Field>
        <Field>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {/* Optionnel: lien "Mot de passe oublié ?" */}
          {/* <FieldDescription className="text-right">
            <a href="#" className="underline underline-offset-4 text-sm">
              Forgot password?
            </a>
          </FieldDescription> */}
        </Field>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </Field>
        {/* Optionnel: Séparateur et connexion via des fournisseurs OAuth */}
        {/* <FieldSeparator>or continue with</FieldSeparator>
        <Field>
          <Button variant="outline" className="w-full" type="button" disabled={loading}>
            GitHub
          </Button>
        </Field> */}
        <FieldDescription className="text-center">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="underline underline-offset-4">
            Sign up
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
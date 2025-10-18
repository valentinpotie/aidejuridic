// aidejuridic/components/login-form.tsx
"use client"; // Important !

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Assurez-vous d'avoir Label, pas seulement FieldLabel
import {
  Field,
  FieldGroup,
  FieldSeparator,
  FieldDescription,
} from "@/components/ui/field"; // Vos composants de structure

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Optionnel : pour l'état de chargement
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogin = async (e: React.FormEvent) => {
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
      // Rafraîchir la page redirigera l'utilisateur
      // si le middleware (étape 6) est en place.
      router.refresh();
      // Ou rediriger manuellement si nécessaire :
      // router.push('/chat');
    }
  };

  // Le JSX reste très similaire à votre fichier existant,
  // mais on ajoute les `onChange`, `value`, `onSubmit` et l'affichage des erreurs.
  return (
    <form onSubmit={handleLogin} className={cn("flex flex-col gap-6", className)} {...props}>
        <FieldGroup>
            <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Login to your account</h1>
            <p className="text-muted-foreground text-sm text-balance">
                Enter your email below to login to your account
            </p>
            </div>
            <Field>
                {/* Utilisez Label de @radix-ui/react-label importé via components/ui/label */}
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
                <div className="flex items-center">
                    <Label htmlFor="password">Password</Label> {/* Utilisez Label */}
                    {/* <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
                    Forgot your password?
                    </a> */}
                </div>
                <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                />
            </Field>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Field>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </Button>
            </Field>
             {/* Le reste (Separator, bouton GitHub, lien Sign up) peut rester */}
             {/* TODO: Implémenter la logique pour le bouton GitHub (signInWithOAuth) */}
             {/* TODO: Changer le lien Sign up pour pointer vers /signup */}
            <FieldSeparator>Or continue with</FieldSeparator>
            <Field>
                {/* ... bouton GitHub ... */}
                 <Button variant="outline" type="button" disabled={loading}>
                    Login with GitHub
                </Button>
                <FieldDescription className="text-center">
                    Don&apos;t have an account?{" "}
                    {/* Mettre à jour ce lien */}
                    <a href="/signup" className="underline underline-offset-4">
                    Sign up
                    </a>
                </FieldDescription>
            </Field>
        </FieldGroup>
    </form>
  );
}
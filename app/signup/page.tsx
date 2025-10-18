// components/signup-form.tsx // Le commentaire est peut-être incorrect, le fichier est app/signup/page.tsx
"use client";

import { useState } from "react";
// Remplacer l'import de createClientComponentClient par createBrowserClient
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
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

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // Utiliser l'instance supabase créée ci-dessus
  // const supabase = createClientComponentClient(); // Supprimer cette ligne

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Vous pouvez ajouter des données ici si nécessaire, et les gérer
        // dans un trigger Supabase ou après la confirmation de l'e-mail.
        // data: { full_name: name },
        // Important: Spécifiez l'URL de redirection après confirmation de l'e-mail
        // emailRedirectTo: `${location.origin}/auth/callback` // Exemple
      }
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
    } else {
      // Afficher un message indiquant à l'utilisateur de vérifier son e-mail
      setMessage("Inscription réussie ! Veuillez vérifier votre e-mail pour confirmer votre compte.");
      // Optionnel: rediriger vers une page "vérifiez votre e-mail" ou "/login"
      // router.push('/login?message=check-email');
    }
  };

  return (
    <form
      onSubmit={handleSignUp}
      className={cn("w-full max-w-sm flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to create your account
          </p>
        </div>
        {/* Champ Nom - optionnel si vous ne le passez pas dans signUp */}
        <Field>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </Field>
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
          <FieldDescription>
            Must be at least 6 characters long.
          </FieldDescription>
        </Field>
        <Field>
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </Field>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-green-500">{message}</p>}
        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </Field>
          <FieldDescription className="text-center">
            Already have an account?{' '}
            <a href="/login" className="underline underline-offset-4">
              Sign in
            </a>
          </FieldDescription>
      </FieldGroup>
    </form>
  );
}

// Puisque le composant SignUpForm est exporté, la page doit l'utiliser.
// Si ce fichier est VRAIMENT app/signup/page.tsx, il devrait ressembler à ça :
export default function SignUpPage() {
  // Optionnellement, vous pouvez ajouter d'autres éléments de mise en page ici
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUpForm />
    </div>
  );
}
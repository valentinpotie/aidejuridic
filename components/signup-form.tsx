// components/signup-form.tsx
"use client"; // Important pour utiliser les hooks React et Supabase côté client

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Importez Label
import {
  Field,
  FieldDescription,
  FieldGroup,
  // FieldLabel n'est pas utilisé directement si Label est utilisé
  FieldSeparator,
} from "@/components/ui/field";

export function SignUpForm({ // Renommé en SignUpForm
  className,
  ...props
}: React.ComponentProps<"form">) {
  // États pour les champs du formulaire, l'erreur et le chargement
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null); // Pour les messages de succès (ex: confirmation email)
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Vérification simple de la confirmation du mot de passe
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    // Appel à Supabase pour l'inscription
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Vous pouvez passer des données supplémentaires ici si nécessaire
        // data: { full_name: name } // Assurez-vous que votre table `profiles` ou `users` a une colonne `full_name`
        // Ou gérer la mise à jour du profil après l'inscription
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
    } else {
      // Afficher un message indiquant de vérifier l'e-mail pour confirmation
      // C'est le comportement par défaut de Supabase Auth
      setMessage("Inscription réussie ! Veuillez vérifier votre e-mail pour confirmer votre compte.");
      // Optionnel : rediriger après un délai ou laisser l'utilisateur sur la page
      // router.push('/login'); // Rediriger vers la page de connexion
      // router.refresh(); // Ou rafraîchir pour que le middleware gère la redirection si déjà connecté
    }
  };

  return (
    // Attacher la fonction handleSignUp à l'événement onSubmit
    <form onSubmit={handleSignUp} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to create your account
          </p>
        </div>
        {/* Champ Nom Complet (Optionnel, dépend de votre logique) */}
        <Field>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            // required // Décommentez si nécessaire
          />
        </Field>
        {/* Champ Email */}
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
          {/* <FieldDescription>
            We&apos;ll use this to contact you. We will not share your email
            with anyone else.
          </FieldDescription> */}
        </Field>
        {/* Champ Mot de passe */}
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
            Must be at least 6 characters long. {/* Supabase impose 6 caractères min par défaut */}
          </FieldDescription>
        </Field>
        {/* Champ Confirmation Mot de passe */}
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
          {/* <FieldDescription>Please confirm your password.</FieldDescription> */}
        </Field>
        {/* Affichage des erreurs ou messages */}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-green-500">{message}</p>}
        {/* Bouton de création de compte */}
        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </Field>
        {/* Séparateur et autres méthodes (ex: GitHub) */}
        {/* <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button variant="outline" type="button" disabled={loading}>
            Sign up with GitHub
          </Button> */}
          <FieldDescription className="px-6 text-center">
            Already have an account?{' '}
            {/* Lien vers la page de connexion */}
            <a href="/login" className="underline underline-offset-4">
              Sign in
            </a>
          </FieldDescription>
        {/* </Field> */}
      </FieldGroup>
    </form>
  );
}
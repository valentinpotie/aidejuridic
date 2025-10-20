"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Field,
  FieldDescription,
  FieldGroup,
  // FieldSeparator, // garde-le commenté si pas utilisé
} from "@/components/ui/field";

// même pattern que login: export nommé
export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // créer le client comme dans login
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);

    if (pwd !== pwd2) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: pwd,
      // options: {
      //   data: { full_name: fullName },
      //   emailRedirectTo: `${location.origin}/auth/callback`,
      // },
    });
    setLoading(false);

    if (signUpError) setError(signUpError.message);
    else setMsg("Inscription réussie. Vérifie ton e-mail pour confirmer.");
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn("w-full max-w-sm flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Créez votre compte</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Remplissez le formulaire ci-dessous pour créer votre compte
          </p>
        </div>

        <Field>
          <Label htmlFor="name">Nom complet</Label>
          <Input
            id="name"
            type="text"
            placeholder="Jean Dupont"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
          />
        </Field>

        <Field>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nom@exemple.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </Field>

        <Field>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            required
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            disabled={loading}
          />
          <FieldDescription>Doit contenir au moins 6 caractères.</FieldDescription>
        </Field>

        <Field>
          <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
          <Input
            id="confirm-password"
            type="password"
            required
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
            disabled={loading}
          />
        </Field>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {msg && <p className="text-sm text-green-600">{msg}</p>}

        <Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Création du compte..." : "Créer un compte"}
          </Button>
        </Field>

        <FieldDescription className="text-center">
          Vous avez déjà un compte ?{" "}
          <a href="/login" className="underline underline-offset-4">
            Se connecter
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
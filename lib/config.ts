// aidejuridic/lib/config.ts

// Types locaux minimalistes (suffisants pour ton usage actuel)
export type ColorScheme = "light" | "dark";

export type StartScreenPrompt = {
  // ChatKit accepte généralement une étiquette + le prompt envoyé au chat
  label?: string;       // texte affiché (facultatif)
  name?: string;        // alias alternatif (facultatif)
  title?: string;       // alias alternatif (facultatif)
  prompt: string;       // contenu à insérer dans l'input
  icon?: string;        // ex: "circle-question" (facultatif)
};

export type ThemeOption = {
  color?: {
    grayscale?: { hue?: number; tint?: number; shade?: number };
    accent?: { primary?: string; level?: number };
  };
  radius?: "none" | "sm" | "md" | "lg" | "round";
  density?: "compact" | "normal" | "comfortable";
  typography?: { fontFamily?: string };
  // ajoute d'autres clés si tu en as besoin plus tard
};

// IDs & endpoints
export const WORKFLOW_ID = (process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID || "").trim();

export const CREATE_SESSION_ENDPOINT = "/api/create-session";

// Prompts d’exemple
export const STARTER_PROMPTS: StartScreenPrompt[] = [
  {
    label: "Quels arrêts traitent du défaut de base légale ?",
    prompt: "Quels arrêts traitent du défaut de base légale ?",
    icon: "circle-question",
  },
  {
    label: "Trouve-moi les arrêts récents sur la rupture du contrat de travail",
    prompt: "Trouve-moi les arrêts récents sur la rupture du contrat de travail",
    icon: "circle-question",
  },
];

// Wording
export const PLACEHOLDER_INPUT = "Posez votre question juridique...";
export const GREETING = "Recherchez dans la jurisprudence";

// Thème utilitaire
export const getThemeConfig = (theme: ColorScheme): ThemeOption => ({
  color: {
    grayscale: {
      hue: 220,
      tint: 6,
      shade: theme === "dark" ? -1 : -4,
    },
    accent: {
      primary: theme === "dark" ? "#f1f5f9" : "#0f172a",
      level: 1,
    },
  },
  radius: "round",
  // Ajoute ici d'autres options (density, typography...) si besoin
});
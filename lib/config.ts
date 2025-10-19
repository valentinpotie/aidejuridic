import { ColorScheme, StartScreenPrompt, ThemeOption } from "@openai/chatkit";

export const WORKFLOW_ID =
  process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID?.trim() ?? "";

export const CREATE_SESSION_ENDPOINT = "/api/create-session";

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

export const PLACEHOLDER_INPUT = "Posez votre question juridique...";

export const GREETING = "Recherchez dans la jurisprudence";

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
  // Add other theme options here
  // chatkit.studio/playground to explore config options
});

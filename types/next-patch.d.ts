// types/next-patch.d.ts
declare module "next/types.js" {
    // Ré-exporte les types internes que Next utilise dans .next/types/*
    export type {
      ResolvingMetadata,
      ResolvingViewport,
    } from "next/dist/lib/metadata/types/metadata-interface.js";
  
    // Optionnel : aligne aussi ces alias
    export type Metadata = import("next").Metadata;
    export type Viewport = import("next").Viewport;
  }
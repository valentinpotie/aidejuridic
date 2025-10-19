// aidejuridic/app-sidebar.tsx
"use client";

// 1. Importer useState et useEffect depuis React
import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js"; // <-- Importer le type User

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Données statiques pour les menus (gardées pour l'exemple)
const staticNavData = {
  navMain: [
     // ... (garder les définitions de navMain existantes)
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        { title: "History", url: "#" },
        { title: "Starred", url: "#" },
        { title: "Settings", url: "#" },
      ],
    },
    {
      title: "Models", url: "#", icon: Bot, items: [
        { title: "Genesis", url: "#" }, { title: "Explorer", url: "#" }, { title: "Quantum", url: "#" },
      ]
    },
    {
      title: "Documentation", url: "#", icon: BookOpen, items: [
        { title: "Introduction", url: "#" }, { title: "Get Started", url: "#" }, { title: "Tutorials", url: "#" }, { title: "Changelog", url: "#" },
      ]
    },
    {
      title: "Settings", url: "#", icon: Settings2, items: [
        { title: "General", url: "#" }, { title: "Team", url: "#" }, { title: "Billing", url: "#" }, { title: "Limits", url: "#" },
      ]
    },
  ],
  navSecondary: [
     // ... (garder les définitions de navSecondary existantes)
    { title: "Support", url: "#", icon: LifeBuoy },
    { title: "Feedback", url: "#", icon: Send },
  ],
  projects: [
     // ... (garder les définitions de projects existantes)
    { name: "Design Engineering", url: "#", icon: Frame },
    { name: "Sales & Marketing", url: "#", icon: PieChart },
    { name: "Travel", url: "#", icon: Map },
  ],
};

// Interface pour les données utilisateur simplifiées
interface DisplayUser {
  name: string;
  email: string;
  avatar: string; // Garder l'avatar statique pour l'instant
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();

  // 2. Initialiser l'état pour l'utilisateur
  const [currentUser, setCurrentUser] = useState<DisplayUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true); // État de chargement

  // Initialiser le client Supabase
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 3. Utiliser useEffect pour récupérer l'utilisateur au montage
  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching user:", error);
        setCurrentUser(null); // Ou gérer l'erreur autrement
      } else if (user) {
        setCurrentUser({
          // Utiliser user_metadata.full_name si défini lors de l'inscription, sinon l'email comme nom
          name: user.user_metadata?.full_name || user.email || "Utilisateur",
          email: user.email || "No email",
          avatar: "/placeholder.svg", // Garder un avatar par défaut pour l'instant
        });
      } else {
        setCurrentUser(null); // Pas d'utilisateur connecté
      }
      setLoadingUser(false);
    };

    fetchUser();
    // Écouter les changements d'état d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        // Re-fetcher l'utilisateur si l'état change (connexion/déconnexion)
        fetchUser();
    });

    // Nettoyer l'écouteur lors du démontage
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase.auth, router]); // Ajouter router aux dépendances si utilisé dans fetchUser pour redirection

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null); // Mettre à jour l'état local
    router.push('/login');
    router.refresh();
  };

  // 4. Préparer les données utilisateur à passer (avec fallback)
  const userDataForNav = currentUser ?? {
    name: "Chargement...",
    email: "",
    avatar: "",
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        {/* ... (Menu Header existant) ... */}
         <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Aide Juridic</span>
                  <span className="truncate text-xs"></span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Utiliser les données statiques pour les menus */}
        <NavMain items={staticNavData.navMain} />
        <NavProjects projects={staticNavData.projects} />
        <NavSecondary items={staticNavData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {/* 5. Passer les données utilisateur récupérées (ou le fallback) */}
        {!loadingUser && currentUser ? (
            <NavUser user={userDataForNav} onSignOut={handleSignOut} />
        ) : (
            // Optionnel : Afficher un placeholder pendant le chargement
            <div className="p-2">
                 <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-muted animate-pulse"></div>
                    <div className="flex-1 space-y-1">
                        <div className="h-4 w-3/4 rounded bg-muted animate-pulse"></div>
                        <div className="h-3 w-1/2 rounded bg-muted animate-pulse"></div>
                    </div>
                 </div>
            </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
// aidejuridic/app/chat/page.tsx
"use client";

import App from "../App";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function ChatPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="p-0">
        {/* Header (barre fine) avec le bouton pour toggler la sidebar */}
        <header className="flex h-12 items-center gap-2 border-b px-3">
          <SidebarTrigger />
          <span className="text-sm text-muted-foreground">Chat</span>
        </header>

        {/* Zone principale qui doit remplir tout l’écran */}
        <div className="flex-1 overflow-hidden">
          <App />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
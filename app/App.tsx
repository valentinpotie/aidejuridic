// aidejuridic/app/App.tsx
"use client";

import { useCallback } from "react";
import { ChatKitPanel, type FactAction } from "@/components/ChatKitPanel";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function App() {
  const { scheme, setScheme } = useColorScheme();

  const handleWidgetAction = useCallback(async (action: FactAction) => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[ChatKitPanel] widget action", action);
    }
  }, []);

  const handleResponseEnd = useCallback(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[ChatKitPanel] response end");
    }
  }, []);

  // Removed the <main> tag as SidebarInset typically provides the main content area.
  // Adjusted styling for better fit within SidebarInset.
  return (
    <div className="flex h-full flex-col items-center justify-end bg-slate-100 dark:bg-slate-950 p-4"> {/* Added padding and ensure full height */}
      <div className="mx-auto h-full w-full max-w-5xl"> {/* Ensure container takes full height */}
        <ChatKitPanel
          theme={scheme}
          onWidgetAction={handleWidgetAction}
          onResponseEnd={handleResponseEnd}
          onThemeRequest={setScheme}
        />
      </div>
    </div>
  );
}
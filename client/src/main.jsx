import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App";
import { AuthProvider } from "@/lib/auth";
import { SettingsProvider } from "@/lib/settings";
import { isConfigured } from "@/lib/supabase";
import "./index.css";

function MissingConfig() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-bold">Configuration missing</h1>
        <p className="mt-2 text-muted-foreground">Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local (see .env.example), then rebuild.</p>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {isConfigured ? (
      <BrowserRouter>
        <SettingsProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SettingsProvider>
        <Toaster position="top-center" richColors closeButton />
      </BrowserRouter>
    ) : (
      <MissingConfig />
    )}
  </StrictMode>,
);

import './testEnv';
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Toaster from "./components/ui/toaster"; // default import
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

// Supabase client
import { supabase } from "./lib/supabase"; // Ensure this path is correct

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) return; // Safeguard

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("❌ Supabase session error:", error.message);
        } else {
          console.log("✅ Supabase session:", data.session);
        }
      } catch (err) {
        console.error("❌ Unexpected error:", err);
      }
    };

    checkSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>

        {/* Example div with custom border */}
        <div className="border border-custom p-4 rounded-lg m-4 text-center">
          This div uses the custom border color from CSS variable.
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

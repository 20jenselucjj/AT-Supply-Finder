import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { KitProvider } from "@/context/kit-context";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/context/theme-context";
import { FavoritesProvider } from "@/context/favorites-context";
import ScrollToTop from "@/components/ScrollToTop";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ChatBot from "@/components/chatbot/ChatBot";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import Build from "./pages/Build";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

const App = () => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <FavoritesProvider>
              <KitProvider>
                <TooltipProvider>
                <BrowserRouter>
                  <div className="min-h-screen flex flex-col">
                    <ScrollToTop />
                    <SiteHeader />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/catalog" element={<Catalog />} />
                        <Route path="/build" element={<Build />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <SiteFooter />
                  </div>
                  <ChatBot apiKey={import.meta.env.VITE_GEMINI_API_KEY || ''} />
                  <Toaster />
                  <Sonner />
                </BrowserRouter>
                </TooltipProvider>
              </KitProvider>
            </FavoritesProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
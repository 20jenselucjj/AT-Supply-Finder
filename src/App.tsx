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
import { lazy, Suspense } from "react";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Catalog = lazy(() => import("./pages/Catalog"));
const Build = lazy(() => import("./pages/Build"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminKits = lazy(() => import("./pages/admin/AdminKits"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminMarketing = lazy(() => import("./pages/admin/AdminMarketing"));
// Removed AdminOrders import
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
// New pages
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const AffiliateDisclosure = lazy(() => import("./pages/AffiliateDisclosure"));
const TestSystemSettings = lazy(() => import("./pages/TestSystemSettings"));

import AdminRoute from "./components/layout/AdminRoute";
import { Navigate } from "react-router-dom";
import "./App.css";

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

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
                  <div className="min-h-screen flex flex-col bg-background text-foreground">
                    <ScrollToTop />
                    <SiteHeader />
                    <main className="flex-1">
                      <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/catalog" element={<Catalog />} />
                          <Route path="/build" element={<Build />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/admin" element={
                            <AdminRoute>
                              <Admin />
                            </AdminRoute>
                          }>
                            <Route index element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="dashboard" element={<AdminDashboard />} />
                            <Route path="users" element={<AdminUsers />} />
                            <Route path="products" element={<AdminProducts />} />
                            {/* Removed orders route */}
                            <Route path="analytics" element={<AdminAnalytics />} />
                            <Route path="reports" element={<AdminReports />} />
                            <Route path="marketing" element={<AdminMarketing />} />
                            <Route path="templates" element={<AdminKits />} />
                            <Route path="system" element={<AdminSettings />} />
                          </Route>
                          <Route path="/login" element={<Login />} />
                          <Route path="/forgot-password" element={<ForgotPassword />} />
                          <Route path="/reset-password" element={<ResetPassword />} />
                          {/* New routes */}
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/affiliate-disclosure" element={<AffiliateDisclosure />} />
                          <Route path="/test-system-settings" element={<TestSystemSettings />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
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
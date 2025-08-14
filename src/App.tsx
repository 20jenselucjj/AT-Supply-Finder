import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AnimatePresence } from "framer-motion";
import SiteHeader from "@/components/layout/SiteHeader";
import AnimatedPage from "@/components/layout/AnimatedPage";
import SiteFooter from "@/components/layout/SiteFooter";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AdminRoute from "@/components/layout/AdminRoute";
import { KitProvider } from "./context/kit-context";
import { AuthProvider } from "./context/auth-context";

// Lazy load page components
const Index = React.lazy(() => import("./pages/Index"));
const Catalog = React.lazy(() => import("./pages/Catalog"));
const Build = React.lazy(() => import("./pages/Build"));
const Blog = React.lazy(() => import("./pages/Blog"));
const BlogPost = React.lazy(() => import("./pages/BlogPost"));
const BlogCategory = React.lazy(() => import("./pages/BlogCategory"));
const BlogTag = React.lazy(() => import("./pages/BlogTag"));
const BlogAuthor = React.lazy(() => import("./pages/BlogAuthor"));
const BlogAdmin = React.lazy(() => import("./pages/BlogAdmin"));
const Login = React.lazy(() => import("./pages/Login"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Admin = React.lazy(() => import("./pages/Admin"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();
  return (
    <React.Suspense fallback={<div className="container mx-auto py-10">Loading...</div>}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<AnimatedPage><Index /></AnimatedPage>} />
          <Route path="/catalog" element={<AnimatedPage><Catalog /></AnimatedPage>} />
          <Route path="/build" element={<AnimatedPage><Build /></AnimatedPage>} />
          <Route path="/blog" element={<AnimatedPage><Blog /></AnimatedPage>} />
          <Route path="/blog/category/:category" element={<AnimatedPage><BlogCategory /></AnimatedPage>} />
          <Route path="/blog/tag/:tag" element={<AnimatedPage><BlogTag /></AnimatedPage>} />
          <Route path="/blog/author/:author" element={<AnimatedPage><BlogAuthor /></AnimatedPage>} />
          <Route path="/blog/:slug" element={<AnimatedPage><BlogPost /></AnimatedPage>} />
          <Route path="/blog/admin" element={<AnimatedPage><BlogAdmin /></AnimatedPage>} />
          <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
          <Route path="/forgot-password" element={<AnimatedPage><ForgotPassword /></AnimatedPage>} />
          <Route path="/profile" element={<AnimatedPage><ProtectedRoute><Profile /></ProtectedRoute></AnimatedPage>} />
          <Route path="/admin" element={<AnimatedPage><AdminRoute><Admin /></AdminRoute></AnimatedPage>} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<AnimatedPage><NotFound /></AnimatedPage>} />
        </Routes>
      </AnimatePresence>
    </React.Suspense>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <KitProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SiteHeader />
              {/* Live region for accessibility announcements */}
              <div id="live-region" aria-live="polite" className="sr-only" />
              <AppRoutes />
              <SiteFooter />
            </BrowserRouter>
          </TooltipProvider>
        </KitProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

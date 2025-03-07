import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Editor from "./pages/Editor";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Documents from "./pages/Documents";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Handle session if needed
    });

    // Handle auth callback
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // Get stored redirect path
        const redirectPath = localStorage.getItem('authRedirectPath') || '/dashboard';
        // Clear stored path
        localStorage.removeItem('authRedirectPath');
        // Clear the URL hash and navigate
        window.location.hash = '';
        navigate(redirectPath);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/upload" 
        element={
          <ProtectedRoute>
            <Upload />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/documents" 
        element={
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/editor" 
        element={
          <ProtectedRoute>
            <Editor />
          </ProtectedRoute>
        } 
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

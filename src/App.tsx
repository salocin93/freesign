import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Suspense, lazy, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import Login from './pages/Login';
import Documents from './pages/Documents';
import Upload from './pages/Upload';
import Editor from './pages/Editor';
import SignDocument from '@/pages/SignDocument';
import PrivateRoute from '@/components/PrivateRoute';
import ThankYou from '@/pages/ThankYou';

// Lazy load route components
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const AppContent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Don't automatically navigate on initial session check
      if (!session?.user) {
        // If no session, store the current path for after login
        localStorage.setItem('authRedirectPath', window.location.pathname);
      }
    });

    // Handle auth callback
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // Get stored redirect path
        const redirectPath = localStorage.getItem('authRedirectPath');
        // Only redirect if there's a stored path
        if (redirectPath) {
          // Clear stored path
          localStorage.removeItem('authRedirectPath');
          // Navigate to the stored path
          navigate(redirectPath);
        }
      } else if (event === 'SIGNED_OUT') {
        // Store current path when signing out
        localStorage.setItem('authRedirectPath', window.location.pathname);
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={
        <Suspense fallback={<PageLoader />}>
          <Index />
        </Suspense>
      } />
      <Route path="/login" element={
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/upload" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <Upload />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/documents" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <Documents />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/editor/:id" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <Editor />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/sign/:documentId" element={<SignDocument />} />
      <Route path="/thank-you" element={<ThankYou />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={
        <Suspense fallback={<PageLoader />}>
          <NotFound />
        </Suspense>
      } />
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
          <Router>
            <AppContent />
          </Router>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

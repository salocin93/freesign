/*
MIT License
Copyright (c) 2025 Nicolas Freiherr von Rosen
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
*/

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import DevAnalyticsPanel from "@/components/DevAnalyticsPanel";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Suspense, lazy, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertTriangle } from 'lucide-react';
import { validateProductionEnvironment, formatValidationResults } from '@/utils/productionValidation';
import { env } from '@/utils/env';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Login from './pages/Login';
import Documents from './pages/Documents';
import Upload from './pages/Upload';
import Editor from './pages/Editor';
import SignDocument from '@/pages/SignDocument';
import PrivateRoute from '@/components/PrivateRoute';
import ThankYou from '@/pages/ThankYou';
import CodeOfConduct from '@/pages/CodeOfConduct';

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

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  checks: Record<string, boolean>;
}

// Production validation component
const ProductionValidationScreen = ({ onContinue, onRetry, validationResult }: {
  onContinue: () => void;
  onRetry: () => void;
  validationResult: ValidationResult;
}) => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-background">
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-6 w-6" />
          Production Environment Issues
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-md font-mono text-sm whitespace-pre-line">
          {formatValidationResults(validationResult)}
        </div>
        
        <div className="flex gap-2">
          <Button onClick={onRetry} variant="default">
            Retry Validation
          </Button>
          {!validationResult.isValid ? (
            <Button onClick={onContinue} variant="outline">
              Continue Anyway (Not Recommended)
            </Button>
          ) : (
            <Button onClick={onContinue} variant="default">
              Continue
            </Button>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          {validationResult.isValid 
            ? "All checks passed! You can continue safely."
            : "Some checks failed. Please review the issues above before continuing."
          }
        </div>
      </CardContent>
    </Card>
  </div>
);

const AppContent = () => {
  const navigate = useNavigate();
  const [validationState, setValidationState] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    result: ValidationResult | null;
    forceSkip: boolean;
  }>({
    isValidating: env.isProduction,
    isValid: null,
    result: null,
    forceSkip: false,
  });

  // Production validation effect
  useEffect(() => {
    if (env.isProduction && !validationState.forceSkip && validationState.isValid === null) {
      validateProductionEnvironment()
        .then(result => {
          setValidationState(prev => ({
            ...prev,
            isValidating: false,
            isValid: result.isValid,
            result,
          }));
        })
        .catch(error => {
          console.error('Production validation failed:', error);
          setValidationState(prev => ({
            ...prev,
            isValidating: false,
            isValid: false,
            result: {
              isValid: false,
              errors: [`Validation failed: ${error.message}`],
              warnings: [],
              checks: {},
            },
          }));
        });
    }
  }, [validationState.forceSkip, validationState.isValid]);

  // Auth effect
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

  const handleValidationContinue = () => {
    setValidationState(prev => ({ ...prev, forceSkip: true }));
  };

  const handleValidationRetry = () => {
    setValidationState({
      isValidating: true,
      isValid: null,
      result: null,
      forceSkip: false,
    });
  };

  // Show validation screen in production
  if (env.isProduction && !validationState.forceSkip) {
    if (validationState.isValidating) {
      return <PageLoader />;
    }
    
    if (validationState.result && (!validationState.isValid || validationState.result.warnings.length > 0)) {
      return (
        <ProductionValidationScreen
          onContinue={handleValidationContinue}
          onRetry={handleValidationRetry}
          validationResult={validationState.result}
        />
      );
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
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
        <Route path="/test-sign" element={<SignDocument />} />
        <Route path="/code-of-conduct" element={
          <Suspense fallback={<PageLoader />}>
            <CodeOfConduct />
          </Suspense>
        } />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={
          <Suspense fallback={<PageLoader />}>
            <NotFound />
          </Suspense>
        } />
      </Routes>
      <DevAnalyticsPanel />
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary name="App" resetOnPropsChange>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary name="QueryClient" resetOnPropsChange>
          <AuthProvider>
            <ErrorBoundary name="Auth" resetOnPropsChange>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Router>
                  <ErrorBoundary name="Router" resetOnPropsChange>
                    <AnalyticsProvider>
                      <ErrorBoundary name="Analytics" resetOnPropsChange>
                        <AppContent />
                      </ErrorBoundary>
                    </AnalyticsProvider>
                  </ErrorBoundary>
                </Router>
              </TooltipProvider>
            </ErrorBoundary>
          </AuthProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

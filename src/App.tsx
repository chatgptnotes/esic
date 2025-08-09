
import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppRoutes } from "@/components/AppRoutes";
import { useCounts } from "@/hooks/useCounts";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "@/components/Login";
import LandingPage from "@/components/LandingPage";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">The application encountered an error. Please refresh the page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent = () => {
  const { isAuthenticated, login, showLanding, setShowLanding } = useAuth();
  const { toast } = useToast();
  // Always call hooks at the top level; avoid wrapping hooks in try/catch
  const counts = useCounts();

  // Add error boundary / fallback
  if (isAuthenticated === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogin = (credentials: { username: string; password: string }) => {
    const success = login(credentials);
    if (success) {
      toast({
        title: "Welcome!",
        description: `Logged in as ${credentials.username}`,
      });
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive"
      });
    }
  };

  const handleGetStarted = () => {
    localStorage.setItem('hmis_visited', 'true');
    setShowLanding(false);
  };

  const handleLoginClick = () => {
    setShowLanding(false);
  };

  const handleBackToHome = () => {
    setShowLanding(true);
  };

  // Show landing page for first-time visitors
  if (showLanding && !isAuthenticated) {
    return <LandingPage onGetStarted={handleGetStarted} onLoginClick={handleLoginClick} />;
  }

  // Show login page for returning visitors or after "Get Started"
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} onBackToHome={handleBackToHome} />;
  }

  return (
    <BrowserRouter>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar {...counts} />
          <main className="flex-1">
            <div className="p-2">
              <SidebarTrigger />
            </div>
            <AppRoutes />
          </main>
        </div>
      </SidebarProvider>
    </BrowserRouter>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading application...</p>
              </div>
            </div>
          }>
            <Toaster />
            <Sonner />
            <AppContent />
          </Suspense>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = "/YourStop/auth",
  fallback 
}: AuthGuardProps) {
  const { user, loading } = useCustomerAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        navigate(redirectTo);
      } else if (!requireAuth && user) {
        navigate("/YourStop");
      }
    }
  }, [user, loading, requireAuth, redirectTo, navigate]);

  // Show loading state
  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show content based on auth requirements
  if (requireAuth && !user) {
    return fallback || null;
  }

  if (!requireAuth && user) {
    return fallback || null;
  }

  return <>{children}</>;
}

// Higher-order component for protecting pages
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthGuardProps, 'children'> = {}
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}
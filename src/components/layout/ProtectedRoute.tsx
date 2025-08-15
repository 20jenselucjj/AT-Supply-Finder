import { useAuth } from '@/context/auth-context';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    // Give more time for authentication to initialize on page refresh
    const initTimer = setTimeout(() => {
      setInitialLoad(false);
    }, 1000); // Increased delay for better reliability

    return () => clearTimeout(initTimer);
  }, []);

  useEffect(() => {
    if (!loading && !user && !initialLoad) {
      // Add a delay to prevent immediate redirect on page refresh
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 300);

      return () => clearTimeout(timer);
    } else if (user) {
      setShouldRedirect(false);
    }
  }, [user, loading, initialLoad]);

  // Show loading spinner while checking authentication or during initial load
  if (loading || initialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user && shouldRedirect) {
    return <Navigate to="/login" replace />;
  }

  // Don't render anything while waiting for redirect decision
  if (!user && !shouldRedirect) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
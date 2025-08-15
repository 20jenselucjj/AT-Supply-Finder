import { useAuth } from '@/context/auth-context';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading, isAdmin, hasCheckedAdmin } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string>('/');
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    // Give more time for authentication and admin check to complete on page refresh
    const initTimer = setTimeout(() => {
      setInitialLoad(false);
    }, 1500); // Longer delay for admin check

    return () => clearTimeout(initTimer);
  }, []);

  useEffect(() => {
    if (!loading && hasCheckedAdmin && !initialLoad) {
      const timer = setTimeout(() => {
        if (!user) {
          if (!hasShownToast) {
            toast.error('Please log in to access admin features');
            setHasShownToast(true);
          }
          setShouldRedirect(true);
          setRedirectPath('/login');
        } else if (!isAdmin) {
          if (!hasShownToast) {
            toast.error('Access denied. Admin privileges required.');
            setHasShownToast(true);
          }
          setShouldRedirect(true);
          setRedirectPath('/');
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [user, loading, isAdmin, hasCheckedAdmin, initialLoad, hasShownToast]);

  // Show loading while checking permissions or during initial load
  if (loading || !hasCheckedAdmin || initialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Verifying admin permissions...</p>
        </div>
      </div>
    );
  }

  // Handle redirects
  if (shouldRedirect) {
    return <Navigate to={redirectPath} replace />;
  }

  // Only render children if user is authenticated and is admin
  if (user && isAdmin) {
    return <>{children}</>;
  }

  return null;
};

export default AdminRoute;
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!loading && !hasChecked) {
      setHasChecked(true);
      
      if (!user) {
        const timer = setTimeout(() => {
          toast.error('You must be logged in to access this page');
          setShouldRedirect(true);
          navigate('/login', { state: { from: location.pathname } });
        }, 200);
        return () => clearTimeout(timer);
      }
      
      if (user && !isAdmin) {
        const timer = setTimeout(() => {
          toast.error('You do not have permission to access the admin area');
          setShouldRedirect(true);
          navigate('/');
        }, 200);
        return () => clearTimeout(timer);
      }
      
      setShouldRedirect(false);
    }
  }, [user, loading, isAdmin, hasChecked, navigate, location.pathname]);

  // Show loading while checking authentication and admin status
  if (loading || !hasChecked || shouldRedirect) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if redirecting or user doesn't have access
  if (!user || !isAdmin || shouldRedirect) {
    return null;
  }

  return <>{children}</>;
};

export default AdminRoute;
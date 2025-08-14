import { useAuth } from '@/context/auth-context';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!loading) {
      setHasChecked(true);
      
      if (!user) {
        // Add a small delay to prevent immediate redirect on page refresh
        const timer = setTimeout(() => {
          setShouldRedirect(true);
          navigate('/login', { state: { from: location.pathname } });
        }, 200);
        
        return () => clearTimeout(timer);
      } else {
        setShouldRedirect(false);
      }
    }
  }, [user, loading, navigate, location.pathname]);

  // Show loading while auth is being checked or during the redirect delay
  if (loading || (!user && !hasChecked) || (!user && hasChecked && !shouldRedirect)) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if redirecting
  if (!user && shouldRedirect) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { account } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { checkAdminStatus } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get the current session to verify OAuth login was successful
        const session = await account.getSession('current');
        
        if (session) {
          // Get user info and check admin status
          const user = await account.get();
          await checkAdminStatus(user.$id);
          
          toast.success('Successfully signed in with Google!');
          navigate('/', { replace: true });
        } else {
          throw new Error('No active session found');
        }
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        toast.error('Failed to complete Google sign in');
        navigate('/login', { replace: true });
      }
    };

    handleOAuthCallback();
  }, [navigate, checkAdminStatus]);

  return (
    <>
      <Helmet>
        <title>Completing Sign In | AT Supply Finder</title>
        <meta name="description" content="Completing your Google sign in..." />
      </Helmet>
      
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-xl font-semibold">Completing your sign in...</h2>
          <p className="text-muted-foreground">Please wait while we verify your Google account.</p>
        </div>
      </div>
    </>
  );
};

export default OAuthCallback;
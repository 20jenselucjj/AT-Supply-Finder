import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { account } from '@/lib/api/appwrite';
import { Eye, EyeOff, Check, X } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract userId and secret from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    const secret = params.get('secret');
    
    if (userId && secret) {
      setUserId(userId);
      setSecret(secret);
    } else {
      toast.error('Invalid or missing reset parameters');
    }
  }, [location]);

  // Real-time password validation
  useEffect(() => {
    if (password) {
      validatePassword(password);
    } else {
      setPasswordErrors([]);
    }
  }, [password]);

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('One number');
    }
    
    setPasswordErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !secret) {
      toast.error('Missing required reset parameters');
      return;
    }

    if (passwordErrors.length > 0) {
      toast.error('Please fix password requirements before continuing');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      // Complete the password recovery with Appwrite
      await account.updateRecovery(
        userId,
        secret,
        password
      );
      
      setSuccess(true);
      toast.success('Password has been reset successfully!');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <>
      <Helmet>
        <title>Reset Password | AT Supply Finder</title>
        <meta name="description" content="Reset your password for your AT Supply Finder account" />
      </Helmet>
      
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              {success 
                ? 'Your password has been reset successfully' 
                : 'Enter your new password below'}
            </CardDescription>
          </CardHeader>
          
          {success ? (
            <CardContent>
              <div className="text-center py-6">
                <div className="mx-auto bg-green-100 dark:bg-green-900/30 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-muted-foreground">
                  Your password has been reset successfully
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  You can now log in with your new password
                </p>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {/* New Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">New Password</Label>
                    <span id="password-requirements" className="text-xs text-muted-foreground">
                      At least 8 characters
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      aria-describedby="password-requirements"
                      className={passwordErrors.length > 0 ? 'border-red-500 dark:border-red-400' : ''}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className={password !== confirmPassword && confirmPassword ? 'border-red-500 dark:border-red-400' : ''}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {password !== confirmPassword && confirmPassword && (
                    <p className="text-sm text-red-500 dark:text-red-400 flex items-center">
                      <X className="h-4 w-4 mr-1" />
                      Passwords do not match
                    </p>
                  )}
                </div>
                
                {/* Password requirements indicator */}
                <div className="space-y-2">
                  <Label>Password Requirements</Label>
                  <div className="text-sm space-y-1">
                    <div className={`flex items-center ${password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {password.length >= 8 ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                      At least 8 characters
                    </div>
                    <div className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {/[A-Z]/.test(password) ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                      One uppercase letter
                    </div>
                    <div className={`flex items-center ${/[a-z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {/[a-z]/.test(password) ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                      One lowercase letter
                    </div>
                    <div className={`flex items-center ${/\d/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {/\d/.test(password) ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                      One number
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  className="w-full" 
                  type="submit" 
                  disabled={loading || passwordErrors.length > 0 || !password || !confirmPassword || password !== confirmPassword}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </CardFooter>
            </form>
          )}
          
          <div className="px-6 pb-6 text-center">
            <Button
              type="button"
              variant="link"
              onClick={handleBackToLogin}
            >
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default ResetPassword;
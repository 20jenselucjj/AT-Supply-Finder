import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Eye, EyeOff, Check, X } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [emailError, setEmailError] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  // Real-time validation
  useEffect(() => {
    if (isSignUp && password) {
      validatePassword(password);
    } else {
      setPasswordErrors([]);
    }
  }, [isSignUp, password]);

  useEffect(() => {
    if (email) {
      validateEmail(email);
    } else {
      setEmailError('');
    }
  }, [email]);

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        // Validate password before submitting
        if (passwordErrors.length > 0) {
          toast.error('Please fix password requirements before continuing');
          setLoading(false);
          return;
        }
        
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast.success('Account created successfully! Please check your email to confirm your account.');
        setIsSignUp(false);
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success('Logged in successfully!');
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      // Enhanced error handling for specific Supabase validation errors
      if (error.message) {
        if (error.message.includes('Password') || error.message.includes('password')) {
          toast.error(`Password error: ${error.message}`);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error(isSignUp ? 'Failed to create account' : 'Failed to log in');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
  <title>{isSignUp ? 'Sign Up' : 'Login'} | AT Supply Finder</title>
        <meta name="description" content={isSignUp ? 'Create a new account' : 'Log in to your account'} />
      </Helmet>
      
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{isSignUp ? 'Create Account' : 'Login'}</CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Enter your details to create an account' 
                : 'Enter your credentials to access your account'}
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={emailError ? 'border-red-500' : ''}
                />
                {emailError && (
                  <p className="text-sm text-red-500 flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    {emailError}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {isSignUp && (
                    <span id="password-requirements" className="text-xs text-muted-foreground">
                      At least 8 characters
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={isSignUp ? 8 : undefined}
                    aria-describedby={isSignUp ? "password-requirements" : undefined}
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
              
              {/* Password requirements indicator for signup */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label>Password Requirements</Label>
                  <div className="text-sm space-y-1">
                    <div className={`flex items-center ${password.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {password.length >= 8 ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                      At least 8 characters
                    </div>
                    <div className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {/[A-Z]/.test(password) ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                      One uppercase letter
                    </div>
                    <div className={`flex items-center ${/[a-z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {/[a-z]/.test(password) ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                      One lowercase letter
                    </div>
                    <div className={`flex items-center ${/\d/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {/\d/.test(password) ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                      One number
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={loading || !email || !password || emailError !== '' || (isSignUp && passwordErrors.length > 0)}>
                {loading ? (
                  <span className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-white animate-ping mr-2"></span>
                    Processing...
                  </span>
                ) : isSignUp ? 'Create Account' : 'Login'}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <Button variant="outline" type="button" disabled={loading} className="w-full">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>
              
              <div className="text-center text-sm">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? 'Login' : 'Sign up'}
                </Button>
              </div>
              
              {!isSignUp && (
                <div className="text-center text-sm">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => navigate('/forgot-password')}
                  >
                    Forgot Password?
                  </Button>
                </div>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
};

export default Login;
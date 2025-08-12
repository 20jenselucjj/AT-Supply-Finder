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
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  // Real-time password validation
  useEffect(() => {
    if (isSignUp && password) {
      validatePassword(password);
    } else {
      setPasswordErrors([]);
    }
  }, [isSignUp, password]);

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    
    setPasswordErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        // Validate password before submitting
        if (password.length < 8) {
          toast.error('Password must be at least 8 characters long');
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
        <title>{isSignUp ? 'Sign Up' : 'Login'} | Wrap Wizard</title>
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
                />
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
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={loading || !email || !password || (isSignUp && password.length < 8)}>
                {loading ? (
                  <span className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-white animate-ping mr-2"></span>
                    Processing...
                  </span>
                ) : isSignUp ? 'Create Account' : 'Login'}
              </Button>
              
              <div className="text-center text-sm">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? 'Login' : 'Sign up'}
                </button>
              </div>
              
              {!isSignUp && (
                <div className="text-center text-sm">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => navigate('/forgot-password')}
                  >
                    Forgot Password?
                  </button>
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
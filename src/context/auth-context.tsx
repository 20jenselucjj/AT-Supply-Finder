import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// Storage keys for persistence
const AUTH_STORAGE_KEY = 'wrap_wizard_auth';
const ADMIN_STORAGE_KEY = 'wrap_wizard_admin';

interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  loading: boolean;
  isAdmin: boolean;
  hasCheckedAdmin: boolean;
  checkAdminStatus: (userId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(() => {
    // Initialize from localStorage if available
    try {
      const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });
  const [hasCheckedAdmin, setHasCheckedAdmin] = useState(false);

  const checkAdminStatus = React.useCallback(async (userId?: string, retryCount = 0) => {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Admin check timeout')), 3000); // 3 second timeout
    });
    
    try {
      await Promise.race([
        (async () => {
          // Use provided userId or get current user
          let authUser;
          if (userId) {
            authUser = { id: userId };
          } else {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            authUser = currentUser;
          }
          
          if (!authUser) {
            console.log('No authenticated user found');
            setIsAdmin(false);
            setHasCheckedAdmin(true);
            return;
          }

          console.log('Checking admin status for user:', authUser.id);

      // Try using the is_admin() function first (more reliable)
      try {
        const { data, error } = await supabase
          .rpc('is_admin');
        
        if (error) {
          console.warn('is_admin() function not available, error:', error.message);
          console.warn('Falling back to table query');
          
          // Fallback to direct table query
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', authUser.id)
            .maybeSingle();
          
          if (roleError) {
            console.error('User roles table query failed:', roleError.message);
            console.error('Full error:', roleError);
            
            // Retry once if it's a network/connection error and we haven't retried yet
            if (retryCount === 0 && (roleError.message.includes('network') || roleError.message.includes('connection'))) {
              console.log('Retrying admin status check due to network error...');
              setTimeout(() => checkAdminStatus(userId, 1), 1000);
              return;
            }
            
            console.log('Setting admin status to false due to error');
            setIsAdmin(false);
            setHasCheckedAdmin(true);
          } else {
          console.log('Role data from table query:', roleData);
          const isAdminUser = roleData?.role === 'admin';
          console.log('Is admin user:', isAdminUser);
          setIsAdmin(isAdminUser);
          // Persist admin status
          localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(isAdminUser));
        }
        } else {
          console.log('is_admin() function result:', data);
          const adminStatus = data === true;
          setIsAdmin(adminStatus);
          // Persist admin status
          localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminStatus));
        }
      } catch (rpcError) {
        console.error('RPC call failed with exception:', rpcError);
        setIsAdmin(false);
      }
      
          setHasCheckedAdmin(true);
        })(),
        timeoutPromise
      ]);
    } catch (error) {
      console.error('Error checking admin status:', error);
      if (error.message === 'Admin check timeout') {
        console.log('Admin check timed out, setting to false');
      }
      setIsAdmin(false);
      setHasCheckedAdmin(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // Check active sessions and sets the user
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        if (mounted) {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // User is authenticated, check admin status
            await checkAdminStatus(session.user.id);
          } else {
            // No session, clear admin status
            setIsAdmin(false);
            setHasCheckedAdmin(false);
            localStorage.removeItem(ADMIN_STORAGE_KEY);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
         await checkAdminStatus(session.user.id);
       } else {
        setIsAdmin(false);
        setHasCheckedAdmin(false);
        localStorage.removeItem(ADMIN_STORAGE_KEY);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAdminStatus]);
  
  // Update window.isAdmin whenever isAdmin state changes
  useEffect(() => {
    Object.defineProperty(window, 'isAdmin', {
      get: () => isAdmin,
      configurable: true
    });
  }, [isAdmin]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    // If sign in successful, check admin status immediately
    if (!error && data.user) {
      await checkAdminStatus(data.user.id);
    }
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setIsAdmin(false);
      setHasCheckedAdmin(false);
      // Clear persisted admin status
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
    return { error };
  };

  const value = {
    user,
    signUp,
    signIn,
    signOut,
    loading,
    isAdmin,
    hasCheckedAdmin,
    checkAdminStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
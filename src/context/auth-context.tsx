import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  loading: boolean;
  isAdmin: boolean;
  checkAdminStatus: () => Promise<void>;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasCheckedAdmin, setHasCheckedAdmin] = useState(false);

  const checkAdminStatus = React.useCallback(async (retryCount = 0) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
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
              setTimeout(() => checkAdminStatus(1), 1000);
              return;
            }
            
            setIsAdmin(false);
          } else {
            console.log('Role data from table query:', roleData);
            const isAdminUser = roleData?.role === 'admin';
            console.log('Is admin user:', isAdminUser);
            setIsAdmin(isAdminUser);
          }
        } else {
          console.log('is_admin() function result:', data);
          setIsAdmin(data === true);
        }
      } catch (rpcError) {
        console.error('RPC call failed with exception:', rpcError);
        setIsAdmin(false);
      }
      
      setHasCheckedAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setHasCheckedAdmin(true);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        await checkAdminStatus();
      } else {
        setIsAdmin(false);
        setHasCheckedAdmin(true);
      }
      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          await checkAdminStatus();
        } else {
          setIsAdmin(false);
          setHasCheckedAdmin(true);
        }
        setLoading(false);
      }
    );

    return () => {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      await checkAdminStatus();
    }
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setIsAdmin(false);
      setHasCheckedAdmin(false);
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
    checkAdminStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
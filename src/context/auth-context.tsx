import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account, databases } from '@/lib/appwrite';
import { Models } from 'appwrite';
import { Query } from 'appwrite';

// Storage keys for persistence
const AUTH_STORAGE_KEY = 'wrap_wizard_auth';
const ADMIN_STORAGE_KEY = 'wrap_wizard_admin';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
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
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
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
            authUser = { $id: userId };
          } else {
            try {
              authUser = await account.get();
            } catch (error) {
              console.log('No authenticated user found');
              setIsAdmin(false);
              setHasCheckedAdmin(true);
              return;
            }
          }
          
          if (!authUser || !authUser.$id) {
            console.log('No valid user found');
            setIsAdmin(false);
            setHasCheckedAdmin(true);
            return;
          }

          console.log('Checking admin status for user:', authUser.$id);

          // Query the user_roles collection in Appwrite using the SDK
          try {
            console.log('Checking admin status for user ID:', authUser.$id);
            const response = await databases.listDocuments(
              import.meta.env.VITE_APPWRITE_DATABASE_ID,
              'userRoles',
              [Query.equal('userId', authUser.$id)]
            );
            
            if (response && response.documents && response.documents.length > 0) {
              const roleData = response.documents[0];
              console.log('Role data from collection query:', roleData);
              const isAdminUser = roleData.role === 'admin';
              console.log('Is admin user:', isAdminUser);
              setIsAdmin(isAdminUser);
              // Persist admin status
              localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(isAdminUser));
            } else {
              console.log('No role data found, setting admin status to false');
              setIsAdmin(false);
              // Persist admin status
              localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(false));
            }
          } catch (error: any) {
            console.error('User roles collection query failed:', error);
            console.error('Error details:', {
              message: error.message,
              code: error.code,
              response: error.response
            });
            
            // Retry once if it's a network/connection error and we haven't retried yet
            if (retryCount === 0 && (error.message.includes('network') || error.message.includes('connection'))) {
              console.log('Retrying admin status check due to network error...');
              setTimeout(() => checkAdminStatus(userId, 1), 1000);
              return;
            }
            
            console.log('Setting admin status to false due to error');
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
        let currentUser = null;
        try {
          currentUser = await account.get();
        } catch (error) {
          // No active session
          console.log('No active session found');
        }
        
        if (mounted) {
          setUser(currentUser ?? null);
          
          if (currentUser) {
            // User is authenticated, check admin status
            await checkAdminStatus(currentUser.$id);
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

    return () => {
      mounted = false;
    };
  }, [checkAdminStatus]);
  
  // Update window.isAdmin whenever isAdmin state changes
  useEffect(() => {
    Object.defineProperty(window, 'isAdmin', {
      get: () => isAdmin,
      configurable: true
    });
  }, [isAdmin]);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Create a new user ID
      const userId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Create the user
      await account.create(userId, email, password, name);
      
      // Create session
      await account.createEmailPasswordSession(email, password);
      
      // Get the newly created user
      const newUser = await account.get();
      setUser(newUser);
      
      // Check admin status for the new user
      await checkAdminStatus(newUser.$id);
      
      return { error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Create session
      await account.createEmailPasswordSession(email, password);
      
      // Get the user
      const authenticatedUser = await account.get();
      setUser(authenticatedUser);
      
      // Check admin status
      await checkAdminStatus(authenticatedUser.$id);
      
      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      setIsAdmin(false);
      setHasCheckedAdmin(false);
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      return { error: null };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { error };
    }
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
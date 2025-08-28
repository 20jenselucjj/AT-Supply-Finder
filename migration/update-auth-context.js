// Script to update authentication context from Supabase to Appwrite
const fs = require('fs');
const path = require('path');

// Path to the auth context file
const authContextPath = path.join(__dirname, '..', 'src', 'context', 'auth-context.tsx');

if (fs.existsSync(authContextPath)) {
  let authContextContent = fs.readFileSync(authContextPath, 'utf8');
  
  // Replace Supabase imports with Appwrite imports
  authContextContent = authContextContent.replace(
    "import { createClient } from '@supabase/supabase-js';",
    "import { account } from '../lib/appwrite';"
  );
  
  // Replace Supabase client initialization
  authContextContent = authContextContent.replace(
    /const supabase = createClient\(import\.meta\.env\.VITE_SUPABASE_URL, import\.meta\.env\.VITE_SUPABASE_ANON_KEY\);/,
    "// Appwrite client is imported from appwrite.ts"
  );
  
  // Replace login function
  authContextContent = authContextContent.replace(
    /const login = async \(email: string, password: string\) => \{[^}]*\}/s,
    `const login = async (email: string, password: string) => {
    try {
      const session = await account.createEmailSession(email, password);
      const user = await account.get();
      setUser(user);
      return { data: { user }, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };`
  );
  
  // Replace signup function
  authContextContent = authContextContent.replace(
    /const signup = async \(email: string, password: string, fullName: string\) => \{[^}]*\}/s,
    `const signup = async (email: string, password: string, fullName: string) => {
    try {
      const userId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await account.create(userId, email, password, fullName);
      const session = await account.createEmailSession(email, password);
      const user = await account.get();
      setUser(user);
      return { data: { user }, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };`
  );
  
  // Replace logout function
  authContextContent = authContextContent.replace(
    /const logout = async \(\) => \{[^}]*\}/s,
    `const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };`
  );
  
  // Replace password reset function
  authContextContent = authContextContent.replace(
    /const resetPassword = async \(email: string\) => \{[^}]*\}/s,
    `const resetPassword = async (email: string) => {
    try {
      // Note: This requires configuring SMTP in Appwrite
      await account.createRecovery(email, \`\${window.location.origin}/reset-password\`);
      return { data: {}, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };`
  );
  
  // Replace updateProfile function
  authContextContent = authContextContent.replace(
    /const updateProfile = async \(updates: any\) => \{[^}]*\}/s,
    `const updateProfile = async (updates: any) => {
    try {
      const user = await account.updateName(updates.full_name || updates.fullName);
      setUser(user);
      return { data: { user }, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };`
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(authContextPath, authContextContent);
  console.log('Updated src/context/auth-context.tsx to use Appwrite');
} else {
  console.log('Auth context file not found. Creating a new one...');
  
  // Create a new auth context file for Appwrite
  const newAuthContextContent = `
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { account } from '../lib/appwrite';
import { Models } from 'appwrite';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, fullName: string) => Promise<any>;
  logout: () => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  updateProfile: (updates: any) => Promise<any>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await account.get();
        setUser(user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const session = await account.createEmailSession(email, password);
      const user = await account.get();
      setUser(user);
      return { data: { user }, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      const userId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await account.create(userId, email, password, fullName);
      const session = await account.createEmailSession(email, password);
      const user = await account.get();
      setUser(user);
      return { data: { user }, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Note: This requires configuring SMTP in Appwrite
      await account.createRecovery(email, \`\${window.location.origin}/reset-password\`);
      return { data: {}, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      const user = await account.updateName(updates.full_name || updates.fullName);
      setUser(user);
      return { data: { user }, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    resetPassword,
    updateProfile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
  `;
  
  fs.writeFileSync(authContextPath, newAuthContextContent);
  console.log('Created new src/context/auth-context.tsx for Appwrite');
}

console.log('\\nNext steps:');
console.log('1. Review the updated auth context to ensure all functions work as expected');
console.log('2. Update any components that use the auth context');
console.log('3. Test authentication flows (login, signup, logout)');
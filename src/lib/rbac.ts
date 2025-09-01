import React from 'react';
import { account, databases } from './appwrite';
import { Query } from 'appwrite'; // Import Query from appwrite

export type UserRole = 'user' | 'editor' | 'admin';

export interface RolePermissions {
  canViewUsers: boolean;
  canManageUsers: boolean;
  canViewProducts: boolean;
  canManageProducts: boolean;
  canViewAnalytics: boolean;
  canManageAnalytics: boolean;
  canViewTemplates: boolean;
  canManageTemplates: boolean;
  canViewSystemSettings: boolean;
  canManageSystemSettings: boolean;
  canViewMarketing: boolean;
  canManageMarketing: boolean;
}

// Define permissions for each role
const rolePermissions: Record<UserRole, RolePermissions> = {
  user: {
    canViewUsers: false,
    canManageUsers: false,
    canViewProducts: false,
    canManageProducts: false,
    canViewAnalytics: false,
    canManageAnalytics: false,
    canViewTemplates: false,
    canManageTemplates: false,
    canViewSystemSettings: false,
    canManageSystemSettings: false,
    canViewMarketing: false,
    canManageMarketing: false
  },
  editor: {
    canViewUsers: true,
    canManageUsers: false,
    canViewProducts: true,
    canManageProducts: true,
    canViewAnalytics: true,
    canManageAnalytics: false,
    canViewTemplates: true,
    canManageTemplates: true,
    canViewSystemSettings: false,
    canManageSystemSettings: false,
    canViewMarketing: true,
    canManageMarketing: true
  },
  admin: {
    canViewUsers: true,
    canManageUsers: true,
    canViewProducts: true,
    canManageProducts: true,
    canViewAnalytics: true,
    canManageAnalytics: true,
    canViewTemplates: true,
    canManageTemplates: true,
    canViewSystemSettings: true,
    canManageSystemSettings: true,
    canViewMarketing: true,
    canManageMarketing: true
  }
};

/**
 * Get user role from the database
 */
export const getUserRole = async (userId: string): Promise<UserRole> => {
  try {
    // Check if userId is valid
    if (!userId) {
      console.warn('No userId provided for role check, defaulting to user');
      return 'user';
    }

    console.log('Getting user role for userId:', userId);
    console.log('Using database ID:', import.meta.env.VITE_APPWRITE_DATABASE_ID);
    console.log('Using collection ID: userRoles');

    // Check the user_roles collection in Appwrite
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'userRoles',
        [Query.equal('userId', userId)] // Use proper Appwrite SDK query syntax
      );
      
      console.log('User role query response:', response);
      
      if (response && response.documents && response.documents.length > 0) {
        const roleData = response.documents[0];
        console.log('Found role data:', roleData);
        const role = (roleData.role as UserRole) || 'user';
        console.log('Returning role:', role);
        return role;
      } else {
        console.log('No role data found for user, returning user role');
      }
    } catch (error) {
      console.error('Error fetching user role from Appwrite:', error);
    }
    
    console.log('Defaulting to user role');
    return 'user'; // Default to user role if error or no role found
  } catch (error) {
    console.error('Error determining user role:', error);
    return 'user'; // Default to user role if error
  }
};

/**
 * Check if user has a specific role
 */
export const hasRole = async (userId: string, role: UserRole): Promise<boolean> => {
  const userRole = await getUserRole(userId);
  
  // Admin has all roles
  if (userRole === 'admin') return true;
  
  // Editor has editor and user roles
  if (userRole === 'editor' && role !== 'admin') return true;
  
  // User only has user role
  return userRole === role;
};

/**
 * Check if user has specific permission
 */
export const hasPermission = async (userId: string, permission: keyof RolePermissions): Promise<boolean> => {
  const userRole = await getUserRole(userId);
  return rolePermissions[userRole][permission];
};

/**
 * Get all permissions for a user
 */
export const getUserPermissions = async (userId: string): Promise<RolePermissions> => {
  const userRole = await getUserRole(userId);
  return rolePermissions[userRole];
};

/**
 * Higher-order component for role-based access control
 */
export const withRoleAccess = (allowedRoles: UserRole[]) => 
  (Component: React.ComponentType<any>) => {
    return (props: any) => {
      // This would be implemented in the component itself
      return React.createElement(Component, props);
    };
  };

/**
 * Check if current user is admin
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    // Get current user
    const user = await account.get();
    if (!user) return false;
    
    // Check if user has admin role
    const userRole = await getUserRole(user.$id);
    return userRole === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Check if current user is editor or admin
 */
export const isCurrentUserEditorOrAdmin = async (): Promise<boolean> => {
  try {
    // Get current user
    const user = await account.get();
    if (!user) return false;
    
    // Check if user has editor or admin role
    const userRole = await getUserRole(user.$id);
    return userRole === 'editor' || userRole === 'admin';
  } catch (error) {
    console.error('Error in isCurrentUserEditorOrAdmin:', error);
    return false;
  }
};
import React from 'react';
import { supabase } from './supabase';

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
    // First try using the is_admin function
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    
    if (!adminError && isAdmin) {
      return 'admin';
    }
    
    // If not admin, check the user_roles table
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user role:', error);
      return 'user'; // Default to user role if error
    }
    
    return (data?.role as UserRole) || 'user';
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
    const { data, error } = await supabase.rpc('is_admin');
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    return data === true;
  } catch (error) {
    console.error('Error in isCurrentUserAdmin:', error);
    return false;
  }
};

/**
 * Check if current user is editor or admin
 */
export const isCurrentUserEditorOrAdmin = async (): Promise<boolean> => {
  try {
    // First check if user is admin
    const isAdmin = await isCurrentUserAdmin();
    if (isAdmin) return true;
    
    // If not admin, check if user has editor role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking editor status:', error);
      return false;
    }
    
    return data?.role === 'editor';
  } catch (error) {
    console.error('Error in isCurrentUserEditorOrAdmin:', error);
    return false;
  }
};
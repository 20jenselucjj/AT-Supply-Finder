import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { getUserRole, UserRole } from '@/lib/rbac';
import { databases, account } from '@/lib/appwrite';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface RoleBasedAccessProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({ 
  allowedRoles, 
  children, 
  fallback 
}) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const role = await getUserRole(user.$id);
        setUserRole(role);
      } catch (err) {
        setError('Failed to fetch user role');
        console.error('Error fetching user role:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertTitle>Access Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Check if user has required role
  const hasAccess = userRole && allowedRoles.includes(userRole);
  
  // Admins have access to everything
  const isAdmin = userRole === 'admin';
  
  // Editors have access to editor and user roles
  const isEditorWithAccess = userRole === 'editor' && 
    (allowedRoles.includes('editor') || allowedRoles.includes('user'));
  
  if (hasAccess || isAdmin || isEditorWithAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Alert>
      <Shield className="h-4 w-4" />
      <AlertTitle>Access Denied</AlertTitle>
      <AlertDescription>
        You don't have permission to view this content. 
        Required roles: {allowedRoles.join(', ')}.
      </AlertDescription>
    </Alert>
  );
};

// Specific role-based components
export const AdminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleBasedAccess allowedRoles={['admin']}>
    {children}
  </RoleBasedAccess>
);

export const EditorOrAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleBasedAccess allowedRoles={['editor', 'admin']}>
    {children}
  </RoleBasedAccess>
);

export const AuthenticatedOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleBasedAccess allowedRoles={['user', 'editor', 'admin']}>
    {children}
  </RoleBasedAccess>
);

export default RoleBasedAccess;
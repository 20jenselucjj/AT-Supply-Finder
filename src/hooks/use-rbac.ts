import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { getUserRole, hasRole, hasPermission, UserRole, RolePermissions, isCurrentUserAdmin, isCurrentUserEditorOrAdmin } from '@/lib/rbac';

export const useRBAC = () => {
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
        const role = await getUserRole(user.id);
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

  const checkRole = async (role: UserRole): Promise<boolean> => {
    if (!user) return false;
    return hasRole(user.id, role);
  };

  const checkPermission = async (permission: keyof RolePermissions): Promise<boolean> => {
    if (!user) return false;
    return hasPermission(user.id, permission);
  };

  const isAdmin = async (): Promise<boolean> => {
    if (!user) return false;
    return isCurrentUserAdmin();
  };

  const isEditorOrAdmin = async (): Promise<boolean> => {
    if (!user) return false;
    return isCurrentUserEditorOrAdmin();
  };

  return {
    userRole,
    loading,
    error,
    checkRole,
    checkPermission,
    isAdmin,
    isEditorOrAdmin
  };
};

export default useRBAC;
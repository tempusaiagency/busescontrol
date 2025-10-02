import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Permissions {
  dashboard: boolean;
  buses: boolean;
  passengers: boolean;
  inventory: boolean;
  expenses: boolean;
  reports: boolean;
  configuration: boolean;
}

interface PermissionsContextType {
  permissions: Permissions;
  loading: boolean;
  hasPermission: (module: keyof Permissions) => boolean;
}

const defaultPermissions: Permissions = {
  dashboard: false,
  buses: false,
  passengers: false,
  inventory: false,
  expenses: false,
  reports: false,
  configuration: false
};

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPermissions();
    } else {
      setPermissions(defaultPermissions);
      setLoading(false);
    }
  }, [user]);

  const loadPermissions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_role_assignments')
        .select(`
          role_id,
          user_roles (
            permissions
          )
        `)
        .eq('user_id', user.id);

      if (assignmentsError) throw assignmentsError;

      if (assignments && assignments.length > 0) {
        const mergedPermissions: Permissions = { ...defaultPermissions };

        assignments.forEach((assignment: any) => {
          if (assignment.user_roles && assignment.user_roles.permissions) {
            const rolePermissions = assignment.user_roles.permissions as Permissions;
            Object.keys(rolePermissions).forEach((key) => {
              const permKey = key as keyof Permissions;
              if (rolePermissions[permKey]) {
                mergedPermissions[permKey] = true;
              }
            });
          }
        });

        setPermissions(mergedPermissions);
      } else {
        setPermissions({
          dashboard: true,
          buses: true,
          passengers: true,
          inventory: true,
          expenses: true,
          reports: true,
          configuration: false
        });
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions({
        dashboard: true,
        buses: true,
        passengers: true,
        inventory: true,
        expenses: true,
        reports: true,
        configuration: false
      });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (module: keyof Permissions): boolean => {
    return permissions[module] === true;
  };

  const value = {
    permissions,
    loading,
    hasPermission
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

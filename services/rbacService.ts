// rbacService.ts
// Role-Based Access Control for actions and resources

import type { User } from '../types';

export type Role = 'admin' | 'dispatcher' | 'responder' | 'ngo' | 'public' | 'auditor';
export type Permission = 'view_incident' | 'edit_incident' | 'dispatch' | 'manage_users' | 'view_audit' | 'access_sensitive_data' | 'minimal_mode' | 'manage_integrations';

const rolePermissions: Record<Role, Permission[]> = {
  admin: ['view_incident', 'edit_incident', 'dispatch', 'manage_users', 'view_audit', 'access_sensitive_data', 'minimal_mode', 'manage_integrations'],
  dispatcher: ['view_incident', 'edit_incident', 'dispatch', 'minimal_mode'],
  responder: ['view_incident', 'edit_incident', 'minimal_mode'],
  ngo: ['view_incident', 'minimal_mode'],
  public: ['view_incident'],
  auditor: ['view_incident', 'view_audit'],
};

class RBACService {
  // Check if user has permission
  hasPermission(user: User, permission: Permission): boolean {
    const perms = rolePermissions[user.role as Role] || [];
    return perms.includes(permission);
  }

  // Get all permissions for a user
  getPermissions(user: User): Permission[] {
    return rolePermissions[user.role as Role] || [];
  }
}

export const rbacService = new RBACService();

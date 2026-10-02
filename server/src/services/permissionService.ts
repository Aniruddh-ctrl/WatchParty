import { Action, Role } from '../types/rbac.js';

/**
 * Role permissions mapping.
 * Backend is the absolute source of truth for authorization.
 */
const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Action>> = {
  HOST: new Set<Action>([
    'PLAY',
    'PAUSE',
    'SEEK',
    'CHANGE_VIDEO',
    'ASSIGN_ROLE',
    'REMOVE_PARTICIPANT',
    'TRANSFER_HOST',
  ]),
  MODERATOR: new Set<Action>([
    'PLAY',
    'PAUSE',
    'SEEK',
    'CHANGE_VIDEO',
  ]),
  PARTICIPANT: new Set<Action>([]), // Viewer-only, no control permissions
};

export class PermissionService {
  /**
   * Check if a given role is allowed to perform a specific action.
   */
  public static canPerformAction(role: Role, action: Action): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;
    return permissions.has(action);
  }

  /**
   * Returns a user-friendly error message when an action is rejected.
   */
  public static getPermissionDeniedMessage(role: Role, action: Action): string {
    return `Action '${action}' is not permitted for role '${role}'. Only authorized room members may perform this action.`;
  }
}

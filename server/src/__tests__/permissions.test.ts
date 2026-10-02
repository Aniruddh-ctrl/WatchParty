import { describe, it, expect } from 'vitest';
import { PermissionService } from '../services/permissionService.js';
import { Action, Role } from '../types/rbac.js';

describe('RBAC PermissionService', () => {
  const allActions: Action[] = [
    'PLAY',
    'PAUSE',
    'SEEK',
    'CHANGE_VIDEO',
    'ASSIGN_ROLE',
    'REMOVE_PARTICIPANT',
    'TRANSFER_HOST',
  ];

  it('allows HOST to perform all actions', () => {
    for (const action of allActions) {
      expect(PermissionService.canPerformAction('HOST', action)).toBe(true);
    }
  });

  it('allows MODERATOR to control playback and change video, but not manage roles or members', () => {
    const allowedForMod: Action[] = ['PLAY', 'PAUSE', 'SEEK', 'CHANGE_VIDEO'];
    const forbiddenForMod: Action[] = ['ASSIGN_ROLE', 'REMOVE_PARTICIPANT', 'TRANSFER_HOST'];

    for (const action of allowedForMod) {
      expect(PermissionService.canPerformAction('MODERATOR', action)).toBe(true);
    }

    for (const action of forbiddenForMod) {
      expect(PermissionService.canPerformAction('MODERATOR', action)).toBe(false);
    }
  });

  it('denies PARTICIPANT from performing any control or admin actions', () => {
    for (const action of allActions) {
      expect(PermissionService.canPerformAction('PARTICIPANT', action)).toBe(false);
    }
  });

  it('provides a descriptive permission denied message', () => {
    const msg = PermissionService.getPermissionDeniedMessage('PARTICIPANT', 'PLAY');
    expect(msg).toContain('PLAY');
    expect(msg).toContain('PARTICIPANT');
  });
});

export type Role = 'HOST' | 'MODERATOR' | 'PARTICIPANT';

export type Action =
  | 'PLAY'
  | 'PAUSE'
  | 'SEEK'
  | 'CHANGE_VIDEO'
  | 'ASSIGN_ROLE'
  | 'REMOVE_PARTICIPANT'
  | 'TRANSFER_HOST';

export function canPerformAction(role: Role, action: Action): boolean {
  switch (role) {
    case 'HOST':
      return true; // Host can perform all actions
    case 'MODERATOR':
      return ['PLAY', 'PAUSE', 'SEEK', 'CHANGE_VIDEO'].includes(action);
    case 'PARTICIPANT':
      return false; // Viewers cannot perform control actions
    default:
      return false;
  }
}

export type Role = 'HOST' | 'MODERATOR' | 'PARTICIPANT';

export type Action =
  | 'PLAY'
  | 'PAUSE'
  | 'SEEK'
  | 'CHANGE_VIDEO'
  | 'ASSIGN_ROLE'
  | 'REMOVE_PARTICIPANT'
  | 'TRANSFER_HOST';

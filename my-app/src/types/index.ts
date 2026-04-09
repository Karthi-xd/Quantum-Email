export interface Email {
  id: number;
  from: string;
  to?: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  encrypted?: boolean;
  key?: string;
  body?: string;
  attachment?: boolean;
}

export interface Account {
  id: string;
  email: string;
  displayName: string;
  smtpHost: string;
  smtpPort: number;
  imapHost: string;
  imapPort: number;
  password?: string;
  avatar?: string;
  color?: string;
}

export interface EmailCategory {
  key: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: EmailCategory[] = [
  { key: 'all', label: 'All', icon: '◈' },
  { key: 'inbox', label: 'Inbox', icon: '↓' },
  { key: 'sent', label: 'Sent', icon: '↑' },
  { key: 'spam', label: 'Spam', icon: '!' },
];

export type Page = 'landing' | 'login' | 'app';

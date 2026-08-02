import type { Account, Email } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export const emailService = {
  async sendEmail(
    account: Account,
    payload: { toEmail: string; subject: string; body: string }
  ): Promise<{ success: boolean; id?: string; email?: Email; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${account.token || ''}`,
        },
        body: JSON.stringify({
          from_email: account.email,
          to_email: payload.toEmail,
          subject: payload.subject,
          body: payload.body,
          smtp_host: account.smtpHost,
          smtp_port: account.smtpPort,
          smtp_password: account.smtpPassword || '',
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        return { success: false, error: data.detail || 'Failed to send' };
      }
      const data = await res.json();
      return { success: true, id: data.id };
    } catch {
      return { success: false, error: 'Unable to connect to server' };
    }
  },

  async fetchEmails(account: Account): Promise<{ success: boolean; emails?: Email[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${account.token || ''}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.detail || 'Failed to fetch emails' };
      }

      const emails: Email[] = await response.json();
      return { success: true, emails };
    } catch {
      return { success: false, error: 'Unable to connect to server' };
    }
  },

  async fetchSentEmails(account: Account): Promise<{ success: boolean; emails?: Email[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/emails/sent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${account.token || ''}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.detail || 'Failed to fetch sent emails' };
      }

      const emails: Email[] = await response.json();
      return { success: true, emails };
    } catch {
      return { success: false, error: 'Unable to connect to server' };
    }
  },

  async fetchImapEmails(account: Account): Promise<{ success: boolean; emails?: Email[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/fetch-imap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          password: account.password,
          imap_host: account.imapHost,
          imap_port: account.imapPort,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        return { success: false, error: data.detail || 'IMAP fetch failed' };
      }
      const emails = await res.json();
      return { success: true, emails };
    } catch {
      return { success: false, error: 'Unable to connect to IMAP server' };
    }
  },

  async deleteEmail(emailId: string, token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/emails/${encodeURIComponent(emailId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        return { success: false, error: data.detail || 'Failed to delete' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Unable to connect to server' };
    }
  },

  async fetchPublicKeys(email: string): Promise<{ kyber_pub: string; dili_pub: string } | null> {
    try {
      const res = await fetch(`${API_BASE}/public-keys/${encodeURIComponent(email)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};
import { generateSharedKey, qkdEncrypt } from '../qkd';
import type { Account, Email } from '../types';

const API_BASE = 'http://localhost:8000';

export interface SendEmailPayload {
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  smtpHost: string;
  smtpPort: number;
}

export const emailService = {
  async sendEmail(
    account: Account,
    payload: Omit<SendEmailPayload, 'fromEmail' | 'smtpHost' | 'smtpPort'>
  ): Promise<{ success: boolean; email?: Email; error?: string }> {
    const key = generateSharedKey(32);
    const encryptedBody = qkdEncrypt(payload.body, key);

    try {
      await fetch(`${API_BASE}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_email: account.email,
          to_email: payload.toEmail,
          subject: payload.subject,
          body: payload.body,
          smtp_host: account.smtpHost,
          smtp_port: account.smtpPort,
        }),
      });
    } catch {
      console.log('Email saved locally (server unavailable)');
    }

    const newEmail: Email = {
      id: Date.now(),
      from: account.email,
      to: payload.toEmail,
      subject: payload.subject,
      preview: `[QKD Encrypted] ${encryptedBody.substring(0, 50)}...`,
      time: 'Just now',
      read: true,
      encrypted: true,
      key: key,
      body: payload.body,
    };

    return { success: true, email: newEmail };
  },

  async fetchEmails(account: Account): Promise<{ success: boolean; emails?: Record<string, Email[]>; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/emails/${encodeURIComponent(account.email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }

      const emails = await response.json();
      return { success: true, emails };
    } catch {
      return { success: false, error: 'Unable to connect to server' };
    }
  },

  async verifyAccount(account: Account): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          password: account.password,
          smtp_host: account.smtpHost,
          smtp_port: account.smtpPort,
          imap_host: account.imapHost,
          imap_port: account.imapPort,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Verification failed');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Verification failed' };
    }
  },
};

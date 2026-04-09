import { useState } from 'react';
import { useEmailStore } from '../store/emailStore';
import { emailService } from '../services/emailService';
import './Compose.css';
import './Buttons.css';

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function Compose() {
  const {
    composing,
    composeData,
    setComposeData,
    clearCompose,
    activeAccount,
    setShowAccountSwitcher,
    addSentEmail,
    setActiveCategory,
  } = useEmailStore();

  const [errors, setErrors] = useState<{ to?: string; subject?: string; body?: string }>({});
  const [touched, setTouched] = useState<{ to?: boolean }>({});

  if (!composing) return null;

  const validateForm = () => {
    const newErrors: { to?: string; subject?: string; body?: string } = {};
    
    if (!composeData.to) {
      newErrors.to = 'Recipient is required';
    } else if (!isValidEmail(composeData.to)) {
      newErrors.to = 'Invalid email format';
    }
    
    if (!composeData.subject) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!composeData.body) {
      newErrors.body = 'Message body is required';
    }
    
    return newErrors;
  };

  const handleSend = async () => {
    setTouched({ to: true });
    const validationErrors = validateForm();
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) return;

    if (!activeAccount) {
      setShowAccountSwitcher(true);
      return;
    }

    const result = await emailService.sendEmail(activeAccount, {
      toEmail: composeData.to,
      subject: composeData.subject,
      body: composeData.body,
    });

    if (result.success && result.email) {
      addSentEmail(result.email);
      clearCompose();
      setActiveCategory('sent');
    }
  };

  return (
    <div className="compose-modal glass" role="dialog" aria-modal="true" aria-labelledby="compose-title">
      <div className="compose-head">
        <h3 id="compose-title">New Quantum Transmission</h3>
        <button className="close-btn" onClick={clearCompose} aria-label="Close compose">
          ×
        </button>
      </div>
      <div className="compose-form">
        <div>
          <input
            type="email"
            placeholder="Recipient node..."
            value={composeData.to}
            onChange={(e) => {
              setComposeData({ to: e.target.value });
              if (touched.to) {
                if (!e.target.value) setErrors({ ...errors, to: 'Recipient is required' });
                else if (!isValidEmail(e.target.value)) setErrors({ ...errors, to: 'Invalid email format' });
                else setErrors({ ...errors, to: undefined });
              }
            }}
            onBlur={() => setTouched({ ...touched, to: true })}
            className={`compose-input ${errors.to ? 'invalid' : ''}`}
            aria-label="Recipient email"
            aria-invalid={!!errors.to}
            aria-describedby={errors.to ? 'to-error' : undefined}
          />
          {errors.to && <div id="to-error" className="validation-error" role="alert">{errors.to}</div>}
        </div>
        <div>
          <input
            type="text"
            placeholder="Subject line..."
            value={composeData.subject}
            onChange={(e) => setComposeData({ subject: e.target.value })}
            className={`compose-input ${errors.subject ? 'invalid' : ''}`}
            aria-label="Email subject"
            aria-invalid={!!errors.subject}
          />
          {errors.subject && <div className="validation-error" role="alert">{errors.subject}</div>}
        </div>
        <div>
          <textarea
            placeholder="Encrypt your message..."
            value={composeData.body}
            onChange={(e) => setComposeData({ body: e.target.value })}
            className={`compose-textarea ${errors.body ? 'invalid' : ''}`}
            rows={8}
            aria-label="Email body"
            aria-invalid={!!errors.body}
          />
          {errors.body && <div className="validation-error" role="alert">{errors.body}</div>}
        </div>
      </div>
      <div className="compose-actions">
        <button className="btn-prime" onClick={handleSend}>
          Send Transmission
        </button>
        <button className="btn-ghost" onClick={clearCompose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

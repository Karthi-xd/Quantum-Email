import { useEmailStore } from '../store/emailStore';
import { emailService } from '../services/emailService';

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

  if (!composing) return null;

  const handleSend = async () => {
    if (!composeData.to || !composeData.subject || !composeData.body) return;

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
    <div className="compose-modal glass">
      <div className="compose-head">
        <h3>New Quantum Transmission</h3>
        <button className="close-btn" onClick={clearCompose}>
          ×
        </button>
      </div>
      <div className="compose-form">
        <input
          type="text"
          placeholder="Recipient node..."
          value={composeData.to}
          onChange={(e) => setComposeData({ to: e.target.value })}
          className="compose-input"
        />
        <input
          type="text"
          placeholder="Subject line..."
          value={composeData.subject}
          onChange={(e) => setComposeData({ subject: e.target.value })}
          className="compose-input"
        />
        <textarea
          placeholder="Encrypt your message..."
          value={composeData.body}
          onChange={(e) => setComposeData({ body: e.target.value })}
          className="compose-textarea"
          rows={8}
        />
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

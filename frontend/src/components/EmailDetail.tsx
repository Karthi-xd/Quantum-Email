import { useEmailStore } from '../store/emailStore';
import { emailService } from '../services/emailService';
import './EmailDetail.css';
import './Buttons.css';

export function EmailDetail() {
  const { selectedEmail, setSelectedEmail, deleteEmail, setComposeData, setComposing, activeAccount } = useEmailStore();

  if (!selectedEmail) return null;

  const handleReply = () => {
    const originalBody = selectedEmail.body || selectedEmail.preview;
    setComposeData({
      to: selectedEmail.from,
      subject: selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
      body: `\n\n--- Original Message ---\nFrom: ${selectedEmail.from}\nDate: ${selectedEmail.time}\n\n${originalBody}`,
    });
    setComposing(true);
    setSelectedEmail(null);
  };

  const handleReplyAll = () => {
    const originalBody = selectedEmail.body || selectedEmail.preview;
    setComposeData({
      to: selectedEmail.from,
      subject: selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
      body: `\n\n--- Original Message ---\nFrom: ${selectedEmail.from}\nDate: ${selectedEmail.time}\n\n${originalBody}`,
    });
    setComposing(true);
    setSelectedEmail(null);
  };

  const handleForward = () => {
    const originalBody = selectedEmail.body || selectedEmail.preview;
    setComposeData({
      to: '',
      subject: selectedEmail.subject.startsWith('Fwd:') ? selectedEmail.subject : `Fwd: ${selectedEmail.subject}`,
      body: `\n\n--- Forwarded Message ---\nFrom: ${selectedEmail.from}\nDate: ${selectedEmail.time}\nSubject: ${selectedEmail.subject}\n\n${originalBody}`,
    });
    setComposing(true);
    setSelectedEmail(null);
  };

  const handleDelete = async () => {
    if (!activeAccount) return;
    await emailService.deleteEmail(selectedEmail.id, activeAccount.token || '');
    deleteEmail(selectedEmail.id);
  };

  return (
    <div className="detail-overlay" onClick={() => setSelectedEmail(null)} role="dialog" aria-modal="true" aria-labelledby="email-subject">
      <div className="detail glass" onClick={(e) => e.stopPropagation()} role="document">
        <div className="det-head">
          <button className="back-btn" onClick={() => setSelectedEmail(null)} aria-label="Close email">
            ← Back
          </button>
          <h3 id="email-subject">{selectedEmail.subject}</h3>
        </div>
        <div className="det-meta">
          <span>
            From: <strong>{selectedEmail.from}</strong>
          </span>
        </div>
        <div className="det-body">
          {selectedEmail?.encrypted && (
            <p className="qkd-badge" role="status">
              {selectedEmail.verified ? '🔐 Quantum Encrypted & Signature Verified' : '🔐 Quantum Encrypted'}
            </p>
          )}
          <p>{(selectedEmail?.body || selectedEmail?.preview)}</p>
        </div>
        <div className="det-actions">
          <button className="btn-prime sm" onClick={handleReply} aria-label="Reply to email">
            Reply
          </button>
          <button className="btn-ghost sm" onClick={handleReplyAll} aria-label="Reply to all">
            Reply All
          </button>
          <button className="btn-ghost sm" onClick={handleForward} aria-label="Forward email">
            Forward
          </button>
          <button className="btn-danger sm" onClick={handleDelete} aria-label="Delete email">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
import { useEmailStore } from '../store/emailStore';

export function EmailDetail() {
  const { selectedEmail, setSelectedEmail, deleteEmail, setComposeData, setComposing } = useEmailStore();

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

  const handleDelete = () => {
    deleteEmail(selectedEmail.id);
  };

  return (
    <div className="detail-overlay" onClick={() => setSelectedEmail(null)}>
      <div className="detail glass" onClick={(e) => e.stopPropagation()}>
        <div className="det-head">
          <button className="back-btn" onClick={() => setSelectedEmail(null)}>
            ← Back
          </button>
          <h3>{selectedEmail.subject}</h3>
        </div>
        <div className="det-meta">
          <span>
            From: <strong>{selectedEmail.from}</strong>
          </span>
          <span>{selectedEmail.time}</span>
        </div>
        <div className="det-body">
          {selectedEmail?.encrypted ? (
            <p className="qkd-badge">🔐 QKD Encrypted (Key required for decryption)</p>
          ) : null}
          <p>{selectedEmail?.preview}</p>
          <p>
            Transmission encrypted with a 256-qubit entangled key pair. Quantum signature
            verified. No decoherence detected in transit through the relay network.
          </p>
          <p>
            All packets transmitted via superposition channels and collapsed only upon your
            authorized observation.
          </p>
        </div>
        <div className="det-actions">
          <button className="btn-prime sm" onClick={handleReply}>
            Reply
          </button>
          <button className="btn-ghost sm" onClick={handleForward}>
            Forward
          </button>
          <button className="btn-danger sm" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

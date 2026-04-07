import { useToastStore } from '../../store/toastStore';
import type { ToastType } from '../../store/toastStore';

const icons: Record<ToastType, string> = {
  success: '◈',
  error: '⚠',
  info: '◉',
  warning: '△',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <div className="toast-icon">{icons[t.type]}</div>
          <div className="toast-content">
            <p className="toast-message">{t.message}</p>
            {t.action && (
              <button className="toast-action" onClick={t.action.onClick}>
                {t.action.label}
              </button>
            )}
          </div>
          <button className="toast-close" onClick={() => removeToast(t.id)}>
            ×
          </button>
          <div className="toast-progress" />
        </div>
      ))}
    </div>
  );
}

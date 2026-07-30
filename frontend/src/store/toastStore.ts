import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID();
    const duration = toast.duration ?? 4000;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

export const toast = {
  success: (message: string, action?: Toast['action']) =>
    useToastStore.getState().addToast({ type: 'success', message, action }),
  error: (message: string, action?: Toast['action']) =>
    useToastStore.getState().addToast({ type: 'error', message, action, duration: 6000 }),
  info: (message: string, action?: Toast['action']) =>
    useToastStore.getState().addToast({ type: 'info', message, action }),
  warning: (message: string, action?: Toast['action']) =>
    useToastStore.getState().addToast({ type: 'warning', message, action }),
};

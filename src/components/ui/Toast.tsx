import { useEffect, useState } from 'react';
import { Toast as ToastType } from '../../types';
import { cn } from '../../lib/utils';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const typeStyles: Record<ToastType['type'], string> = {
  success: 'bg-green-600 text-white',
  info: 'bg-blue-600 text-white',
  warning: 'bg-amber-500 text-white',
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration ?? 3000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-opacity duration-300',
        typeStyles[toast.type],
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      {toast.message}
    </div>
  );
}

interface ToastQueueProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

export function ToastQueue({ toasts, onDismiss }: ToastQueueProps) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import './Toast.css';

export interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
}

interface ToastProps {
  toast: ToastData | null;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'warning':
        return <AlertTriangle size={18} color="var(--warning)" />;
      case 'error':
        return <XCircle size={18} color="var(--danger)" />;
      case 'info':
        return <Info size={18} color="var(--primary-light)" />;
      default:
        return <CheckCircle2 size={18} color="var(--success)" />;
    }
  };

  return (
    <div className="toast-msg">
      <div className="row" style={{ gap: '10px' }}>
        {getIcon()}
        <span>{toast.message}</span>
      </div>
    </div>
  );
};

export default Toast;

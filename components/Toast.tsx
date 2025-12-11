import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Heart, Check, X, AlertTriangle, Zap } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'hearts';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  hearts?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, hearts?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success', hearts?: number) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, hearts }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast 容器 */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-300 flex items-center gap-3 px-5 py-3 border-2 shadow-lg min-w-[200px] max-w-[400px] ${
              toast.type === 'success' ? 'bg-black border-yolo-lime text-yolo-lime' :
              toast.type === 'error' ? 'bg-black border-red-500 text-red-500' :
              toast.type === 'warning' ? 'bg-black border-yellow-500 text-yellow-500' :
              'bg-black border-yolo-pink text-yolo-pink'
            }`}
          >
            {/* 图标 */}
            <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
              toast.type === 'success' ? 'bg-yolo-lime/20' :
              toast.type === 'error' ? 'bg-red-500/20' :
              toast.type === 'warning' ? 'bg-yellow-500/20' :
              'bg-yolo-pink/20'
            }`}>
              {toast.type === 'success' && <Check className="w-5 h-5" />}
              {toast.type === 'error' && <X className="w-5 h-5" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
              {toast.type === 'hearts' && <Heart className="w-5 h-5 fill-current" />}
            </div>
            
            {/* 内容 */}
            <div className="flex-1">
              <p className="font-bold text-sm text-white">{toast.message}</p>
              {toast.type === 'hearts' && toast.hearts !== undefined && (
                <p className="text-lg font-black flex items-center gap-1">
                  <Zap className="w-4 h-4" /> +{toast.hearts} <Heart className="w-4 h-4 fill-current" />
                </p>
              )}
            </div>

            {/* 关闭按钮 */}
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

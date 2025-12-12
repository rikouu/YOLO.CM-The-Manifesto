import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

const ConfirmDialog: React.FC<Props> = ({
  isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel',
  onConfirm, onCancel, danger = false
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/90 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-md bg-[#0a0a0a] border-t-2 sm:border-2 border-yolo-white animate-in slide-in-from-bottom sm:zoom-in duration-200"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* 标题栏 */}
        <div className={`p-3 sm:p-4 flex items-center gap-2 sm:gap-3 ${danger ? 'bg-red-500/20' : 'bg-yolo-lime/20'}`}>
          <div className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center ${danger ? 'bg-red-500' : 'bg-yolo-lime'} text-black`}>
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white flex-1">{title}</h3>
          <button onClick={onCancel} className="text-white/50 hover:text-white active:scale-95 transition-all">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 sm:p-6">
          <p className="text-white/70 mb-4 sm:mb-6 text-sm sm:text-base">{message}</p>

          {/* 按钮 */}
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 sm:py-3 border-2 border-yolo-gray text-white font-bold uppercase hover:border-white active:scale-[0.98] transition-all text-sm sm:text-base"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 sm:py-3 font-bold uppercase active:scale-[0.98] transition-all text-sm sm:text-base ${
                danger
                  ? 'bg-red-500 text-white hover:bg-red-400'
                  : 'bg-yolo-lime text-black hover:bg-white'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

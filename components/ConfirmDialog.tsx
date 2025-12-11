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
    <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4" onClick={onCancel}>
      <div 
        className="w-full max-w-md bg-[#0a0a0a] border-2 border-yolo-white animate-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className={`p-4 flex items-center gap-3 ${danger ? 'bg-red-500/20' : 'bg-yolo-lime/20'}`}>
          <div className={`w-10 h-10 flex items-center justify-center ${danger ? 'bg-red-500' : 'bg-yolo-lime'} text-black`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-white flex-1">{title}</h3>
          <button onClick={onCancel} className="text-white/50 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          <p className="text-white/70 mb-6">{message}</p>
          
          {/* 按钮 */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 border-2 border-yolo-gray text-white font-bold uppercase hover:border-white transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3 font-bold uppercase transition-colors ${
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

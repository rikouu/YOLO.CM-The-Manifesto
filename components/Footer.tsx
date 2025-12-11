import React, { useState } from 'react';
import { ExternalLink, X, Copy, Check, Twitter, Facebook, Linkedin, Share2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { soundManager } from '../services/soundService';
import { AppMode } from '../types';

interface FooterProps {
    onNavigate: (mode: AppMode) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [isShareOpen] = useState(false);
  // Note: The original code had setIsShareOpen in the destructuring but it wasn't used in the provided snippet
  // Re-adding the full state logic based on the user's previous file content.
  const [shareOpenState, setShareOpenState] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    soundManager.playClick();
    setShareOpenState(true);
  };

  const handleNavClick = (mode: AppMode) => {
      soundManager.playClick();
      onNavigate(mode);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClose = () => {
    soundManager.playClick();
    setShareOpenState(false);
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      soundManager.playSuccess();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const url = typeof window !== 'undefined' ? window.location.href : 'https://yolo.cm';
  const shareText = "I have entered the void at YOLO.CM. Join me.";

  const socialShare = (platform: string) => {
      soundManager.playClick();
      const text = encodeURIComponent(shareText);
      const u = encodeURIComponent(url);
      let shareUrl = '';

      switch(platform) {
          case 'twitter':
              shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${u}`;
              break;
          case 'facebook':
              shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${u}`;
              break;
          case 'linkedin':
              shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
              break;
      }
      
      if(shareUrl) {
          window.open(shareUrl, '_blank', 'width=600,height=400');
      }
  };

  return (
    <>
      <footer className="w-full border-t border-yolo-gray bg-yolo-black py-12 px-6 flex flex-col md:flex-row items-center justify-between z-10 relative">
        <div className="flex flex-col mb-8 md:mb-0 text-center md:text-left">
          <span 
            className="font-black text-3xl text-yolo-white cursor-pointer hover:text-yolo-lime transition-colors tracking-tighter"
            onClick={() => handleNavClick(AppMode.HOME)}
          >
            YOLO.CM
          </span>
          <span className="text-yolo-gray text-xs font-mono mt-2 tracking-widest">© {new Date().getFullYear()} THE VOID INC.</span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 w-full md:w-auto">
            {/* Minimalist Button Group */}
            
            <button 
                onClick={() => handleNavClick(AppMode.MANIFESTO)} 
                onMouseEnter={() => soundManager.playHover()}
                className="text-yolo-white hover:text-yolo-lime active:scale-95 transition-all duration-150 font-black font-mono text-sm uppercase tracking-widest relative group"
            >
                {t.footer.manifesto}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yolo-lime transition-all group-hover:w-full"></span>
            </button>
            
            <button 
                onClick={() => handleNavClick(AppMode.MERCH)} 
                onMouseEnter={() => soundManager.playHover()}
                className="text-yolo-white hover:text-yolo-lime active:scale-95 transition-all duration-150 font-black font-mono text-sm uppercase tracking-widest relative group"
            >
                {t.footer.merch}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yolo-lime transition-all group-hover:w-full"></span>
            </button>

            <button 
                onClick={handleShareClick}
                onMouseEnter={() => soundManager.playHover()}
                className="text-yolo-lime hover:text-yolo-pink active:scale-95 transition-all duration-150 font-black font-mono text-sm uppercase tracking-widest relative group flex items-center gap-2"
            >
                {t.footer.share}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yolo-pink transition-all group-hover:w-full"></span>
            </button>

        </div>
      </footer>

      {/* Share Modal */}
      {shareOpenState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={handleClose}
          ></div>
          <div className="relative bg-yolo-black border border-yolo-lime p-8 max-w-md w-full shadow-[0_0_50px_rgba(204,255,0,0.2)] animate-in zoom-in-95 duration-200">
            <button 
                onClick={handleClose}
                className="absolute top-4 right-4 text-yolo-gray hover:text-yolo-lime transition-colors"
            >
                <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-black text-yolo-white mb-2 uppercase">{t.footer.shareModal.title}</h3>
            <p className="text-yolo-gray text-sm font-mono mb-6">{t.footer.shareModal.desc}</p>

            <div className="space-y-6">
                {/* Copy Link Section */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 bg-yolo-gray/20 border border-yolo-gray px-4 py-3 text-yolo-white font-mono text-sm truncate rounded-none select-all">
                        {url}
                    </div>
                    <button 
                        onClick={handleCopy}
                        className={`px-4 py-3 font-bold transition-all duration-300 flex items-center justify-center min-w-[100px] font-mono ${
                            copied ? 'bg-yolo-pink text-white' : 'bg-yolo-lime text-black hover:bg-white'
                        }`}
                    >
                        {copied ? (
                            <span className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                                <Check className="w-4 h-4" /> 
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Copy className="w-4 h-4" /> {t.footer.shareModal.copy}
                            </span>
                        )}
                    </button>
                </div>

                {/* Social Buttons */}
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => socialShare('twitter')} 
                        className="flex flex-col items-center justify-center p-4 border border-yolo-gray hover:border-yolo-white hover:bg-white/5 transition-all group"
                    >
                        <Twitter className="w-6 h-6 mb-2 text-yolo-gray group-hover:text-yolo-lime transition-colors" />
                        <span className="text-xs font-mono text-yolo-gray group-hover:text-yolo-white">X / Twitter</span>
                    </button>
                    <button 
                        onClick={() => socialShare('facebook')} 
                        className="flex flex-col items-center justify-center p-4 border border-yolo-gray hover:border-yolo-white hover:bg-white/5 transition-all group"
                    >
                        <Facebook className="w-6 h-6 mb-2 text-yolo-gray group-hover:text-[#1877F2] transition-colors" />
                        <span className="text-xs font-mono text-yolo-gray group-hover:text-yolo-white">Facebook</span>
                    </button>
                    <button 
                        onClick={() => socialShare('linkedin')} 
                        className="flex flex-col items-center justify-center p-4 border border-yolo-gray hover:border-yolo-white hover:bg-white/5 transition-all group"
                    >
                        <Linkedin className="w-6 h-6 mb-2 text-yolo-gray group-hover:text-[#0A66C2] transition-colors" />
                        <span className="text-xs font-mono text-yolo-gray group-hover:text-yolo-white">LinkedIn</span>
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
import React, { useState, useEffect, useRef } from 'react';
import Hero from './components/Hero';
import DareGenerator from './components/DareGenerator';
import RegretChart from './components/RegretChart';
import Manifesto from './components/Manifesto';
import YoloCoin from './components/YoloCoin';
import Merch from './components/Merch';
import Footer from './components/Footer';
import MouseSpotlight from './components/MouseSpotlight';
import Profile from './components/Profile';
import ChallengeWall from './components/ChallengeWall';
import AuthModal from './components/AuthModal';
import { AppMode, Language } from './types';
import { Terminal, Activity, Zap, FileText, CircleDollarSign, ShoppingBag, ArrowRight, User, Trophy, Menu, X } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import { soundManager } from './services/soundService';

const AppContent: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.INTRO);
  const [scrolled, setScrolled] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Close menus when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleModeChange = (newMode: AppMode) => {
    soundManager.playClick();
    if (newMode !== mode) {
        soundManager.playTransition();
    }
    setMode(newMode);
  };

  const NavButton = ({ target, icon: Icon, label }: { target: AppMode; icon: any; label: string }) => (
    <button
      onClick={() => handleModeChange(target)}
      onMouseEnter={() => soundManager.playHover()}
      className={`p-1.5 md:p-2 rounded-full border transition-all flex-shrink-0
        ${mode === target 
          ? 'bg-yolo-lime text-black border-yolo-lime' 
          : 'text-white border-transparent hover:border-yolo-gray'
        }`}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  const availableLanguages: Language[] = ['en', 'zh', 'ja'];

  return (
    <div className="bg-yolo-black min-h-[100dvh] text-yolo-white selection:bg-yolo-lime selection:text-black font-sans relative cursor-crosshair flex flex-col">
      
      {/* Global Mouse Spotlight Effect */}
      <MouseSpotlight />



      {/* Navigation (Only visible after intro) */}
      {mode !== AppMode.INTRO && (
        <nav className={`fixed top-0 left-0 right-0 z-50 px-3 md:px-6 py-2 transition-all duration-300 ${scrolled ? 'bg-yolo-black/95 backdrop-blur-lg border-b border-yolo-gray' : 'bg-yolo-black/90 backdrop-blur-sm'}`}>
          <div className="flex items-center justify-between h-10">
            {/* Logo */}
            <div 
              className="font-black text-lg md:text-xl tracking-tighter cursor-pointer hover:text-yolo-pink transition-colors flex-shrink-0"
              onClick={() => handleModeChange(AppMode.HOME)}
              onMouseEnter={() => soundManager.playHover()}
            >
              YOLO
            </div>
            
            {/* Desktop Nav - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              <NavButton target={AppMode.HOME} icon={Terminal} label={t.nav.home} />
              <NavButton target={AppMode.MANIFESTO} icon={FileText} label={t.nav.manifesto} />
              <NavButton target={AppMode.DARE} icon={Zap} label={t.nav.fate} />
              <NavButton target={AppMode.COIN} icon={CircleDollarSign} label={t.nav.coin} />
              <NavButton target={AppMode.STATS} icon={Activity} label={t.nav.data} />
              <NavButton target={AppMode.WALL} icon={Trophy} label="WALL" />
              <button
                  onClick={() => handleModeChange(AppMode.MERCH)}
                  onMouseEnter={() => soundManager.playHover()}
                  className={`p-2 rounded-full border transition-all
                      ${mode === AppMode.MERCH
                      ? 'bg-yolo-pink text-black border-yolo-pink' 
                      : 'text-white border-transparent hover:border-yolo-gray'
                      }`}
              >
                  <ShoppingBag className="w-4 h-4" />
              </button>
              {user ? (
                <button
                  onClick={() => handleModeChange(AppMode.PROFILE)}
                  onMouseEnter={() => soundManager.playHover()}
                  className={`p-2 rounded-full border transition-all
                    ${mode === AppMode.PROFILE
                      ? 'bg-yolo-lime text-black border-yolo-lime' 
                      : 'text-white border-transparent hover:border-yolo-gray'
                    }`}
                >
                  <User className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  onMouseEnter={() => soundManager.playHover()}
                  className="p-2 rounded-full border border-yolo-pink text-yolo-pink hover:bg-yolo-pink hover:text-black transition-all"
                >
                  <User className="w-4 h-4" />
                </button>
              )}
              
              {/* Language Switcher - Desktop */}
              <div ref={langMenuRef} className="relative ml-1">
                <button
                  onClick={() => { soundManager.playClick(); setLangMenuOpen(!langMenuOpen); }}
                  className={`w-8 h-8 rounded-full border transition-all font-mono text-xs font-bold flex items-center justify-center
                    ${langMenuOpen ? 'border-yolo-lime text-yolo-lime' : 'text-white/60 border-transparent hover:text-white hover:border-yolo-gray'}`}
                  title={language.toUpperCase()}
                >
                  {language.toUpperCase()}
                </button>
                {langMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-black border border-yolo-gray shadow-lg z-50 min-w-[60px]">
                    {availableLanguages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => { soundManager.playClick(); setLanguage(lang); setLangMenuOpen(false); }}
                        className={`block w-full px-3 py-2 text-center text-xs font-mono font-bold transition-all
                          ${lang === language ? 'bg-yolo-lime text-black' : 'text-white hover:bg-yolo-gray'}`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Nav - Hamburger Menu */}
            <div className="flex md:hidden items-center gap-2" ref={mobileMenuRef}>
              {/* User button always visible on mobile */}
              {user ? (
                <button
                  onClick={() => { handleModeChange(AppMode.PROFILE); setMobileMenuOpen(false); }}
                  className={`p-2 rounded-full border transition-all
                    ${mode === AppMode.PROFILE
                      ? 'bg-yolo-lime text-black border-yolo-lime' 
                      : 'text-white border-transparent hover:border-yolo-gray'
                    }`}
                >
                  <User className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="p-2 rounded-full border border-yolo-pink text-yolo-pink hover:bg-yolo-pink hover:text-black transition-all"
                >
                  <User className="w-4 h-4" />
                </button>
              )}
              
              {/* Hamburger button */}
              <button
                onClick={() => { soundManager.playClick(); setMobileMenuOpen(!mobileMenuOpen); }}
                className={`p-2 rounded-full border transition-all
                  ${mobileMenuOpen ? 'border-yolo-lime text-yolo-lime' : 'text-white border-transparent hover:border-yolo-gray'}`}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Mobile Dropdown Menu */}
              {mobileMenuOpen && (
                <div className="absolute top-full right-3 mt-2 bg-black border border-yolo-gray shadow-xl z-50 min-w-[180px]">
                  {[
                    { target: AppMode.HOME, icon: Terminal, label: t.nav.home },
                    { target: AppMode.MANIFESTO, icon: FileText, label: t.nav.manifesto },
                    { target: AppMode.DARE, icon: Zap, label: t.nav.fate },
                    { target: AppMode.COIN, icon: CircleDollarSign, label: t.nav.coin },
                    { target: AppMode.STATS, icon: Activity, label: t.nav.data },
                    { target: AppMode.WALL, icon: Trophy, label: 'WALL' },
                    { target: AppMode.MERCH, icon: ShoppingBag, label: t.nav.merch || 'MERCH' },
                  ].map(({ target, icon: Icon, label }) => (
                    <button
                      key={target}
                      onClick={() => { handleModeChange(target); setMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-mono transition-all
                        ${mode === target 
                          ? 'bg-yolo-lime text-black' 
                          : 'text-white hover:bg-yolo-gray/50'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                  
                  {/* Language options in mobile menu */}
                  <div className="border-t border-yolo-gray">
                    <div className="flex">
                      {availableLanguages.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => { soundManager.playClick(); setLanguage(lang); setMobileMenuOpen(false); }}
                          className={`flex-1 px-3 py-3 text-center text-xs font-mono font-bold transition-all
                            ${lang === language ? 'bg-yolo-lime text-black' : 'text-white hover:bg-yolo-gray/50'}`}
                        >
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Main Content Area */}
      <main className="w-full relative z-10 flex-grow">
        {mode === AppMode.INTRO && (
          <Hero onStart={() => handleModeChange(AppMode.HOME)} />
        )}

        {mode === AppMode.HOME && (
          <div className="min-h-screen pt-16 md:pt-20 pb-12 px-4 md:px-6 flex flex-col items-center">
            {/* Ticker Tape - Fixed Ghosting by using flexbox instead of absolute positioning */}
            <div className="w-full overflow-hidden whitespace-nowrap bg-yolo-lime text-yolo-black font-mono font-bold py-2 mb-16 transform -rotate-1 flex">
              <div className="animate-marquee shrink-0 flex items-center min-w-full">
                 {[...Array(8)].map((_, i) => (
                    <span key={i} className="mx-4">{t.home.ticker}</span>
                 ))}
              </div>
              <div className="animate-marquee shrink-0 flex items-center min-w-full">
                 {[...Array(8)].map((_, i) => (
                    <span key={`dup-${i}`} className="mx-4">{t.home.ticker}</span>
                 ))}
              </div>
            </div>

            <div className="max-w-4xl text-center space-y-12 mb-12">
              <h2 className="text-5xl md:text-9xl font-black leading-none relative group">
                <span className="block text-transparent stroke-white" style={{ WebkitTextStroke: '1px white' }}>
                    {t.home.headline}
                </span> 
                
                {/* Dynamic Glowing "DYING" Text */}
                <div 
                    className="relative inline-block mt-2 cursor-pointer group/die"
                    onMouseEnter={() => soundManager.playHover()}
                >
                    {/* IDLE: Signal Flicker */}
                    <span className="relative block animate-signal group-hover/die:animate-none group-hover/die:opacity-0 transition-opacity">
                        <span className="text-yolo-white">{t.home.headlineHighlight}</span>
                    </span>

                    {/* HOVER: Violent Glitch/Shatter Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover/die:opacity-100 flex items-center justify-center">
                        <span className="text-transparent hover-shatter animate-glitch text-5xl md:text-9xl font-black select-none">
                            {t.home.headlineHighlight}
                        </span>
                    </div>
                </div>
              </h2>

              {/* Enhanced Subheadline with Hover Effects */}
              <p className="text-xl md:text-3xl font-light text-yolo-gray max-w-3xl mx-auto leading-relaxed transition-all duration-500 hover:text-yolo-white hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] cursor-help selection:bg-yolo-pink selection:text-white">
                {t.home.subheadline}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 w-full">
                <div 
                  onClick={() => handleModeChange(AppMode.DARE)}
                  onMouseEnter={() => soundManager.playHover()}
                  className="group cursor-pointer border border-yolo-gray p-8 hover:bg-yolo-pink transition-all duration-300 relative overflow-hidden h-64 flex flex-col justify-end bg-black/50 backdrop-blur-sm"
                >
                  {/* 图标呼吸效果 */}
                  <div className="absolute top-0 right-0 p-4 transition-all duration-500 group-hover:opacity-100 group-hover:scale-125">
                    <Zap className="w-32 h-32 text-yolo-pink/20 group-hover:text-black animate-[breathe-icon-pink_3s_ease-in-out_infinite] group-hover:animate-none" />
                  </div>
                  <h3 className="text-3xl font-bold font-mono mb-2 group-hover:text-black z-10">{t.home.chaosCardTitle}</h3>
                  <p className="text-yolo-gray group-hover:text-black/80 z-10">{t.home.chaosCardDesc}</p>
                </div>

                <div 
                  onClick={() => handleModeChange(AppMode.STATS)}
                  onMouseEnter={() => soundManager.playHover()}
                  className="group cursor-pointer border border-yolo-gray p-8 hover:bg-yolo-lime transition-all duration-300 relative overflow-hidden h-64 flex flex-col justify-end bg-black/50 backdrop-blur-sm"
                >
                  {/* 图标呼吸效果 */}
                  <div className="absolute top-0 right-0 p-4 transition-all duration-500 group-hover:opacity-100 group-hover:scale-125">
                    <Activity className="w-32 h-32 text-yolo-lime/20 group-hover:text-black animate-[breathe-icon-lime_3s_ease-in-out_infinite_0.5s] group-hover:animate-none" />
                  </div>
                  <h3 className="text-3xl font-bold font-mono mb-2 group-hover:text-black z-10">{t.home.statsCardTitle}</h3>
                  <p className="text-yolo-gray group-hover:text-black/80 z-10">{t.home.statsCardDesc}</p>
                </div>
              </div>

              {/* WHY YOLO Section */}
              <div className="mt-24 text-center max-w-2xl mx-auto border-t border-yolo-gray/30 pt-12 animate-in slide-in-from-bottom-6 duration-700 delay-200">
                <h3 className="text-2xl md:text-3xl font-black text-yolo-pink mb-4 uppercase tracking-widest">
                  {t.home.whyYoloTitle}
                </h3>
                {/* Updated Text Readability: Darker default, Bright hover */}
                <p className="text-yolo-gray/50 hover:text-yolo-white transition-colors duration-500 font-mono text-sm md:text-base mb-8 leading-relaxed cursor-default">
                   {t.home.whyYoloDesc}
                </p>
                <button 
                    onClick={() => handleModeChange(AppMode.MANIFESTO)}
                    onMouseEnter={() => soundManager.playHover()}
                    className="group inline-flex items-center gap-2 text-yolo-white hover:text-yolo-lime transition-colors font-bold text-sm md:text-base uppercase tracking-wider"
                >
                    <span className="underline decoration-yolo-gray underline-offset-4 group-hover:decoration-yolo-lime transition-all">
                        {t.home.whyYoloLink}
                    </span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

            </div>
          </div>
        )}

        {mode === AppMode.MANIFESTO && <Manifesto />}

        {mode === AppMode.COIN && <YoloCoin />}

        {mode === AppMode.MERCH && <Merch />}

        {mode === AppMode.DARE && (
          <div className="min-h-[100dvh] pt-14 md:pt-16 bg-yolo-black">
             <DareGenerator />
          </div>
        )}

        {mode === AppMode.STATS && (
          <div className="min-h-[100dvh] pt-14 md:pt-16 bg-yolo-black flex items-center justify-center">
             <RegretChart />
          </div>
        )}

        {mode === AppMode.PROFILE && <Profile />}

        {mode === AppMode.WALL && <ChallengeWall />}
      </main>

      {mode !== AppMode.INTRO && <Footer onNavigate={handleModeChange} />}
    </div>
  );
};

const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AuthProvider>
                <ToastProvider>
                    <AppContent />
                </ToastProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}

export default App;
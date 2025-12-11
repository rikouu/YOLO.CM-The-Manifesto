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
import { Terminal, Activity, Zap, Globe, FileText, CircleDollarSign, ShoppingBag, ChevronDown, ArrowRight, User, Trophy } from 'lucide-react';
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
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Close language menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
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
      className={`flex items-center space-x-2 px-3 py-2 rounded-full border transition-all duration-300 font-mono text-xs md:text-sm whitespace-nowrap
        ${mode === target 
          ? 'bg-yolo-lime text-yolo-black border-yolo-lime font-bold' 
          : 'bg-transparent text-yolo-white border-transparent hover:border-yolo-gray'
        }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );

  const availableLanguages: Language[] = ['en', 'zh', 'ja'];

  return (
    <div className="bg-yolo-black min-h-[100dvh] text-yolo-white selection:bg-yolo-lime selection:text-black font-sans relative cursor-crosshair flex flex-col">
      
      {/* Global Mouse Spotlight Effect */}
      <MouseSpotlight />

      {/* Language Switcher - Aligned with Navbar */}
      <div 
        ref={langMenuRef}
        className="fixed z-[60] font-mono text-xs
           top-4 right-6"
      >
        <div className="relative">
            <button
                onClick={() => {
                    soundManager.playClick();
                    setLangMenuOpen(!langMenuOpen);
                }}
                className={`flex items-center gap-2 px-3 py-2 bg-transparent backdrop-blur-sm rounded-none border transition-all duration-300 min-w-[80px] justify-between group
                ${langMenuOpen 
                    ? 'border-yolo-lime text-yolo-lime bg-black/80' 
                    : 'border-yolo-gray text-yolo-gray hover:border-yolo-white hover:text-yolo-white'
                }`}
            >
                <Globe className="w-3 h-3" />
                <span className="font-bold">{language.toUpperCase()}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${langMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Options */}
            <div className={`absolute top-full right-0 mt-1 w-full bg-black border border-yolo-gray shadow-[0_0_15px_rgba(0,0,0,0.8)] transition-all duration-300 origin-top ${langMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                {availableLanguages.filter(l => l !== language).map((lang) => (
                    <button
                        key={lang}
                        onClick={() => {
                            soundManager.playClick();
                            setLanguage(lang);
                            setLangMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-yolo-white hover:text-black hover:bg-yolo-lime transition-colors block border-b border-yolo-gray/20 last:border-0 font-bold"
                    >
                        {lang.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Navigation (Only visible after intro) */}
      {mode !== AppMode.INTRO && (
        <nav className={`fixed top-0 left-0 right-0 z-50 flex flex-col md:flex-row justify-between items-center px-6 py-4 transition-all duration-300 gap-4 md:gap-0 ${scrolled ? 'bg-yolo-black/90 backdrop-blur-lg border-b border-yolo-gray' : 'bg-transparent'}`}>
          <div 
            className="font-black text-xl tracking-tighter cursor-pointer hover:text-yolo-pink transition-colors"
            onClick={() => handleModeChange(AppMode.HOME)}
            onMouseEnter={() => soundManager.playHover()}
          >
            YOLO.CM
          </div>
          {/* Scrollable Nav for Mobile */}
          <div className="flex space-x-1 md:space-x-2 overflow-x-auto w-full md:w-auto md:pr-40 scrollbar-hide pb-2 md:pb-0 justify-start md:justify-end">
            <NavButton target={AppMode.HOME} icon={Terminal} label={t.nav.home} />
            <NavButton target={AppMode.MANIFESTO} icon={FileText} label={t.nav.manifesto} />
            <NavButton target={AppMode.DARE} icon={Zap} label={t.nav.fate} />
            <NavButton target={AppMode.COIN} icon={CircleDollarSign} label={t.nav.coin} />
            <NavButton target={AppMode.STATS} icon={Activity} label={t.nav.data} />
            <NavButton target={AppMode.WALL} icon={Trophy} label="WALL" />
            {/* Merch Icon for Nav */}
            <button
                onClick={() => handleModeChange(AppMode.MERCH)}
                onMouseEnter={() => soundManager.playHover()}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full border transition-all duration-300 font-mono text-xs md:text-sm whitespace-nowrap
                    ${mode === AppMode.MERCH
                    ? 'bg-yolo-pink text-yolo-black border-yolo-pink font-bold' 
                    : 'bg-transparent text-yolo-white border-transparent hover:border-yolo-gray'
                    }`}
            >
                <ShoppingBag className="w-4 h-4" />
            </button>
            {/* 用户按钮 */}
            {user ? (
              <button
                onClick={() => handleModeChange(AppMode.PROFILE)}
                onMouseEnter={() => soundManager.playHover()}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full border transition-all duration-300 font-mono text-xs md:text-sm whitespace-nowrap
                  ${mode === AppMode.PROFILE
                    ? 'bg-yolo-lime text-yolo-black border-yolo-lime font-bold' 
                    : 'bg-transparent text-yolo-white border-transparent hover:border-yolo-gray'
                  }`}
              >
                <User className="w-4 h-4" />
                <span className="hidden lg:inline">{user.nickname || user.username}</span>
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                onMouseEnter={() => soundManager.playHover()}
                className="flex items-center space-x-2 px-3 py-2 rounded-full border border-yolo-pink text-yolo-pink hover:bg-yolo-pink hover:text-black transition-all duration-300 font-mono text-xs md:text-sm whitespace-nowrap"
              >
                <User className="w-4 h-4" />
                <span className="hidden lg:inline">LOGIN</span>
              </button>
            )}
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
          <div className="min-h-screen pt-32 pb-12 px-6 flex flex-col items-center">
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
                  className="group cursor-pointer border border-yolo-gray p-8 hover:bg-yolo-pink transition-colors duration-300 relative overflow-hidden h-64 flex flex-col justify-end bg-black/50 backdrop-blur-sm"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity transform group-hover:scale-125 duration-500">
                    <Zap className="w-32 h-32 text-black" />
                  </div>
                  <h3 className="text-3xl font-bold font-mono mb-2 group-hover:text-black z-10">{t.home.chaosCardTitle}</h3>
                  <p className="text-yolo-gray group-hover:text-black/80 z-10">{t.home.chaosCardDesc}</p>
                </div>

                <div 
                  onClick={() => handleModeChange(AppMode.STATS)}
                  onMouseEnter={() => soundManager.playHover()}
                  className="group cursor-pointer border border-yolo-gray p-8 hover:bg-yolo-lime transition-colors duration-300 relative overflow-hidden h-64 flex flex-col justify-end bg-black/50 backdrop-blur-sm"
                >
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity transform group-hover:scale-125 duration-500">
                    <Activity className="w-32 h-32 text-black" />
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
          <div className="min-h-[100dvh] pt-24 bg-yolo-black">
             <DareGenerator />
          </div>
        )}

        {mode === AppMode.STATS && (
          <div className="min-h-[100dvh] pt-24 bg-yolo-black flex items-center justify-center">
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
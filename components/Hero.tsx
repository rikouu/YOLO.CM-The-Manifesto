import React, { useEffect, useState, useMemo } from 'react';
import { ArrowDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { soundManager } from '../services/soundService';

interface HeroProps {
  onStart: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [timeState, setTimeState] = useState({
    dateStr: '',
    countdownStr: ''
  });
  const { t } = useLanguage();
  const [isHovering, setIsHovering] = useState(false);

  // Generate 300 stars with depth and twinkle properties
  const stars = useMemo(() => {
    return Array.from({ length: 300 }).map((_, i) => {
      // 1: Background (Far), 2: Mid, 3: Foreground (Close)
      const layer = Math.floor(Math.random() * 3) + 1; 
      
      // Closer stars are generally larger
      const baseSize = layer === 1 ? 1.5 : layer === 2 ? 2.5 : 3.5;
      
      return {
        id: i,
        x: Math.random() * 100, // percentage
        y: Math.random() * 100, // percentage
        size: Math.random() * baseSize * 0.8,
        layer,
        // Twinkle Logic
        isTwinkling: Math.random() > 0.4, // 60% chance to twinkle
        twinkleDuration: (Math.random() * 3 + 2).toFixed(2) + 's', // 2-5s
        twinkleDelay: (Math.random() * 5).toFixed(2) + 's',
        baseOpacity: layer === 1 ? 0.3 : layer === 2 ? 0.6 : 0.9
      };
    });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize -1 to 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setOffset({ x, y });
    };

    // Gravity Sensor Logic for Mobile
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;

      // Gamma: Left/Right tilt [-90, 90]
      // Beta: Front/Back tilt [-180, 180]
      const tiltX = e.gamma; 
      const tiltY = e.beta; 

      // Calibrate "Zero" at ~45 degrees tilt (holding phone naturally)
      // Sensitivity limit: 25 degrees
      const limit = 25;
      
      // Normalize to -1 to 1 range
      const x = Math.min(Math.max(tiltX, -limit), limit) / limit;
      // Subtract 45 from beta to center the effect when holding phone at 45deg
      const y = Math.min(Math.max(tiltY - 45, -limit), limit) / limit;

      setOffset({ x, y });
    };

    // Real-time Countdown Logic
    const updateTime = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setHours(24, 0, 0, 0);
        
        const diff = tomorrow.getTime() - now.getTime();
        
        // Format Header: DAY YYYY/MM/DD GMT+X
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const dayName = days[now.getDay()];
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        
        // Get Timezone offset (e.g., -480 min -> +8)
        const offsetMin = now.getTimezoneOffset();
        const offsetH = -offsetMin / 60;
        const sign = offsetH >= 0 ? '+' : '-';
        const gmt = `GMT${sign}${Math.abs(offsetH)}`;

        const dateStr = `${dayName} ${yyyy}/${mm}/${dd} ${gmt}`;

        // Format Countdown: HH:MM:SS:MS
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        const ms = Math.floor(diff % 1000);

        const pad = (n: number, width: number = 2) => String(n).padStart(width, '0');
        const countdownStr = `${pad(h)}:${pad(m)}:${pad(s)}:${pad(ms, 3)}`;

        setTimeState({ dateStr, countdownStr });
    };
    
    // High refresh rate for milliseconds
    const interval = setInterval(updateTime, 16); 
    updateTime(); // Initial call

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('deviceorientation', handleOrientation);
        clearInterval(interval);
    };
  }, []);

  // Request Permission handler for iOS 13+
  const handleStart = async () => {
    // Check if requestPermission exists (iOS 13+)
    if (
        typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
        try {
            const permissionState = await (DeviceOrientationEvent as any).requestPermission();
            if (permissionState === 'granted') {
                // Permission granted, listeners will start working
            }
        } catch (e) {
            console.error('Orientation permission denied or error', e);
        }
    }
    soundManager.playClick();
    onStart();
  };

  // Styles for the RGB split effect
  const rgbShiftX = offset.x * 15;
  const rgbShiftY = offset.y * 15;
  
  const logoStyle: React.CSSProperties = {
    textShadow: `
      ${rgbShiftX}px ${rgbShiftY}px 0 rgba(204, 255, 0, 0.7), 
      ${-rgbShiftX}px ${-rgbShiftY}px 0 rgba(255, 0, 204, 0.7)
    `,
    transform: `
      perspective(1000px)
      rotateX(${offset.y * -5}deg)
      rotateY(${offset.x * 5}deg)
      scale(${isHovering ? 1.05 : 1})
    `
  };

  return (
    // Changed min-h-screen to h-[100dvh] for better mobile viewport handling
    // overflow-hidden is key to prevent scrolling on the hero
    <div className="relative h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden bg-yolo-black cursor-crosshair touch-none">
      
      {/* 0. Global Noise & Scanlines provided by index.html classes, adding local container specifics */}
      <div className="bg-noise"></div>
      <div className="bg-scanlines opacity-20"></div>

      {/* Local Style for Twinkle Animation */}
      <style>{`
        @keyframes twinkle {
            0%, 100% { opacity: var(--base-opacity); transform: scale(1); }
            50% { opacity: 0.1; transform: scale(0.6); }
        }
      `}</style>

      {/* 1. Dynamic Starfield with Parallax Depth */}
      <div className="absolute inset-0 z-0 pointer-events-none perspective-1000 overflow-hidden">
        {stars.map((star) => {
            // Parallax Calculation
            // Background (Layer 1) moves little, Foreground (Layer 3) moves more.
            // Move opposite to mouse to simulate camera panning.
            const movementFactor = star.layer * 20; 
            const parallaxX = offset.x * -movementFactor;
            const parallaxY = offset.y * -movementFactor;
            
            return (
                <div 
                    key={star.id}
                    className="absolute rounded-full bg-white will-change-transform"
                    style={{
                        top: `${star.y}%`,
                        left: `${star.x}%`,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        opacity: star.baseOpacity,
                        transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0)`,
                        transition: 'transform 0.2s cubic-bezier(0.1, 0.5, 0.5, 1)', // Smooth lag
                        boxShadow: star.layer === 3 ? `0 0 ${star.size + 2}px rgba(255,255,255,0.6)` : 'none',
                        // CSS Variables for animation
                        '--base-opacity': star.baseOpacity,
                        animation: star.isTwinkling 
                            ? `twinkle ${star.twinkleDuration} ease-in-out infinite ${star.twinkleDelay}` 
                            : 'none'
                    } as React.CSSProperties}
                />
            );
        })}
        
        {/* Retro Grid Floor */}
        <div className="absolute bottom-0 left-0 w-full h-[40vh] md:h-[50vh] bg-[linear-gradient(to_bottom,transparent_0%,rgba(204,255,0,0.1)_100%)] transform-gpu"
             style={{
                 backgroundImage: `linear-gradient(rgba(204,255,0,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(204,255,0,0.2) 1px, transparent 1px)`,
                 backgroundSize: '100px 100px',
                 transform: `perspective(500px) rotateX(60deg) translateY(${offset.y * 50}px) translateX(${offset.x * -30}px) translateZ(-100px)`,
                 transformOrigin: 'bottom center',
                 transition: 'transform 0.1s linear'
             }}
        ></div>
      </div>

      {/* 2. Attitude HUD Elements - Visible on Mobile now */}
      <div className="absolute top-4 left-4 md:top-12 md:left-12 z-20 font-mono text-[10px] md:text-sm text-yolo-lime tracking-widest pointer-events-none">
          <div className="flex items-center gap-2 mb-2 animate-pulse">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-yolo-danger rounded-full"></div>
              <span>SYSTEM: CRITICAL</span>
          </div>
          <div className="opacity-70">COORDS: {offset.x.toFixed(3)} // {offset.y.toFixed(3)}</div>
      </div>

      {/* Warning HUD: Moved to top-24 on mobile to ensure it clears Language Switcher which is fixed at top-4 right-6 */}
      <div className="absolute top-24 right-4 md:top-12 md:right-12 z-20 text-right max-w-[150px] md:max-w-none pointer-events-none">
          <div className="bg-yolo-danger text-black font-black font-mono px-2 py-0.5 md:px-4 md:py-1 text-[10px] md:text-base transform rotate-2 animate-pulse inline-block whitespace-nowrap">
              WARNING: ONE LIFE LEFT
          </div>
          <div className="mt-1 md:mt-2 font-mono text-yolo-gray text-[9px] md:text-xs tracking-[0.2em]">
              NO RESPAWNS DETECTED
          </div>
      </div>

      {/* 3. Main Hero Content */}
      <div className="z-10 relative flex flex-col items-center justify-center w-full max-w-[95vw] md:max-w-[90vw]">
        
        {/* Floating "EST. 202X" badge - Hidden on tiny screens, visible on md */}
        <div 
            className="absolute -top-20 left-10 hidden md:block border border-yolo-gray px-3 py-1 rounded-full text-yolo-gray font-mono text-xs tracking-widest pointer-events-none"
            style={{ transform: `translate(${offset.x * -30}px, ${offset.y * -30}px)` }}
        >
            EST. 202X • THE VOID
        </div>

        {/* THE LOGO */}
        <div 
            className="relative group cursor-pointer mb-6 md:mb-12 select-none"
            onMouseEnter={() => { setIsHovering(true); soundManager.playHover(); }}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => { soundManager.playClick(); }}
        >
             {/* Glow Behind */}
             <div className={`absolute inset-0 bg-yolo-lime/10 blur-[80px] md:blur-[100px] rounded-full transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-20'}`}></div>

             <div className="relative inline-block">
                {/* Responsive Font Size: Slightly smaller on mobile to ensure .CM fits comfortably */}
                <h1 
                    className="text-[18vw] md:text-[20vw] leading-none font-black text-yolo-white transition-transform duration-75 mix-blend-screen relative z-10"
                    style={logoStyle}
                >
                    YOLO
                </h1>
                
                {/* Glitch Overlay Text */}
                {isHovering && (
                    <h1 className="absolute inset-0 text-[18vw] md:text-[20vw] leading-none font-black text-yolo-pink opacity-50 animate-glitch mix-blend-overlay pointer-events-none z-20">
                        YOLO
                    </h1>
                )}

                {/* .CM Tag - Repositioned: Mobile vs Desktop 
                    Moved to absolute bottom right with significant negative margin to ensure no overlap 
                */}
                <div className="absolute -bottom-4 -right-2 md:-bottom-8 md:-right-12 flex items-center gap-1 md:gap-2 z-30 transform translate-x-2 md:translate-x-0">
                    <div className="w-2 h-2 md:w-6 md:h-6 bg-yolo-pink animate-bounce"></div>
                    <span className="text-[5vw] md:text-[3vw] font-black text-yolo-white tracking-tighter shadow-black drop-shadow-2xl">CM</span>
                </div>
             </div>
        </div>

        {/* Rotating Motto - Scaled down height for mobile */}
        <div className="relative w-full h-8 md:h-12 flex items-center justify-center overflow-hidden mb-8 md:mb-12 mix-blend-difference opacity-80 max-w-[90vw]">
            <div className="absolute flex space-x-8 font-mono font-bold text-yolo-lime text-xs md:text-2xl tracking-widest animate-marquee whitespace-nowrap">
                <span>MOMENTO MORI</span>
                <span>//</span>
                <span>CARPE DIEM</span>
                <span>//</span>
                <span>NO REGRETS</span>
                <span>//</span>
                <span>TIME IS TICKING</span>
                <span>//</span>
                <span>MOMENTO MORI</span>
                <span>//</span>
                <span>CARPE DIEM</span>
            </div>
        </div>

        {/* 4. CTA Button - Scale padding on mobile */}
        <button 
            onClick={handleStart}
            onMouseEnter={() => soundManager.playHover()}
            className="group relative inline-block focus:outline-none"
        >
            <span className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-yolo-pink transition-transform group-hover:translate-x-0 group-hover:translate-y-0 group-hover:bg-yolo-lime"></span>
            <span className="relative inline-flex items-center gap-3 border-2 border-current px-8 py-3 md:px-12 md:py-5 text-base md:text-xl font-black uppercase tracking-widest text-yolo-white bg-black group-hover:text-black group-hover:bg-yolo-lime transition-colors duration-200">
                <span className="group-hover:animate-pulse whitespace-nowrap">{t.hero.enter}</span>
                <ArrowDown className="w-4 h-4 md:w-6 md:h-6 animate-bounce" />
            </span>
        </button>
        
        {/* Daily Countdown Timer - Optimized for mobile readability */}
        <div className="mt-8 md:mt-12 font-mono text-center w-full px-4">
            <p className="text-yolo-lime font-bold text-[10px] md:text-sm mb-2 tracking-widest uppercase shadow-black drop-shadow-md opacity-90 break-words">
                {timeState.dateStr}
            </p>
            <div className="inline-block text-yolo-white text-base md:text-2xl font-bold tabular-nums tracking-widest bg-black/50 px-4 py-2 border border-yolo-gray/30 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                    <span className="text-yolo-lime text-[10px] md:text-base mb-1 md:mb-0">TIME REMAINING</span> 
                    <span>{timeState.countdownStr}</span>
                </div>
            </div>
        </div>

      </div>

    </div>
  );
};

export default Hero;
import React, { useState, useRef, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { soundManager } from '../services/soundService';
import { Sparkles, RotateCcw, Zap } from 'lucide-react';

const YoloCoin: React.FC = () => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'doit' | 'dont' | 'remix' | null>(null);
  const [rotation, setRotation] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isDeciding, setIsDeciding] = useState(false);
  
  const animationRef = useRef<number>(0);
  const speedRef = useRef(0);
  const rotationRef = useRef(0);
  const accelRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const animate = useCallback(() => {
    rotationRef.current += speedRef.current;
    setRotation(rotationRef.current);
    if (speedRef.current > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, []);

  const startHold = () => {
    if (!input.trim() || result || isDeciding) return;
    setIsHolding(true);
    setResult(null);
    soundManager.playClick();
    if (navigator.vibrate) navigator.vibrate(30);

    if (speedRef.current === 0) {
      speedRef.current = 2;
      setSpeed(2);
      animationRef.current = requestAnimationFrame(animate);
    }
    
    accelRef.current = setInterval(() => {
      if (speedRef.current < 30) {
        speedRef.current += 1.5;
        setSpeed(speedRef.current);
      }
    }, 50);
  };

  const stopHold = () => {
    if (!isHolding) return;
    setIsHolding(false);
    if (accelRef.current) clearInterval(accelRef.current);

    if (speedRef.current < 5) {
      speedRef.current = 0;
      setSpeed(0);
      return;
    }

    setIsDeciding(true);
    soundManager.playSuccess();
    if (navigator.vibrate) navigator.vibrate(50);

    const rand = Math.random();
    let outcome: 'doit' | 'dont' | 'remix';
    if (rand > 0.5) outcome = 'doit';
    else if (rand > 0.2) outcome = 'remix';
    else outcome = 'dont';

    const decelerate = () => {
      speedRef.current *= 0.95;
      setSpeed(speedRef.current);
      if (speedRef.current < 0.5) {
        speedRef.current = 0;
        setSpeed(0);
        setIsDeciding(false);
        setResult(outcome);
        if (navigator.vibrate) navigator.vibrate([50, 30, 100]);
      } else {
        requestAnimationFrame(decelerate);
      }
    };
    decelerate();
  };

  const reset = () => {
    soundManager.playClick();
    setResult(null);
    setInput('');
    setRotation(0);
    setSpeed(0);
    rotationRef.current = 0;
    speedRef.current = 0;
  };

  const getResultStyle = () => {
    if (result === 'doit') return { color: '#ccff00', glow: 'rgba(204,255,0,0.5)' };
    if (result === 'dont') return { color: '#ef4444', glow: 'rgba(239,68,68,0.5)' };
    if (result === 'remix') return { color: '#ff00cc', glow: 'rgba(255,0,204,0.5)' };
    return { color: '#666', glow: 'transparent' };
  };

  const style = getResultStyle();
  const speedPercent = Math.min(100, Math.round((speed / 30) * 100));

  return (
    <div className="min-h-[100dvh] bg-yolo-black flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden select-none">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,30,30,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,30,30,0.5)_1px,transparent_1px)] bg-[size:50px_50px] opacity-30" />
      </div>

      <h1 className="text-4xl md:text-6xl font-black text-white/10 uppercase tracking-tighter mb-8 text-center">
        {t.coin.title}
      </h1>

      <div className="relative mb-8">
        {speed > 0 && (
          <div 
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ 
              background: `conic-gradient(from 0deg, ${speed > 20 ? '#00ffff' : '#ccff00'}88, transparent)`,
              transform: `scale(1.3) rotate(${rotation}deg)`,
              filter: 'blur(15px)',
              opacity: speed / 30
            }}
          />
        )}

        {result && (
          <div 
            className="absolute inset-0 rounded-full blur-3xl animate-pulse"
            style={{ background: style.glow, transform: 'scale(1.5)', opacity: 0.6 }}
          />
        )}

        <div 
          className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full ${!input.trim() ? 'opacity-30' : ''}`}
          style={{ transform: `rotateY(${rotation}deg)`, transformStyle: 'preserve-3d' }}
        >
          <div
            className="w-full h-full rounded-full flex items-center justify-center border-4 transition-colors duration-300"
            style={{
              background: result 
                ? `radial-gradient(circle at 30% 30%, ${style.color}33, #1a1a1a 70%)`
                : speed > 20 ? 'radial-gradient(circle at 30% 30%, #00ffff33, #1a1a1a 70%)'
                : speed > 0 ? 'radial-gradient(circle at 30% 30%, #ccff0033, #1a1a1a 70%)'
                : 'radial-gradient(circle at 30% 30%, #333, #1a1a1a 70%)',
              borderColor: result ? style.color : speed > 20 ? '#00ffff' : speed > 0 ? '#ccff00' : '#444',
              boxShadow: result 
                ? `0 0 40px ${style.glow}, inset 0 0 30px rgba(0,0,0,0.5)`
                : speed > 0 ? `0 0 ${speed}px ${speed > 20 ? '#00ffff' : '#ccff00'}, inset 0 0 30px rgba(0,0,0,0.5)`
                : 'inset 0 0 30px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            {result ? (
              <div className="text-center p-4 animate-in zoom-in duration-300">
                <div className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-1" style={{ color: style.color }}>
                  {t.coin.results[result]}
                </div>
                <Sparkles className="w-5 h-5 mx-auto opacity-60" style={{ color: style.color }} />
              </div>
            ) : (
              <span 
                className="text-4xl md:text-5xl font-black select-none transition-colors"
                style={{ color: speed > 20 ? '#00ffff' : speed > 0 ? '#ccff00' : 'rgba(255,255,255,0.2)' }}
              >
                YOLO
              </span>
            )}
          </div>
        </div>

        {speed > 0 && !result && (
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
            <div className="font-mono text-sm font-bold" style={{ color: speed > 20 ? '#00ffff' : '#ccff00' }}>
              {speed > 25 ? '⚡ MAX!' : `${speedPercent}%`}
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="max-w-md text-center mb-8 animate-in slide-in-from-bottom-4 duration-500">
          <p className="font-mono text-lg md:text-xl leading-relaxed px-4 py-3 rounded-lg border-l-4"
            style={{ color: 'white', borderColor: style.color, background: 'rgba(0,0,0,0.5)' }}>
            {t.coin.descriptions[result]}
          </p>
        </div>
      )}

      <div className="w-full max-w-md space-y-4">
        {!result ? (
          <>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.coin.placeholder}
              disabled={isHolding || isDeciding}
              className="w-full bg-black/50 border-2 border-yolo-gray/50 focus:border-yolo-lime rounded-none
                text-white p-4 font-mono text-center text-lg uppercase
                focus:outline-none focus:shadow-[0_0_20px_rgba(204,255,0,0.2)]
                placeholder:text-white/20 transition-all disabled:opacity-50"
            />
            <button
              onMouseDown={startHold}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={startHold}
              onTouchEnd={stopHold}
              disabled={!input.trim() || isDeciding}
              className={`w-full py-5 font-black font-mono text-lg uppercase tracking-wider border-2 transition-all duration-100 touch-none flex items-center justify-center gap-3
                ${!input.trim() || isDeciding ? 'bg-transparent border-yolo-gray/30 text-yolo-gray/30 cursor-not-allowed'
                  : isHolding ? speed > 20 ? 'bg-cyan-400 border-cyan-400 text-black' : 'bg-yolo-lime border-yolo-lime text-black'
                  : 'bg-transparent border-yolo-lime text-yolo-lime hover:bg-yolo-lime hover:text-black'}`}
            >
              <Zap className={`w-5 h-5 ${isHolding ? 'animate-pulse' : ''}`} />
              {isDeciding ? 'DECIDING...' : isHolding ? speed > 25 ? '⚡ RELEASE!' : 'HOLD...' : 'HOLD TO SPIN'}
            </button>
          </>
        ) : (
          <button
            onClick={reset}
            className="w-full py-5 font-black font-mono text-lg uppercase tracking-wider bg-white text-black border-2 border-white hover:bg-yolo-lime hover:border-yolo-lime transition-all duration-200 flex items-center justify-center gap-3"
          >
            <RotateCcw className="w-5 h-5" />
            TRY AGAIN
          </button>
        )}
      </div>
    </div>
  );
};

export default YoloCoin;

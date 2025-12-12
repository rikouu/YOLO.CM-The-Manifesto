import React, { useState, useRef, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { soundManager } from '../services/soundService';
import { Sparkles, RotateCcw, Rocket, Skull, Shuffle } from 'lucide-react';

const YoloCoin: React.FC = () => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'doit' | 'dont' | 'remix' | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [isDecelerating, setIsDecelerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  const speedRef = useRef(0);
  const rotationRef = useRef(0);
  const animationRef = useRef<number>(0);
  const accelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 持续旋转动画
  const animate = useCallback(() => {
    rotationRef.current += speedRef.current;
    setRotation(rotationRef.current);
    if (speedRef.current > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, []);

  // 按下开始旋转
  const handleHoldStart = () => {
    if (!input.trim() || showResult || isDecelerating) return;
    
    setIsHolding(true);
    setResult(null);
    soundManager.playClick();
    if (navigator.vibrate) navigator.vibrate(30);

    // 开始加速
    if (speedRef.current === 0) {
      speedRef.current = 3;
      setSpeed(3);
      animationRef.current = requestAnimationFrame(animate);
    }

    // 持续加速
    accelIntervalRef.current = setInterval(() => {
      if (speedRef.current < 25) {
        speedRef.current += 1;
        setSpeed(speedRef.current);
        // 速度越快震动越强
        if (navigator.vibrate && speedRef.current % 5 === 0) {
          navigator.vibrate(10);
        }
      }
    }, 80);
  };

  // 松开开始减速
  const handleHoldEnd = () => {
    if (!isHolding) return;
    
    setIsHolding(false);
    if (accelIntervalRef.current) {
      clearInterval(accelIntervalRef.current);
      accelIntervalRef.current = null;
    }

    // 速度太低，直接停止
    if (speedRef.current < 8) {
      speedRef.current = 0;
      setSpeed(0);
      return;
    }

    setIsDecelerating(true);
    soundManager.playSuccess();
    if (navigator.vibrate) navigator.vibrate(50);

    // 决定结果
    const rand = Math.random();
    let outcome: 'doit' | 'dont' | 'remix';
    if (rand > 0.5) outcome = 'doit';
    else if (rand > 0.2) outcome = 'remix';
    else outcome = 'dont';

    // 减速动画
    const decelerate = () => {
      speedRef.current *= 0.97;
      rotationRef.current += speedRef.current;
      setRotation(rotationRef.current);
      setSpeed(speedRef.current);

      if (speedRef.current < 0.3) {
        speedRef.current = 0;
        setSpeed(0);
        setIsDecelerating(false);
        setResult(outcome);
        setShowResult(true);
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
    setShowResult(false);
    setInput('');
    setRotation(0);
    setSpeed(0);
    rotationRef.current = 0;
    speedRef.current = 0;
  };

  const getResultConfig = () => {
    if (result === 'doit') return { color: '#ccff00', Icon: Rocket, glow: 'rgba(204,255,0,0.5)' };
    if (result === 'dont') return { color: '#ef4444', Icon: Skull, glow: 'rgba(239,68,68,0.5)' };
    if (result === 'remix') return { color: '#ff00cc', Icon: Shuffle, glow: 'rgba(255,0,204,0.5)' };
    return { color: '#444', Icon: Sparkles, glow: 'transparent' };
  };

  const config = getResultConfig();
  const canInteract = input.trim() && !showResult && !isDecelerating;
  const isSpinning = speed > 0;

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center px-3 sm:px-4 md:px-6 pt-16 md:pt-20 pb-6 relative overflow-hidden select-none">
      {/* 背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(${isSpinning ? '#ccff00' : '#333'}44 1px, transparent 1px),
                              linear-gradient(90deg, ${isSpinning ? '#ccff00' : '#333'}44 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* 旋转光晕 */}
        {isSpinning && !showResult && (
          <div 
            className="absolute inset-0 transition-opacity"
            style={{
              background: `radial-gradient(circle at 50% 45%, ${speed > 15 ? '#00ffff' : '#ccff00'}${Math.floor(speed * 3).toString(16).padStart(2, '0')} 0%, transparent 50%)`,
            }}
          />
        )}

        {/* 结果光晕 */}
        {showResult && (
          <div 
            className="absolute inset-0 animate-pulse"
            style={{
              background: `radial-gradient(circle at 50% 40%, ${config.glow} 0%, transparent 60%)`,
            }}
          />
        )}
      </div>

      {/* 标题 */}
      <div className="relative z-10 mb-4 sm:mb-6 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-1">
          {t.coin.title}
        </h1>
        <p className="text-white/30 font-mono text-[10px] sm:text-xs tracking-widest">
          {showResult ? 'THE UNIVERSE HAS SPOKEN' : isHolding ? 'KEEP HOLDING!' : isDecelerating ? 'DECIDING...' : 'HOLD THE COIN'}
        </p>
      </div>

      {/* 硬币 */}
      <div
        className={`relative z-10 mb-4 sm:mb-6 ${canInteract ? 'cursor-pointer' : ''}`}
        onMouseDown={canInteract ? handleHoldStart : undefined}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        onTouchStart={canInteract ? handleHoldStart : undefined}
        onTouchEnd={handleHoldEnd}
      >
        {/* 外圈装饰 */}
        <div 
          className={`absolute -inset-4 rounded-full border-2 border-dashed transition-all duration-200 ${
            isHolding ? 'border-yolo-lime opacity-100' : isSpinning ? 'border-cyan-400 opacity-60' : 'border-white/10 opacity-30'
          }`}
          style={{ transform: `rotate(${rotation * 0.5}deg)` }}
        />

        {/* 主硬币 - 优化响应式尺寸 */}
        <div
          className={`relative w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64 rounded-full transition-all duration-200 ${
            !input.trim() ? 'opacity-30' : 'opacity-100'
          } ${isHolding ? 'scale-105' : ''}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              background: showResult
                ? `conic-gradient(from 0deg, ${config.color}33, #111, ${config.color}33)`
                : isSpinning
                ? `conic-gradient(from ${rotation}deg, #ccff0033, #111, ${speed > 15 ? '#00ffff33' : '#ff00cc33'}, #111, #ccff0033)`
                : 'radial-gradient(circle at 30% 30%, #222, #0a0a0a)',
              border: `3px solid ${showResult ? config.color : isHolding ? '#ccff00' : isSpinning ? '#00ffff' : '#333'}`,
              boxShadow: showResult
                ? `0 0 60px ${config.glow}, inset 0 0 30px rgba(0,0,0,0.8)`
                : isSpinning
                ? `0 0 ${speed * 2}px ${speed > 15 ? '#00ffff' : '#ccff00'}, inset 0 0 30px rgba(0,0,0,0.8)`
                : 'inset 0 0 40px rgba(0,0,0,0.9), 0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            {/* 内部装饰 */}
            <div className="absolute inset-4 rounded-full border border-white/10" />
            <div className="absolute inset-8 rounded-full border border-white/5" />
            
            {/* 刻度线 */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-3 bg-white/20"
                style={{
                  top: '8px',
                  left: '50%',
                  transformOrigin: '50% calc(104px - 8px)',
                  transform: `translateX(-50%) rotate(${i * 30}deg)`,
                }}
              />
            ))}

            {/* 内容 */}
            <div 
              className="relative z-10 text-center"
              style={{ transform: `rotate(${-rotation}deg)` }}
            >
              {showResult ? (
                <div className="animate-in zoom-in duration-300">
                  <config.Icon
                    className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2"
                    style={{ color: config.color, filter: `drop-shadow(0 0 10px ${config.glow})` }}
                  />
                  <div
                    className="text-xl sm:text-2xl md:text-3xl font-black uppercase"
                    style={{ color: config.color, textShadow: `0 0 20px ${config.glow}` }}
                  >
                    {t.coin.results[result!]}
                  </div>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mt-1" style={{ color: config.color }} />
                </div>
              ) : (
                <div>
                  <span
                    className={`text-3xl sm:text-4xl md:text-5xl font-black transition-colors ${
                      isHolding ? 'text-yolo-lime' : isSpinning ? 'text-cyan-400' : 'text-white/20'
                    }`}
                  >
                    {isSpinning ? '?' : 'YOLO'}
                  </span>
                  {canInteract && !isSpinning && (
                    <p className="text-white/30 text-[10px] sm:text-xs mt-1.5 sm:mt-2 font-mono animate-pulse">
                      HOLD ME
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 速度指示 */}
        {isSpinning && !showResult && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            <div 
              className="font-mono text-sm font-bold"
              style={{ color: speed > 15 ? '#00ffff' : '#ccff00' }}
            >
              {speed > 20 ? '⚡ MAX!' : `${Math.floor(speed * 4)}%`}
            </div>
          </div>
        )}
      </div>

      {/* 结果描述 */}
      {showResult && (
        <div className="max-w-xs sm:max-w-sm text-center mb-4 sm:mb-6 animate-in slide-in-from-bottom duration-500 z-10 px-2">
          <div
            className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg border-l-4"
            style={{ borderColor: config.color, background: `linear-gradient(90deg, ${config.color}11, transparent)` }}
          >
            <p className="font-mono text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">
              {t.coin.descriptions[result!]}
            </p>
          </div>
        </div>
      )}

      {/* 输入框和按钮 */}
      <div className="w-full max-w-xs sm:max-w-sm space-y-2.5 sm:space-y-3 z-10 px-2">
        {!showResult ? (
          <input
            type="text"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder={t.coin.placeholder}
            disabled={isSpinning}
            className="w-full bg-white/5 border border-white/20 focus:border-yolo-lime rounded-lg
              text-white p-3 sm:p-4 font-mono text-center text-sm sm:text-base
              focus:outline-none focus:shadow-[0_0_20px_rgba(204,255,0,0.15)]
              placeholder:text-white/30 transition-all disabled:opacity-50"
          />
        ) : (
          <button
            onClick={reset}
            className="w-full py-3 sm:py-4 font-black font-mono text-sm sm:text-base uppercase tracking-wider rounded-lg
              bg-white text-black hover:bg-yolo-lime active:scale-[0.98] transition-all duration-200
              flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            TRY AGAIN
          </button>
        )}
      </div>

      {/* 底部提示 */}
      {canInteract && !isSpinning && (
        <p className="absolute bottom-4 sm:bottom-6 text-white/20 text-[10px] sm:text-xs font-mono z-10">
          ↑ Hold the coin to spin, release to stop
        </p>
      )}
    </div>
  );
};

export default YoloCoin;

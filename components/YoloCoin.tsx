import React, { useState, useRef, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { soundManager } from '../services/soundService';
import { Sparkles, RotateCcw, Hand, Rocket, Skull, Shuffle } from 'lucide-react';

const YoloCoin: React.FC = () => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'doit' | 'dont' | 'remix' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [energy, setEnergy] = useState(0); // 0-100 能量值
  const [isReleased, setIsReleased] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  const coinRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef(0);
  const velocityRef = useRef(0);
  const rotationRef = useRef(0);

  // 计算触摸/鼠标相对于硬币中心的角度
  const getAngle = useCallback((clientX: number, clientY: number) => {
    if (!coinRef.current) return 0;
    const rect = coinRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  }, []);

  // 开始拖拽
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (!input.trim() || showResult || isReleased) return;
    setIsDragging(true);
    lastAngleRef.current = getAngle(clientX, clientY);
    velocityRef.current = 0;
    soundManager.playClick();
  }, [input, showResult, isReleased, getAngle]);

  // 拖拽中
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const currentAngle = getAngle(clientX, clientY);
    let delta = currentAngle - lastAngleRef.current;
    
    // 处理角度跨越 -180/180 的情况
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    
    rotationRef.current += delta;
    setRotation(rotationRef.current);
    
    // 计算速度和能量
    velocityRef.current = delta;
    const newEnergy = Math.min(100, energy + Math.abs(delta) * 0.5);
    setEnergy(newEnergy);
    
    lastAngleRef.current = currentAngle;
    
    // 震动反馈
    if (Math.abs(delta) > 5 && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [isDragging, energy, getAngle]);

  // 释放
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (energy < 30) {
      // 能量不足，重置
      setEnergy(0);
      return;
    }

    setIsReleased(true);
    soundManager.playSuccess();
    if (navigator.vibrate) navigator.vibrate(100);

    // 决定结果
    const rand = Math.random();
    let outcome: 'doit' | 'dont' | 'remix';
    if (rand > 0.5) outcome = 'doit';
    else if (rand > 0.2) outcome = 'remix';
    else outcome = 'dont';

    // 惯性旋转动画
    let currentVelocity = velocityRef.current * 2 + (energy / 10);
    const friction = 0.97;
    
    const animate = () => {
      currentVelocity *= friction;
      rotationRef.current += currentVelocity;
      setRotation(rotationRef.current);
      
      if (Math.abs(currentVelocity) > 0.5) {
        requestAnimationFrame(animate);
      } else {
        // 旋转结束，显示结果
        setTimeout(() => {
          setResult(outcome);
          setShowResult(true);
          if (navigator.vibrate) navigator.vibrate([50, 30, 100]);
        }, 300);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isDragging, energy]);

  // 鼠标事件
  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX, e.clientY);
  const onMouseUp = () => handleDragEnd();
  const onMouseLeave = () => { if (isDragging) handleDragEnd(); };

  // 触摸事件
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };
  const onTouchEnd = () => handleDragEnd();

  const reset = () => {
    soundManager.playClick();
    setResult(null);
    setShowResult(false);
    setInput('');
    setRotation(0);
    setEnergy(0);
    setIsReleased(false);
    rotationRef.current = 0;
    velocityRef.current = 0;
  };

  const getResultConfig = () => {
    if (result === 'doit') return { color: '#ccff00', Icon: Rocket, glow: 'rgba(204,255,0,0.6)' };
    if (result === 'dont') return { color: '#ef4444', Icon: Skull, glow: 'rgba(239,68,68,0.6)' };
    if (result === 'remix') return { color: '#ff00cc', Icon: Shuffle, glow: 'rgba(255,0,204,0.6)' };
    return { color: '#444', Icon: Sparkles, glow: 'transparent' };
  };

  const config = getResultConfig();
  const canInteract = input.trim() && !showResult && !isReleased;
  
  // 能量条颜色
  const getEnergyColor = () => {
    if (energy < 30) return '#ef4444';
    if (energy < 60) return '#f59e0b';
    return '#ccff00';
  };

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center px-6 py-8 relative overflow-hidden select-none">
      {/* 背景效果 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 网格 */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(${isDragging ? '#ccff00' : '#333'}44 1px, transparent 1px),
              linear-gradient(90deg, ${isDragging ? '#ccff00' : '#333'}44 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* 能量光晕 */}
        {(isDragging || isReleased) && !showResult && (
          <div 
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at 50% 45%, ${getEnergyColor()}${Math.floor(energy * 0.4).toString(16).padStart(2, '0')} 0%, transparent 50%)`,
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
      <div className="relative z-10 mb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-1">
          {t.coin.title}
        </h1>
        <p className="text-white/30 font-mono text-xs tracking-widest">
          {showResult ? 'THE UNIVERSE HAS SPOKEN' : isDragging ? 'KEEP SPINNING!' : 'DRAG TO SPIN'}
        </p>
      </div>

      {/* 能量条 */}
      {!showResult && (
        <div className="w-48 mb-6 z-10">
          <div className="flex justify-between text-xs font-mono mb-1">
            <span style={{ color: getEnergyColor() }}>ENERGY</span>
            <span style={{ color: getEnergyColor() }}>{Math.floor(energy)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-100 rounded-full"
              style={{ 
                width: `${energy}%`,
                background: `linear-gradient(90deg, ${getEnergyColor()}, ${energy > 60 ? '#00ffff' : getEnergyColor()})`,
                boxShadow: energy > 30 ? `0 0 10px ${getEnergyColor()}` : 'none'
              }}
            />
          </div>
          {energy > 0 && energy < 30 && (
            <p className="text-red-400 text-xs font-mono mt-1 text-center animate-pulse">
              Need more energy!
            </p>
          )}
        </div>
      )}

      {/* 硬币区域 */}
      <div 
        ref={coinRef}
        className={`relative mb-6 z-10 ${canInteract ? 'cursor-grab' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={canInteract ? onMouseDown : undefined}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={canInteract ? onTouchStart : undefined}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 外圈 - 能量指示 */}
        <svg 
          className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)]"
          viewBox="0 0 100 100"
        >
          {/* 背景圈 */}
          <circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
          />
          {/* 能量圈 */}
          <circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke={getEnergyColor()}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${energy * 2.89} 289`}
            transform="rotate(-90 50 50)"
            style={{
              filter: energy > 50 ? `drop-shadow(0 0 5px ${getEnergyColor()})` : 'none',
              transition: 'stroke-dasharray 0.1s'
            }}
          />
        </svg>

        {/* 主硬币 */}
        <div 
          className={`relative w-52 h-52 md:w-64 md:h-64 rounded-full transition-transform duration-100 ${
            !input.trim() ? 'opacity-30' : 'opacity-100'
          }`}
          style={{
            transform: `rotate(${rotation}deg) scale(${isDragging ? 1.05 : 1})`,
          }}
        >
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              background: showResult
                ? `conic-gradient(from 0deg, ${config.color}33, #111, ${config.color}33)`
                : isDragging
                ? `conic-gradient(from ${rotation}deg, #ccff0033, #111, #ff00cc33, #111, #ccff0033)`
                : 'radial-gradient(circle at 30% 30%, #222, #0a0a0a)',
              border: `3px solid ${showResult ? config.color : isDragging ? '#ccff00' : '#333'}`,
              boxShadow: showResult
                ? `0 0 60px ${config.glow}, inset 0 0 30px rgba(0,0,0,0.8)`
                : isDragging
                ? `0 0 ${energy / 2}px #ccff00, inset 0 0 30px rgba(0,0,0,0.8)`
                : 'inset 0 0 40px rgba(0,0,0,0.9), 0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            {/* 内部装饰 */}
            <div 
              className="absolute inset-4 rounded-full border border-white/10"
              style={{ transform: `rotate(${-rotation * 0.5}deg)` }}
            />
            <div 
              className="absolute inset-8 rounded-full border border-white/5"
              style={{ transform: `rotate(${rotation * 0.3}deg)` }}
            />
            
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
                    className="w-12 h-12 mx-auto mb-2" 
                    style={{ color: config.color, filter: `drop-shadow(0 0 10px ${config.glow})` }} 
                  />
                  <div 
                    className="text-2xl md:text-3xl font-black uppercase"
                    style={{ color: config.color, textShadow: `0 0 20px ${config.glow}` }}
                  >
                    {t.coin.results[result!]}
                  </div>
                  <Sparkles className="w-5 h-5 mx-auto mt-1" style={{ color: config.color }} />
                </div>
              ) : (
                <div>
                  {canInteract && !isDragging && (
                    <Hand className="w-8 h-8 mx-auto mb-2 text-white/30 animate-bounce" />
                  )}
                  <span 
                    className={`text-3xl md:text-4xl font-black transition-colors ${
                      isDragging ? 'text-yolo-lime' : 'text-white/20'
                    }`}
                  >
                    {isDragging ? Math.floor(energy) : 'YOLO'}
                  </span>
                  {isDragging && (
                    <p className="text-xs text-white/50 mt-1 font-mono">%</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 结果描述 */}
      {showResult && (
        <div className="max-w-sm text-center mb-6 animate-in slide-in-from-bottom duration-500 z-10">
          <div 
            className="px-5 py-3 rounded-lg border-l-4"
            style={{ 
              borderColor: config.color,
              background: `linear-gradient(90deg, ${config.color}11, transparent)`
            }}
          >
            <p className="font-mono text-base md:text-lg text-white/90 leading-relaxed">
              {t.coin.descriptions[result!]}
            </p>
          </div>
        </div>
      )}

      {/* 输入框和按钮 */}
      <div className="w-full max-w-sm space-y-3 z-10">
        {!showResult ? (
          <input
            type="text"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder={t.coin.placeholder}
            disabled={isReleased}
            className="w-full bg-white/5 border border-white/20 focus:border-yolo-lime rounded-lg
              text-white p-4 font-mono text-center text-base
              focus:outline-none focus:shadow-[0_0_20px_rgba(204,255,0,0.15)]
              placeholder:text-white/30 transition-all disabled:opacity-50"
          />
        ) : (
          <button
            onClick={reset}
            className="w-full py-4 font-black font-mono text-base uppercase tracking-wider rounded-lg
              bg-white text-black hover:bg-yolo-lime transition-all duration-200 
              flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-5 h-5" />
            TRY AGAIN
          </button>
        )}
      </div>

      {/* 提示 */}
      {canInteract && !isDragging && (
        <p className="absolute bottom-6 text-white/20 text-xs font-mono z-10">
          ↻ Drag the coin to charge energy, then release
        </p>
      )}
    </div>
  );
};

export default YoloCoin;

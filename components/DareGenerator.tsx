import React, { useState, useEffect, useRef } from 'react';
import { generateYoloChallenge } from '../services/geminiService';
import { Challenge } from '../types';
import { RefreshCw, Zap, Clock, Skull, Download, Trophy, ArrowRight, Binary, X, Camera, Upload, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { soundManager } from '../services/soundService';
import { acceptChallenge, getActiveChallenge, completeChallenge, Challenge as DBChallenge } from '../services/authService';
import { useToast } from './Toast';

const DareGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [mood, setMood] = useState('');
  const [completed, setCompleted] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<DBChallenge | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();

  // 检查是否有进行中的挑战
  useEffect(() => {
    if (user) {
      getActiveChallenge().then(c => {
        if (c) setActiveChallenge(c);
      });
    }
  }, [user]);

  const moods = ["Bored", "Adventurous", "Lazy", "Chaos", "Hungry"];
  
  const loadingMessages = [
    "INITIALIZING NEURAL HANDSHAKE...",
    "SCANNING FOR INSECURITIES...",
    "CALCULATING MAXIMUM REGRET...",
    "INJECTING CHAOS VARIABLES...",
    "OPTIMIZING DOPAMINE RECEPTORS...",
    "ACCESSING AKASHIC RECORDS...",
    "DECIPHERING FATE...",
    "IGNORING SAFETY PROTOCOLS..."
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % loadingMessages.length);
      }, 400);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async (selectedMood: string) => {
    soundManager.playClick();
    setLoading(true);
    setMood(selectedMood);
    setCompleted(false);
    setLoadingMsgIndex(0);
    try {
      const result = await generateYoloChallenge(selectedMood, language);
      setChallenge(result);
      soundManager.playSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    soundManager.playSuccess();
    setCompleted(true);
  };

  // 接受挑战（需要登录）
  const handleAcceptChallenge = async () => {
    if (!challenge || !user) return;
    soundManager.playClick();
    try {
      const accepted = await acceptChallenge({
        title: challenge.title,
        description: challenge.description,
        category: challenge.category,
        difficulty: challenge.difficulty,
        estimatedTime: challenge.estimatedTime
      });
      setActiveChallenge(accepted);
      setChallenge(null);
      soundManager.playSuccess();
    } catch (err: any) {
      console.error('Accept error:', err);
      alert(err.message);
    }
  };

  // 选择照片
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 完成挑战（上传照片）
  const handleCompleteChallenge = async () => {
    if (!activeChallenge || !selectedPhoto) return;
    setUploadingPhoto(true);
    try {
      await completeChallenge(activeChallenge.id, selectedPhoto);
      soundManager.playSuccess();
      setActiveChallenge(null);
      setSelectedPhoto(null);
      setPhotoPreview(null);
      setCompleted(true);
      // 显示完成奖励提示
      showToast(language === 'zh' ? '挑战完成！' : language === 'ja' ? 'チャレンジ完了！' : 'Challenge Complete!', 'hearts', 10);
    } catch (err: any) {
      console.error('Complete error:', err);
      showToast(err.message, 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // 放弃当前挑战
  const abandonChallenge = () => {
    setActiveChallenge(null);
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const reset = () => {
    soundManager.playClick();
    setChallenge(null);
    setCompleted(false);
    setMood('');
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  // 文字换行辅助函数（支持中文）
  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
    // 检测是否包含中文
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);
    
    if (hasChinese) {
      // 中文按字符分割
      const chars = text.split('');
      let line = '';
      let currentY = y;

      for (let i = 0; i < chars.length; i++) {
        const testLine = line + chars[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line.length > 0) {
          ctx.fillText(line, x, currentY);
          line = chars[i];
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      if (line) {
        ctx.fillText(line, x, currentY);
        currentY += lineHeight;
      }
      return currentY;
    } else {
      // 英文按单词分割
      const words = text.split(' ');
      let line = '';
      let currentY = y;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line.trim(), x, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      if (line.trim()) {
        ctx.fillText(line.trim(), x, currentY);
        currentY += lineHeight;
      }
      return currentY;
    }
  }

  // 自适应文字大小的辅助函数
  function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxFontSize: number, minFontSize: number = 24): number {
    let fontSize = maxFontSize;
    ctx.font = `900 ${fontSize}px Arial, sans-serif`;
    while (ctx.measureText(text).width > maxWidth && fontSize > minFontSize) {
      fontSize -= 2;
      ctx.font = `900 ${fontSize}px Arial, sans-serif`;
    }
    return fontSize;
  }

  const generateImage = async () => {
    soundManager.playClick();
    if (!challenge) return;

    setGeneratingImage(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 9:16 竖版尺寸
    const width = 1080;
    const height = 1920;
    const padding = 60;
    
    canvas.width = width;
    canvas.height = height;
    
    const colors = {
      bg: '#0a0a0a',
      cardBg: '#111111',
      lime: '#ccff00',
      pink: '#ff00cc',
      white: '#f0f0f0',
      gray: '#333333',
      darkGray: '#1a1a1a',
    };

    const contentWidth = width - padding * 2;

    // 1. 背景
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    // 2. 斜线纹理背景
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = -height; i < width + height; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }

    // ========== 顶部 LOGO ==========
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 80px Arial, sans-serif';
    ctx.fillStyle = colors.white;
    ctx.fillText('YOLO.CM', width / 2, 80);

    // ========== 挑战卡片 ==========
    const cardY = 140;
    const cardHeight = 850;
    
    // 卡片背景
    ctx.fillStyle = colors.cardBg;
    ctx.fillRect(padding, cardY, contentWidth, cardHeight);
    
    // 卡片边框
    ctx.strokeStyle = colors.white;
    ctx.lineWidth = 6;
    ctx.strokeRect(padding, cardY, contentWidth, cardHeight);

    // 斜线纹理（卡片内）
    ctx.save();
    ctx.beginPath();
    ctx.rect(padding, cardY, contentWidth, cardHeight);
    ctx.clip();
    ctx.strokeStyle = 'rgba(204, 255, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let i = -cardHeight; i < width; i += 25) {
      ctx.beginPath();
      ctx.moveTo(i + padding, cardY);
      ctx.lineTo(i + cardHeight + padding, cardY + cardHeight);
      ctx.stroke();
    }
    ctx.restore();

    // 分类标签（粉色背景）
    ctx.fillStyle = colors.pink;
    const labelText = challenge.category;
    ctx.font = 'bold 36px Arial, sans-serif';
    const labelWidth = ctx.measureText(labelText).width + 50;
    ctx.fillRect(padding - 3, cardY - 3, labelWidth, 60);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, padding + 20, cardY + 27);

    // 右上角装饰星
    ctx.fillStyle = colors.lime;
    ctx.font = '50px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('✦', width - padding - 20, cardY + 60);

    // 挑战标题（自适应大小）
    ctx.textAlign = 'left';
    const titleFontSize = fitText(ctx, challenge.title, contentWidth - 80, 72, 40);
    ctx.font = `900 ${titleFontSize}px Arial, sans-serif`;
    ctx.fillStyle = colors.white;
    ctx.textBaseline = 'top';
    const titleStartY = cardY + 100;
    const titleEndY = wrapText(ctx, challenge.title, padding + 40, titleStartY, contentWidth - 80, titleFontSize + 15);

    // 左侧绿色竖线
    const descStartY = titleEndY + 20;
    ctx.fillStyle = colors.lime;
    ctx.fillRect(padding + 40, descStartY, 6, 120);

    // 挑战描述（自适应大小）
    const descFontSize = challenge.description.length > 80 ? 36 : 42;
    ctx.font = `400 ${descFontSize}px Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    wrapText(ctx, challenge.description, padding + 70, descStartY + 5, contentWidth - 130, descFontSize + 18);

    // 统计信息
    const statsStartY = cardY + cardHeight - 100;
    ctx.font = '32px Arial, sans-serif';
    ctx.fillStyle = colors.lime;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⏱ ${challenge.estimatedTime}`, padding + 40, statsStartY);
    ctx.fillStyle = colors.pink;
    ctx.fillText(`☠ ${t.dare.difficulty}: ${challenge.difficulty}/100`, padding + 320, statsStartY);

    // 底部荧光绿线
    ctx.fillStyle = colors.lime;
    ctx.fillRect(padding, cardY + cardHeight - 8, contentWidth, 8);

    // ========== 标语区域 ==========
    const sloganY = cardY + cardHeight + 40;
    const sloganHeight = 480;

    // 标语背景
    ctx.fillStyle = colors.darkGray;
    ctx.fillRect(padding, sloganY, contentWidth, sloganHeight);
    ctx.strokeStyle = colors.gray;
    ctx.lineWidth = 4;
    ctx.strokeRect(padding, sloganY, contentWidth, sloganHeight);

    // THE ONLY RULE:
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('T H E   O N L Y   R U L E :', width / 2, sloganY + 50);

    // DIE WITH MEMORIES, (第一行)
    ctx.font = '900 64px Arial, sans-serif';
    ctx.fillStyle = colors.white;
    const line1Y = sloganY + 130;
    ctx.fillText('DIE WITH ', width / 2 - 150, line1Y);
    ctx.fillStyle = colors.lime;
    ctx.textAlign = 'left';
    ctx.fillText('MEMORIES,', width / 2 + 30, line1Y);

    // NOT DREAMS. (第二行)
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.white;
    const line2Y = sloganY + 210;
    ctx.fillText('NOT ', width / 2 - 100, line2Y);
    ctx.fillStyle = colors.pink;
    ctx.textAlign = 'left';
    ctx.fillText('DREAMS.', width / 2 - 20, line2Y);

    // 二维码
    try {
      const qrSize = 160;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=https://yolo.cm&color=ccff00&bgcolor=1a1a1a&margin=0`;
      
      const qrImg = new Image();
      qrImg.crossOrigin = "Anonymous";
      
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => resolve();
        qrImg.src = qrUrl;
      });

      const qrX = width / 2 - qrSize / 2;
      const qrY = sloganY + 270;

      // 二维码边框
      ctx.strokeStyle = colors.lime;
      ctx.lineWidth = 4;
      ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // YOLO.CM 标注
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.fillStyle = '#666';
      ctx.fillText('SCAN TO EXPLORE', width / 2, qrY + qrSize + 40);
    } catch (err) {
      console.error("QR Error", err);
    }

    // ========== 底部装饰 ==========
    // 底部粉色线
    ctx.fillStyle = colors.pink;
    ctx.fillRect(padding, height - 80, contentWidth, 6);

    // 生成图片并显示弹窗
    const imageUrl = canvas.toDataURL('image/png');
    setPreviewImage(imageUrl);
    setGeneratingImage(false);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  const downloadImage = () => {
    if (!previewImage) return;
    const link = document.createElement('a');
    link.download = `yolo-challenge-${Date.now()}.png`;
    link.href = previewImage;
    link.click();
  };

  const getMoodLabel = (m: string) => {
    return (t.dare.moods as Record<string, string>)[m] || m;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-12 flex flex-col items-center">
      
      {/* 图片预览弹窗 */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 overflow-y-auto"
          onClick={closePreview}
        >
          <div 
            className="relative w-full max-w-lg animate-in zoom-in duration-200 my-4"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button 
              onClick={closePreview}
              className="absolute -top-2 -right-2 w-10 h-10 bg-yolo-pink text-black flex items-center justify-center hover:bg-white transition-colors z-20 shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>

            {/* 上半部分：挑战卡片 */}
            <div className="bg-[#0a0a0a] border-2 border-yolo-white p-6 relative overflow-hidden">
              {/* 斜线纹理背景 */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" 
                   style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ccff00 0, #ccff00 1px, transparent 0, transparent 20px)' }}>
              </div>
              
              {/* 分类标签 */}
              <div className="absolute -top-1 -left-1 bg-yolo-pink text-black px-4 py-1 font-black font-mono text-sm z-10">
                {challenge?.category}
              </div>

              {/* 右上角装饰 */}
              <div className="absolute top-4 right-4 text-yolo-lime text-2xl">✦</div>

              <div className="pt-6">
                {/* 标题 */}
                <h3 className="text-2xl md:text-3xl font-black text-yolo-white mb-4 leading-tight">
                  {challenge?.title}
                </h3>
                
                {/* 描述 */}
                <div className="relative mb-4">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yolo-lime"></div>
                  <p className="text-base md:text-lg text-yolo-white/80 pl-4">
                    {challenge?.description}
                  </p>
                </div>

                {/* 统计信息 */}
                <div className="flex gap-4 font-mono text-xs text-yolo-white/60 uppercase">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-yolo-lime" />
                    {challenge?.estimatedTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Skull className="w-3 h-3 text-yolo-pink" />
                    {t.dare.difficulty}: {challenge?.difficulty}/100
                  </span>
                </div>
              </div>

              {/* 底部荧光绿装饰线 */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-yolo-lime"></div>
            </div>

            {/* 下半部分：标语 + 二维码 */}
            <div className="bg-[#111] border-2 border-t-0 border-yolo-gray p-6">
              {/* THE ONLY RULE 标语 */}
              <div className="text-center mb-6">
                <p className="text-yolo-gray font-mono text-xs tracking-[0.3em] mb-2">THE ONLY RULE:</p>
                <p className="text-xl md:text-2xl font-black">
                  <span className="text-white">DIE WITH </span>
                  <span className="text-yolo-lime">MEMORIES</span>
                  <span className="text-white">,</span>
                </p>
                <p className="text-xl md:text-2xl font-black">
                  <span className="text-white">NOT </span>
                  <span className="text-yolo-pink">DREAMS</span>
                  <span className="text-white">.</span>
                </p>
              </div>

              {/* 二维码和下载区域 */}
              <div className="flex items-center justify-between gap-4">
                {/* 二维码 */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 border-2 border-yolo-lime p-1 bg-black">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://yolo.cm&color=ccff00&bgcolor=000000&margin=0"
                      alt="QR Code"
                      className="w-full h-full"
                    />
                  </div>
                  <p className="text-[10px] text-yolo-gray text-center mt-1 font-mono">YOLO.CM</p>
                </div>

                {/* 提示和下载按钮 */}
                <div className="flex-1">
                  <p className="text-yolo-gray text-xs mb-3 font-mono">
                    {language === 'zh' ? '长按图片保存分享' : 
                     language === 'ja' ? '長押しで保存・共有' :
                     'Long press to save & share'}
                  </p>
                  <button
                    onClick={downloadImage}
                    className="w-full py-3 bg-yolo-lime text-black font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    {language === 'zh' ? '下载图片' : language === 'ja' ? 'ダウンロード' : 'Download'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-12 text-center">
        <h2 className="text-4xl md:text-6xl font-black mb-4 uppercase text-yolo-white">
          {t.dare.title}
        </h2>
        <p className="text-yolo-gray hover:text-yolo-lime transition-colors duration-500 text-lg font-mono cursor-default">
          {t.dare.subtitle}
        </p>
      </div>

      {!challenge && !loading && !completed && !activeChallenge && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
          {moods.map((m) => (
            <button
              key={m}
              onClick={() => handleGenerate(m)}
              onMouseEnter={() => soundManager.playHover()}
              className="h-24 md:h-32 border border-yolo-gray hover:border-yolo-lime hover:bg-yolo-lime/10 text-yolo-white hover:text-yolo-lime transition-all duration-200 font-mono text-xl uppercase tracking-widest flex items-center justify-center group"
            >
              <span className="group-hover:scale-110 transition-transform">{getMoodLabel(m)}</span>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="w-full h-80 flex flex-col items-center justify-center relative border border-yolo-gray/30 bg-black/40 overflow-hidden backdrop-blur-sm">
          <div className="absolute inset-0 opacity-10 animate-pulse" 
               style={{ backgroundImage: 'radial-gradient(#ccff00 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          </div>
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-dashed border-yolo-lime rounded-full animate-spin [animation-duration:3s]"></div>
            <div className="absolute inset-4 border-4 border-dotted border-yolo-pink rounded-full animate-spin [animation-duration:2s] [animation-direction:reverse]"></div>
            <div className="absolute inset-0 m-auto w-12 h-12 bg-yolo-lime/20 rounded-full animate-ping"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Binary className="w-8 h-8 text-yolo-white animate-pulse" />
            </div>
          </div>
          <div className="font-mono text-yolo-lime text-lg md:text-xl tracking-widest uppercase text-center px-4 relative">
            <span className="animate-pulse">{loadingMessages[loadingMsgIndex]}</span>
            <span className="inline-block w-2 h-5 bg-yolo-pink ml-2 animate-bounce"></span>
          </div>
          <div className="w-64 h-1 bg-yolo-gray mt-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-yolo-pink animate-[marquee_1s_linear_infinite]"></div>
          </div>
        </div>
      )}

      {completed && (
        <div className="w-full text-center animate-in zoom-in duration-500">
          <div className="inline-block p-8 border-4 border-yolo-lime bg-black/50 backdrop-blur mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-yolo-lime/20 animate-pulse-fast"></div>
            <Trophy className="w-24 h-24 text-yolo-lime mx-auto mb-4 relative z-10" />
            <h3 className="text-4xl md:text-6xl font-black text-yolo-white mb-2 relative z-10">{t.dare.completedTitle}</h3>
            <p className="text-xl font-mono text-yolo-lime relative z-10">{t.dare.completedDesc}</p>
          </div>
          <button 
            onClick={reset}
            onMouseEnter={() => soundManager.playHover()}
            className="group flex items-center justify-center gap-2 mx-auto px-8 py-4 bg-yolo-pink text-white font-bold text-xl uppercase tracking-widest hover:bg-white hover:text-black transition-all"
          >
            {t.dare.goAgain} <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* 进行中的挑战 */}
      {activeChallenge && !completed && (
        <div className="w-full animate-in slide-in-from-bottom duration-300">
          <div className="relative border-2 border-yolo-pink p-8 md:p-12 bg-[#0a0a0a] shadow-[0_0_30px_rgba(255,0,204,0.3)]">
            {/* 进行中标签 */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yolo-pink text-black px-6 py-2 font-black font-mono text-sm uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 animate-pulse" />
              {language === 'zh' ? '进行中' : language === 'ja' ? '進行中' : 'IN PROGRESS'}
            </div>

            <div className="pt-4">
              <h3 className="text-2xl md:text-4xl font-black mb-4 text-yolo-white">{activeChallenge.title}</h3>
              <p className="text-lg text-yolo-white/70 mb-6 border-l-4 border-yolo-lime pl-4">{activeChallenge.description}</p>
              
              <div className="flex gap-4 mb-8 font-mono text-sm text-yolo-white/60">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-yolo-lime" /> {activeChallenge.estimated_time}</span>
                <span className="flex items-center gap-1"><Skull className="w-4 h-4 text-yolo-pink" /> {activeChallenge.difficulty}/100</span>
              </div>

              {/* 上传照片区域 */}
              <div className="border-2 border-dashed border-yolo-gray p-6 mb-6 text-center">
                {photoPreview ? (
                  <div className="relative inline-block">
                    <img src={photoPreview} alt="Preview" className="max-h-64 mx-auto border-2 border-yolo-lime" />
                    <button 
                      onClick={() => { setSelectedPhoto(null); setPhotoPreview(null); }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer py-8 hover:bg-yolo-gray/10 transition-colors"
                  >
                    <Camera className="w-12 h-12 mx-auto mb-3 text-yolo-gray" />
                    <p className="text-yolo-gray font-mono">
                      {language === 'zh' ? '点击上传完成照片' : language === 'ja' ? 'クリックして写真をアップロード' : 'Click to upload completion photo'}
                    </p>
                  </div>
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoSelect}
                  className="hidden" 
                />
              </div>

              {/* 按钮 */}
              <div className="flex gap-4">
                <button
                  onClick={handleCompleteChallenge}
                  disabled={!selectedPhoto || uploadingPhoto}
                  className="flex-1 py-4 bg-yolo-lime text-black font-black uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadingPhoto ? (
                    <><Upload className="w-5 h-5 animate-spin" /> UPLOADING...</>
                  ) : (
                    <><Check className="w-5 h-5" /> {language === 'zh' ? '完成挑战' : language === 'ja' ? 'チャレンジ完了' : 'COMPLETE CHALLENGE'}</>
                  )}
                </button>
                <button
                  onClick={abandonChallenge}
                  className="px-6 py-4 border-2 border-yolo-gray text-yolo-gray hover:border-red-500 hover:text-red-500 transition-colors font-mono uppercase text-sm"
                >
                  {language === 'zh' ? '放弃' : language === 'ja' ? '放棄' : 'ABANDON'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {challenge && !loading && !completed && !activeChallenge && (
        <div className="w-full animate-in zoom-in duration-300">
          <div className="relative border-2 border-yolo-white p-8 md:p-12 shadow-[10px_10px_0px_0px_rgba(204,255,0,1)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[16px_16px_0px_0px_rgba(204,255,0,1)] hover:-translate-y-1 bg-[#0a0a0a] group">
            
            {/* 关闭按钮 */}
            <button 
              onClick={reset}
              className="absolute -top-3 -right-3 w-10 h-10 bg-yolo-gray hover:bg-yolo-pink text-white hover:text-black flex items-center justify-center transition-colors z-30 border-2 border-yolo-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ccff00 0, #ccff00 1px, transparent 0, transparent 20px)' }}>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-br from-yolo-gray/20 via-transparent to-yolo-lime/5 pointer-events-none"></div>

            <div className="absolute -top-5 -left-2 md:-left-4 bg-yolo-pink text-yolo-black px-6 py-2 font-black font-mono text-lg transform -rotate-2 border border-yolo-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] z-20 transition-transform group-hover:rotate-0 group-hover:scale-105">
              {challenge.category}
            </div>

            <div className="relative z-10">
              <h3 className="text-3xl md:text-5xl font-black mb-6 text-yolo-white leading-tight drop-shadow-lg">
                {challenge.title}
              </h3>
              
              <div className="relative mb-8">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-yolo-lime shadow-[0_0_10px_rgba(204,255,0,0.5)]"></div>
                <p className="text-xl md:text-2xl text-yolo-white/90 font-light pl-6 py-2 font-sans leading-relaxed">
                  {challenge.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-6 mb-10 font-mono text-sm text-yolo-white/60 uppercase tracking-wider">
                <div className="flex items-center gap-2 bg-yolo-gray/30 px-3 py-1 rounded-sm border border-yolo-gray/50 backdrop-blur-sm">
                  <Clock className="w-4 h-4 text-yolo-lime" />
                  <span>{challenge.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-2 bg-yolo-gray/30 px-3 py-1 rounded-sm border border-yolo-gray/50 backdrop-blur-sm">
                  <Skull className="w-4 h-4 text-yolo-pink" />
                  <span>{t.dare.difficulty}: {challenge.difficulty}/100</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                {user ? (
                  <button 
                    onClick={handleAcceptChallenge}
                    onMouseEnter={() => soundManager.playHover()}
                    className="flex-1 bg-yolo-pink text-white py-4 font-bold uppercase hover:bg-yolo-lime hover:text-black transition-all border-2 border-transparent hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    {language === 'zh' ? '接受挑战' : language === 'ja' ? 'チャレンジを受ける' : 'ACCEPT CHALLENGE'}
                  </button>
                ) : (
                  <button 
                    onClick={handleComplete}
                    onMouseEnter={() => soundManager.playHover()}
                    className="flex-1 bg-yolo-white text-yolo-black py-4 font-bold uppercase hover:bg-yolo-lime hover:text-black transition-all border-2 border-transparent hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {t.dare.successBtn}
                  </button>
                )}
                
                <div className="flex gap-4">
                  <button 
                    onClick={generateImage}
                    disabled={generatingImage}
                    onMouseEnter={() => soundManager.playHover()}
                    className="px-6 py-4 border-2 border-yolo-white text-yolo-white hover:bg-yolo-gray hover:text-white transition-colors flex items-center gap-2 font-mono uppercase text-sm disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> {t.dare.download}
                  </button>

                  <button 
                    onClick={() => handleGenerate(mood)}
                    onMouseEnter={() => soundManager.playHover()}
                    className="px-6 border-2 border-yolo-white text-yolo-white hover:bg-yolo-pink hover:border-yolo-pink hover:text-black transition-all"
                    title={t.dare.rerollTitle}
                  >
                    <RefreshCw className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DareGenerator;

import React, { useState, useEffect, useRef } from 'react';
import { generateYoloChallenge } from '../services/geminiService';
import { Challenge, Environment, SocialLevel } from '../types';
import { RefreshCw, Zap, Clock, Skull, Download, Trophy, ArrowRight, Binary, X, Camera, Upload, Check, Moon, Compass, Sofa, Flame, UtensilsCrossed, Users, Palette, Heart, Dumbbell, Shuffle, Home, TreePine, Wifi, User, UserPlus, UsersRound, Settings2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { soundManager } from '../services/soundService';
import { acceptChallenge, getActiveChallenge, completeChallenge, Challenge as DBChallenge } from '../services/authService';
import { useToast } from './Toast';
import AuthModal from './AuthModal';

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [environment, setEnvironment] = useState<Environment>('any');
  const [socialLevel, setSocialLevel] = useState<SocialLevel>('any');
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

  const moods = [
    { key: "Bored", Icon: Moon },
    { key: "Adventurous", Icon: Compass },
    { key: "Lazy", Icon: Sofa },
    { key: "Chaos", Icon: Flame },
    { key: "Hungry", Icon: UtensilsCrossed },
    { key: "Social", Icon: Users },
    { key: "Creative", Icon: Palette },
    { key: "Romantic", Icon: Heart },
    { key: "Fitness", Icon: Dumbbell },
    { key: "Random", Icon: Shuffle }
  ];
  
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
      const result = await generateYoloChallenge({
        mood: selectedMood,
        language,
        environment,
        socialLevel
      });
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

    // 3:4 比例，适合手机展示的任务卡
    const width = 1080;
    const height = 1520;
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
    for (let i = -height; i < width + height; i += 25) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }

    // ========== 顶部 LOGO ==========
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 64px Arial, sans-serif';
    ctx.fillStyle = colors.white;
    ctx.fillText('YOLO.CM', width / 2, 70);

    // ========== 挑战卡片区域 ==========
    const cardY = 130;
    const cardHeight = 750;
    
    // 卡片背景
    ctx.fillStyle = colors.cardBg;
    ctx.fillRect(padding, cardY, contentWidth, cardHeight);
    
    // 卡片边框
    ctx.strokeStyle = colors.white;
    ctx.lineWidth = 5;
    ctx.strokeRect(padding, cardY, contentWidth, cardHeight);

    // 斜线纹理（卡片内）
    ctx.save();
    ctx.beginPath();
    ctx.rect(padding, cardY, contentWidth, cardHeight);
    ctx.clip();
    ctx.strokeStyle = 'rgba(204, 255, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let i = -cardHeight; i < width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i + padding, cardY);
      ctx.lineTo(i + cardHeight + padding, cardY + cardHeight);
      ctx.stroke();
    }
    ctx.restore();

    // 分类标签（粉色背景）
    ctx.fillStyle = colors.pink;
    const labelText = challenge.category;
    ctx.font = 'bold 32px Arial, sans-serif';
    const labelWidth = ctx.measureText(labelText).width + 50;
    ctx.fillRect(padding - 2, cardY - 2, labelWidth, 55);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, padding + 20, cardY + 25);

    // 右上角装饰星
    ctx.fillStyle = colors.lime;
    ctx.font = '48px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('✦', width - padding - 20, cardY + 55);

    // 挑战标题（自适应大小）
    ctx.textAlign = 'left';
    const titleFontSize = fitText(ctx, challenge.title, contentWidth - 80, 64, 36);
    ctx.font = `900 ${titleFontSize}px Arial, sans-serif`;
    ctx.fillStyle = colors.white;
    ctx.textBaseline = 'top';
    const titleStartY = cardY + 90;
    const titleEndY = wrapText(ctx, challenge.title, padding + 40, titleStartY, contentWidth - 80, titleFontSize + 16);

    // 左侧绿色竖线
    const descStartY = titleEndY + 30;
    ctx.fillStyle = colors.lime;
    ctx.fillRect(padding + 40, descStartY, 6, 140);

    // 挑战描述（自适应大小）
    const descFontSize = challenge.description.length > 80 ? 32 : 38;
    ctx.font = `400 ${descFontSize}px Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    wrapText(ctx, challenge.description, padding + 70, descStartY + 10, contentWidth - 130, descFontSize + 18);

    // 统计信息
    const statsStartY = cardY + cardHeight - 90;
    ctx.font = '30px Arial, sans-serif';
    ctx.fillStyle = colors.lime;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⏱ ${challenge.estimatedTime}`, padding + 40, statsStartY);
    ctx.fillStyle = colors.pink;
    ctx.fillText(`☠ ${t.dare.difficulty}: ${challenge.difficulty}/100`, padding + 320, statsStartY);

    // 底部荧光绿线
    ctx.fillStyle = colors.lime;
    ctx.fillRect(padding, cardY + cardHeight - 8, contentWidth, 8);

    // ========== 底部标语区域 ==========
    const sloganY = cardY + cardHeight + 40;
    const sloganHeight = height - sloganY - padding;

    // 标语背景
    ctx.fillStyle = colors.darkGray;
    ctx.fillRect(padding, sloganY, contentWidth, sloganHeight);
    ctx.strokeStyle = colors.gray;
    ctx.lineWidth = 4;
    ctx.strokeRect(padding, sloganY, contentWidth, sloganHeight);

    // THE ONLY RULE: (居中)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '22px Arial, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('THE ONLY RULE:', width / 2, sloganY + 50);

    // DIE WITH MEMORIES, (居中)
    ctx.font = '900 56px Arial, sans-serif';
    ctx.fillStyle = colors.white;
    ctx.fillText('DIE WITH ', width / 2 - 120, sloganY + 120);
    ctx.fillStyle = colors.lime;
    ctx.textAlign = 'left';
    ctx.fillText('MEMORIES,', width / 2 + 60, sloganY + 120);

    // NOT DREAMS. (居中)
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.white;
    ctx.fillText('NOT ', width / 2 - 80, sloganY + 190);
    ctx.fillStyle = colors.pink;
    ctx.textAlign = 'left';
    ctx.fillText('DREAMS.', width / 2, sloganY + 190);

    // 二维码 (居中)
    try {
      const qrSize = 150;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=https://yolo.cm&color=ccff00&bgcolor=1a1a1a&margin=0`;
      
      const qrImg = new Image();
      qrImg.crossOrigin = "Anonymous";
      
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => resolve();
        qrImg.src = qrUrl;
      });

      const qrX = width / 2 - qrSize / 2;
      const qrY = sloganY + 240;

      // 二维码边框
      ctx.strokeStyle = colors.lime;
      ctx.lineWidth = 4;
      ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // 邀请文字（多语言）
      const inviteText = language === 'zh' 
        ? '邀请你一起YOLO' 
        : language === 'ja' 
          ? 'YOLOチャレンジに招待' 
          : 'Join the YOLO challenge';
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.fillStyle = colors.lime;
      ctx.fillText(inviteText, width / 2, qrY + qrSize + 45);
    } catch (err) {
      console.error("QR Error", err);
    }

    // ========== 底部装饰线 ==========
    ctx.fillStyle = colors.pink;
    ctx.fillRect(padding, height - padding - 8, contentWidth, 8);

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
    <div className="w-full max-w-4xl mx-auto px-4 py-4 md:p-8 flex flex-col items-center">
      
      {/* 生成图片加载遮罩 */}
      {generatingImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center">
          <div className="relative">
            {/* 旋转边框 */}
            <div className="w-32 h-32 border-4 border-yolo-lime/30 rounded-lg animate-pulse" />
            <div className="absolute inset-0 w-32 h-32 border-4 border-transparent border-t-yolo-lime rounded-lg animate-spin" />
            {/* 中心图标 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Download className="w-10 h-10 text-yolo-lime animate-bounce" />
            </div>
          </div>
          <p className="mt-6 text-yolo-lime font-mono text-sm uppercase tracking-widest animate-pulse">
            {language === 'zh' ? '正在生成挑战卡...' : 
             language === 'ja' ? 'カード生成中...' :
             'Generating card...'}
          </p>
          <div className="mt-4 w-48 h-1 bg-yolo-gray overflow-hidden rounded-full">
            <div className="h-full bg-yolo-lime animate-[loading_1.5s_ease-in-out_infinite]" 
                 style={{ width: '30%', animation: 'loading 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      )}

      {/* 图片预览弹窗 - 3:4 比例图片，缩放适应屏幕 */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-2 md:p-4"
          onClick={closePreview}
        >
          <div 
            className="relative w-full max-w-[280px] md:max-w-[360px] animate-in zoom-in duration-200"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button 
              onClick={closePreview}
              className="absolute -top-2 -right-2 w-8 h-8 md:w-10 md:h-10 bg-yolo-pink text-black flex items-center justify-center hover:bg-white transition-colors z-20 shadow-lg rounded-full"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {/* 生成的图片 - 3:4 比例，缩放显示 */}
            <img 
              src={previewImage} 
              alt="YOLO Challenge Card" 
              className="w-full h-auto border-2 border-yolo-lime shadow-[0_0_30px_rgba(204,255,0,0.3)] rounded-sm"
            />

            {/* 底部操作区 */}
            <div className="mt-3 space-y-2">
              <p className="text-yolo-gray text-[10px] md:text-xs text-center font-mono">
                {language === 'zh' ? '长按图片保存到相册' : 
                 language === 'ja' ? '長押しで画像を保存' :
                 'Long press image to save'}
              </p>
              <button
                onClick={downloadImage}
                className="w-full py-2.5 md:py-3 bg-yolo-lime text-black font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center justify-center gap-2 text-xs md:text-sm"
              >
                <Download className="w-4 h-4" />
                {language === 'zh' ? '下载图片' : language === 'ja' ? 'ダウンロード' : 'Download'}
              </button>
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
        <div className="w-full space-y-6">
          {/* 筛选器切换按钮 */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-full font-mono text-xs uppercase tracking-wider transition-all ${
                showFilters || environment !== 'any' || socialLevel !== 'any'
                  ? 'border-yolo-lime text-yolo-lime bg-yolo-lime/10'
                  : 'border-yolo-gray text-yolo-gray hover:border-white hover:text-white'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              {language === 'zh' ? '筛选条件' : language === 'ja' ? 'フィルター' : 'Filters'}
              {(environment !== 'any' || socialLevel !== 'any') && (
                <span className="w-2 h-2 rounded-full bg-yolo-pink" />
              )}
            </button>
          </div>

          {/* 筛选选项 */}
          {showFilters && (
            <div className="bg-black/50 border border-yolo-gray/30 p-4 space-y-4 animate-in slide-in-from-top duration-200">
              {/* 环境筛选 */}
              <div>
                <p className="text-white/50 text-xs font-mono mb-2 uppercase">
                  {language === 'zh' ? '环境' : language === 'ja' ? '環境' : 'Environment'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'any', label: { en: 'Any', zh: '不限', ja: '指定なし' }, Icon: Shuffle },
                    { value: 'indoor', label: { en: 'Indoor', zh: '室内', ja: '室内' }, Icon: Home },
                    { value: 'outdoor', label: { en: 'Outdoor', zh: '户外', ja: '屋外' }, Icon: TreePine },
                    { value: 'online', label: { en: 'Online', zh: '线上', ja: 'オンライン' }, Icon: Wifi },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setEnvironment(opt.value as Environment)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs font-mono transition-all ${
                        environment === opt.value
                          ? 'border-yolo-lime bg-yolo-lime/20 text-yolo-lime'
                          : 'border-yolo-gray/50 text-white/60 hover:border-white hover:text-white'
                      }`}
                    >
                      <opt.Icon className="w-3.5 h-3.5" />
                      {opt.label[language] || opt.label.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* 社交程度筛选 */}
              <div>
                <p className="text-white/50 text-xs font-mono mb-2 uppercase">
                  {language === 'zh' ? '社交程度' : language === 'ja' ? 'ソーシャルレベル' : 'Social Level'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'any', label: { en: 'Any', zh: '不限', ja: '指定なし' }, Icon: Shuffle },
                    { value: 'solo', label: { en: 'Solo', zh: '独自', ja: 'ソロ' }, Icon: User },
                    { value: 'one-on-one', label: { en: '1-on-1', zh: '一对一', ja: '1対1' }, Icon: UserPlus },
                    { value: 'strangers', label: { en: 'Strangers', zh: '陌生人', ja: '見知らぬ人' }, Icon: Users },
                    { value: 'group', label: { en: 'Group', zh: '群体', ja: 'グループ' }, Icon: UsersRound },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSocialLevel(opt.value as SocialLevel)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs font-mono transition-all ${
                        socialLevel === opt.value
                          ? 'border-yolo-pink bg-yolo-pink/20 text-yolo-pink'
                          : 'border-yolo-gray/50 text-white/60 hover:border-white hover:text-white'
                      }`}
                    >
                      <opt.Icon className="w-3.5 h-3.5" />
                      {opt.label[language] || opt.label.en}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 心情选择 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {moods.map((m) => (
              <button
                key={m.key}
                onClick={() => handleGenerate(m.key)}
                onMouseEnter={() => soundManager.playHover()}
                className="h-20 md:h-24 border border-yolo-gray hover:border-yolo-lime hover:bg-yolo-lime/10 text-yolo-white hover:text-yolo-lime transition-all duration-200 font-mono text-sm uppercase tracking-wider flex flex-col items-center justify-center gap-2 group"
              >
                <m.Icon className="w-6 h-6 group-hover:scale-125 transition-transform" />
                <span className="group-hover:scale-105 transition-transform text-xs">{getMoodLabel(m.key)}</span>
              </button>
            ))}
          </div>
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
                    onClick={() => setShowAuthModal(true)}
                    onMouseEnter={() => soundManager.playHover()}
                    className="flex-1 bg-yolo-lime text-black py-4 font-bold uppercase hover:bg-yolo-pink hover:text-white transition-all border-2 border-transparent hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    JUST DO IT
                  </button>
                )}
                
                <div className="flex gap-4">
                  <button 
                    onClick={generateImage}
                    disabled={generatingImage}
                    onMouseEnter={() => soundManager.playHover()}
                    className="px-6 py-4 border-2 border-yolo-white text-yolo-white hover:bg-yolo-gray hover:text-white transition-colors flex items-center gap-2 font-mono uppercase text-sm disabled:opacity-50 disabled:cursor-wait"
                  >
                    {generatingImage ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {generatingImage 
                      ? (language === 'zh' ? '生成中...' : language === 'ja' ? '生成中...' : 'Creating...')
                      : t.dare.download}
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

      {/* Auth Modal for non-logged users */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default DareGenerator;

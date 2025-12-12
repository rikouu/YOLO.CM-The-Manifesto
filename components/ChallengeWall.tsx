import React, { useState, useEffect } from 'react';
import { getChallengeWall, Challenge, getAssetUrl, formatLikesCount } from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';
import { Trophy, Heart, MessageCircle } from 'lucide-react';
import ChallengeModal from './ChallengeModal';
import AuthModal from './AuthModal';

const ChallengeWall: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { language } = useLanguage();

  const t = {
    en: { title: 'CHALLENGE WALL', subtitle: 'Warriors who dared to live', empty: 'No completed challenges yet. Be the first!' },
    zh: { title: '挑战墙', subtitle: '敢于活出自我的勇士们', empty: '还没有完成的挑战，成为第一个！' },
    ja: { title: 'チャレンジウォール', subtitle: '生きることを恐れない勇者たち', empty: 'まだ完了したチャレンジがありません。最初になろう！' }
  }[language] || { title: 'CHALLENGE WALL', subtitle: 'Warriors who dared to live', empty: 'No completed challenges yet. Be the first!' };

  useEffect(() => {
    getChallengeWall(50).then(data => { setChallenges(data); setLoading(false); });
  }, []);

  const handleModalClose = () => {
    setSelectedId(null);
    getChallengeWall(50).then(setChallenges);
  };

  return (
    <div className="min-h-screen bg-[#121212] pt-16 md:pt-20 pb-12">
      {/* 顶部标题区 */}
      <div className="sticky top-14 md:top-16 z-30 bg-[#121212]/95 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{t.title}</h1>
            <p className="text-white/40 text-xs font-mono">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/30 text-xs font-mono">{challenges.length} posts</span>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 pt-4">
        {loading ? (
          /* 骨架屏加载动画 */
          <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2 sm:gap-3">
            {[...Array(12)].map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-16 sm:py-20 text-white/40 font-mono">
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-30" />
            {t.empty}
          </div>
        ) : (
          /* 小红书风格瀑布流 - CSS columns 实现 */
          <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2 sm:gap-3">
            {challenges.map((c, index) => (
              <ChallengeCard key={c.id} challenge={c} onClick={() => setSelectedId(c.id)} index={index} />
            ))}
          </div>
        )}
      </div>

      {selectedId && (
        <ChallengeModal
          challengeId={selectedId}
          onClose={handleModalClose}
          onLoginRequired={() => setShowAuthModal(true)}
        />
      )}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};


// 小红书风格卡片组件
const ChallengeCard: React.FC<{ challenge: Challenge; onClick: () => void; index: number }> = ({ challenge: c, onClick, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 根据内容生成随机高度的占位图颜色
  const placeholderColors = [
    'from-yolo-pink/20 to-yolo-lime/20',
    'from-purple-500/20 to-pink-500/20',
    'from-blue-500/20 to-cyan-500/20',
    'from-orange-500/20 to-red-500/20',
    'from-green-500/20 to-teal-500/20',
  ];
  const colorIndex = c.id ? c.id.charCodeAt(0) % placeholderColors.length : 0;

  return (
    <div
      onClick={onClick}
      className="break-inside-avoid mb-2 sm:mb-3 bg-[#1a1a1a] rounded-lg overflow-hidden cursor-pointer group hover:shadow-xl hover:shadow-yolo-pink/10 transition-all duration-300 active:scale-[0.98] opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 50, 500)}ms`, animationFillMode: 'forwards' }}
    >
      {/* 图片区域 */}
      <div className="relative w-full overflow-hidden">
        {c.photo_url && !imageError ? (
          <>
            {/* 图片加载占位 */}
            {!imageLoaded && (
              <div className={`w-full aspect-[3/4] bg-gradient-to-br ${placeholderColors[colorIndex]} animate-pulse`} />
            )}
            <img
              src={getAssetUrl(c.photo_url)}
              alt={c.title}
              className={`w-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          /* 无图片时的占位 - 显示标题和描述摘要 */
          <div className={`w-full aspect-[4/3] bg-gradient-to-br ${placeholderColors[colorIndex]} flex items-center justify-center p-4`}>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl mb-2">🔥</div>
              <p className="text-white/60 text-xs font-mono line-clamp-2">{c.title}</p>
            </div>
          </div>
        )}

        {/* 分类标签 - 悬浮在图片上 */}
        <div className="absolute top-2 left-2">
          <span className="bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 text-[10px] font-bold rounded-full">
            {c.category}
          </span>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-3">
        {/* 标题 - 最多两行 */}
        <h3 className="font-bold text-white text-sm leading-snug mb-2 line-clamp-2 group-hover:text-yolo-lime transition-colors">
          {c.title}
        </h3>

        {/* 底部：用户信息 + 点赞 */}
        <div className="flex items-center justify-between">
          {/* 用户信息 */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yolo-pink to-yolo-lime flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-black overflow-hidden">
              {c.user?.avatar ? (
                <img src={getAssetUrl(c.user.avatar)} alt="" className="w-full h-full object-cover" />
              ) : (
                (c.user?.nickname || c.user?.username || '?')[0].toUpperCase()
              )}
            </div>
            <span className="text-white/50 text-xs truncate">{c.user?.nickname || c.user?.username}</span>
          </div>

          {/* 点赞数和评论数 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-white/40 group-hover:text-yolo-pink transition-colors" />
              <span className="text-white/40 text-xs">{formatLikesCount(c.like_count || 0)}</span>
            </div>
            {(c.comment_count || 0) > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-white/40 group-hover:text-yolo-lime transition-colors" />
                <span className="text-white/40 text-xs">{c.comment_count}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 骨架屏卡片组件
const SkeletonCard: React.FC<{ index: number }> = ({ index }) => {
  // 随机高度让骨架屏更自然
  const heights = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-square', 'aspect-[5/4]'];
  const heightClass = heights[index % heights.length];

  // 渐变色
  const gradients = [
    'from-yolo-pink/10 to-yolo-lime/10',
    'from-purple-500/10 to-pink-500/10',
    'from-blue-500/10 to-cyan-500/10',
    'from-orange-500/10 to-red-500/10',
  ];
  const gradientClass = gradients[index % gradients.length];

  return (
    <div
      className="break-inside-avoid mb-2 sm:mb-3 bg-[#1a1a1a] rounded-lg overflow-hidden animate-pulse"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* 图片占位 */}
      <div className={`w-full ${heightClass} bg-gradient-to-br ${gradientClass} relative overflow-hidden`}>
        {/* 闪光效果 */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      {/* 内容占位 */}
      <div className="p-3 space-y-2">
        {/* 标题占位 */}
        <div className="h-4 bg-white/10 rounded-md w-full" />
        <div className="h-4 bg-white/10 rounded-md w-3/4" />

        {/* 底部信息占位 */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-white/10" />
            <div className="h-3 bg-white/10 rounded w-16" />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-white/10 rounded" />
            <div className="h-3 bg-white/10 rounded w-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeWall;

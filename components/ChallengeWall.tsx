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
    <div className="min-h-screen bg-yolo-black pt-16 md:pt-20 pb-12 px-3 md:px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-2">{t.title}</h1>
          <p className="text-yolo-lime/70 font-mono text-sm tracking-wider">{t.subtitle}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-yolo-lime border-t-transparent rounded-full animate-spin" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-20 text-white/40 font-mono">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
            {t.empty}
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 md:gap-4 space-y-3 md:space-y-4">
            {challenges.map((c) => (
              <ChallengeCard key={c.id} challenge={c} onClick={() => setSelectedId(c.id)} />
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


// 单独的挑战卡片组件 - 纯文字卡片，无图片
const ChallengeCard: React.FC<{ challenge: Challenge; onClick: () => void }> = ({ challenge: c, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="break-inside-avoid bg-[#111] border border-white/10 hover:border-yolo-lime/50 transition-all group overflow-hidden cursor-pointer relative p-4"
    >
      {/* 顶部：分类标签 + 用户信息 */}
      <div className="flex items-center justify-between mb-3">
        {/* 分类标签 */}
        <div className="bg-yolo-pink/90 text-black px-2 py-0.5 text-[10px] font-black uppercase">
          {c.category}
        </div>
        
        {/* 用户信息 */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-6 h-6 rounded-full bg-yolo-lime flex items-center justify-center text-black font-black text-[10px] overflow-hidden">
              {c.user?.avatar ? (
                <img src={getAssetUrl(c.user.avatar)} alt="" className="w-full h-full object-cover" />
              ) : (
                (c.user?.nickname || c.user?.username || '?')[0].toUpperCase()
              )}
            </div>
            {/* 赞数角标 */}
            {(c.user?.likes || 0) > 0 && (
              <div className="absolute -top-1 -right-2 min-w-[14px] h-[14px] bg-yolo-pink text-black text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
                {formatLikesCount(c.user?.likes || 0)}
              </div>
            )}
          </div>
          <span className="text-white/60 text-xs truncate max-w-[80px]">{c.user?.nickname || c.user?.username}</span>
        </div>
      </div>

      {/* 标题 - 完整显示 */}
      <h3 className="font-black text-white text-base leading-tight mb-2 group-hover:text-yolo-lime transition-colors">
        {c.title}
      </h3>

      {/* 描述 - 完整显示 */}
      {c.description && (
        <p className="text-white/80 text-sm leading-relaxed mb-3 border-l-2 border-yolo-lime/50 pl-3">
          {c.description}
        </p>
      )}

      {/* 底部：互动数据 */}
      <div className="flex items-center gap-3 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1">
          <Heart className="w-3.5 h-3.5 text-yolo-pink" />
          <span className="text-yolo-pink text-xs font-bold">{c.like_count || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="w-3.5 h-3.5 text-yolo-lime" />
          <span className="text-yolo-lime text-xs font-bold">{c.comment_count || 0}</span>
        </div>
        {/* 难度指示 */}
        {c.difficulty && (
          <div className="ml-auto text-white/30 text-[10px] font-mono">
            ☠ {c.difficulty}/100
          </div>
        )}
      </div>

      {/* 底部装饰线 */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yolo-lime to-yolo-pink opacity-50 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default ChallengeWall;

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, Heart, Trophy, Users, UserPlus, Clock, MessageCircle } from 'lucide-react';
import { User, Challenge, getUserProfile, getUserChallenges, getAssetUrl, toggleFollow } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import ChallengeModal from './ChallengeModal';

interface Props {
  userId: string;
  onClose: () => void;
  onLoginRequired?: () => void;
}

const UserProfileModal: React.FC<Props> = ({ userId, onClose, onLoginRequired }) => {
  const [profile, setProfile] = useState<User | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const { user } = useAuth();
  const { language } = useLanguage();

  const t = {
    en: {
      challenges: 'Challenges', completed: 'Completed', hearts: 'Hearts',
      followers: 'Followers', following: 'Following', follow: 'Follow',
      noChallenges: 'No completed challenges yet',
      userNotFound: 'User not found'
    },
    zh: {
      challenges: '挑战', completed: '已完成', hearts: '心心',
      followers: '粉丝', following: '已跟随', follow: '跟随',
      noChallenges: '暂无已完成的挑战',
      userNotFound: '用户不存在'
    },
    ja: {
      challenges: 'チャレンジ', completed: '完了', hearts: 'ハート',
      followers: 'フォロワー', following: 'フォロー中', follow: 'フォロー',
      noChallenges: 'まだ完了したチャレンジがありません',
      userNotFound: 'ユーザーが見つかりません'
    }
  }[language] || {
    challenges: 'Challenges', completed: 'Completed', hearts: 'Hearts',
    followers: 'Followers', following: 'Following', follow: 'Follow',
    noChallenges: 'No completed challenges yet',
    userNotFound: 'User not found'
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  // 锁定 body 滚动
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [profileData, challengesData] = await Promise.all([
      getUserProfile(userId),
      getUserChallenges(userId)
    ]);
    setProfile(profileData);
    setChallenges(challengesData);
    setIsFollowing(profileData?.is_following || false);
    setLoading(false);
  };

  const handleFollow = async () => {
    if (!user) {
      onLoginRequired?.();
      return;
    }
    if (!profile || followLoading) return;
    if (profile.id === user.id) return;

    setFollowLoading(true);
    try {
      const result = await toggleFollow(profile.id);
      setIsFollowing(result.following);
      setProfile(prev => prev ? {
        ...prev,
        followers_count: result.followers_count
      } : null);
    } catch (err: any) {
      if (err.message?.includes('Unauthorized')) onLoginRequired?.();
    }
    setFollowLoading(false);
  };

  // 骨架屏
  if (loading) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4" onClick={onClose}>
        <div
          className="relative bg-[#121212] w-full h-full md:w-[500px] md:h-auto md:max-h-[90vh] md:rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
          onClick={e => e.stopPropagation()}
        >
          {/* 顶部导航骨架 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
            <div className="w-6 h-6 bg-white/10 rounded-full animate-pulse" />
            <div className="w-20 h-5 bg-white/10 rounded animate-pulse" />
            <div className="w-6 h-6" />
          </div>

          {/* 用户信息骨架 */}
          <div className="px-6 py-6">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-white/10 animate-pulse mb-4" />
              <div className="w-32 h-6 bg-white/10 rounded animate-pulse mb-2" />
              <div className="w-24 h-4 bg-white/10 rounded animate-pulse mb-3" />
              <div className="w-48 h-4 bg-white/10 rounded animate-pulse mb-4" />
              <div className="w-24 h-9 bg-white/10 rounded-full animate-pulse" />
            </div>

            {/* 统计数据骨架 */}
            <div className="flex justify-center gap-8 mt-6 pt-6 border-t border-white/5">
              {[0, 1, 2].map(i => (
                <div key={i} className="text-center">
                  <div className="w-12 h-8 bg-white/10 rounded animate-pulse mx-auto mb-1" />
                  <div className="w-16 h-3 bg-white/10 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* 挑战列表骨架 */}
          <div className="px-4 pb-4">
            <div className="w-20 h-5 bg-white/10 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="aspect-square bg-white/5 rounded-lg animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (!profile) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4" onClick={onClose}>
        <div
          className="relative bg-[#121212] w-full h-full md:w-[500px] md:h-auto md:rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/10 text-white flex items-center justify-center rounded-full">
            <X className="w-5 h-5" />
          </button>
          <div className="text-6xl mb-4">😢</div>
          <p className="text-white/60">{t.userNotFound}</p>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4" onClick={onClose}>
        <div
          className="relative bg-[#121212] w-full h-full md:w-[500px] md:h-auto md:max-h-[90vh] md:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* 顶部导航栏 */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#121212]" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
            <button onClick={onClose} className="p-1 -ml-1 md:hidden">
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <span className="font-bold text-white text-sm">@{profile.username}</span>
            <button onClick={onClose} className="hidden md:flex w-8 h-8 items-center justify-center text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="w-6 md:hidden" />
          </div>

          {/* 可滚动内容区域 */}
          <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* 用户信息 */}
            <div className="px-6 py-6">
              <div className="flex flex-col items-center">
                {/* 头像 */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yolo-pink to-yolo-lime p-[3px] mb-4">
                  <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center overflow-hidden">
                    {profile.avatar ? (
                      <img src={getAssetUrl(profile.avatar)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-2xl">
                        {(profile.nickname || profile.username)[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* 昵称和用户名 */}
                <h2 className="text-xl font-black text-white mb-1">{profile.nickname || profile.username}</h2>
                <p className="text-white/40 text-sm font-mono mb-3">@{profile.username}</p>

                {/* 简介 */}
                {profile.bio && (
                  <p className="text-white/60 text-sm text-center mb-4 max-w-xs">{profile.bio}</p>
                )}

                {/* 关注按钮 */}
                {user && user.id !== profile.id && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-6 py-2 text-sm font-bold rounded-full active:scale-95 transition-all disabled:opacity-50 ${
                      isFollowing
                        ? 'bg-white/10 text-white border border-white/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
                        : 'bg-yolo-pink text-black hover:bg-yolo-pink/80'
                    }`}
                  >
                    {followLoading ? '...' : isFollowing ? t.following : t.follow}
                  </button>
                )}
              </div>

              {/* 统计数据 */}
              <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-white/5">
                <div className="text-center">
                  <div className="text-2xl font-black text-yolo-lime flex items-center justify-center gap-1">
                    <Trophy className="w-5 h-5" />
                    {challenges.length}
                  </div>
                  <div className="text-xs text-white/40 font-mono uppercase">{t.completed}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-red-500 flex items-center justify-center gap-1">
                    <Heart className="w-5 h-5 fill-current" />
                    {profile.likes || 0}
                  </div>
                  <div className="text-xs text-white/40 font-mono uppercase">{t.hearts}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-white/80 flex items-center justify-center gap-1">
                    <UserPlus className="w-5 h-5" />
                    {profile.following_count || 0}
                  </div>
                  <div className="text-xs text-white/40 font-mono uppercase">{t.following}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-yolo-pink flex items-center justify-center gap-1">
                    <Users className="w-5 h-5" />
                    {profile.followers_count || 0}
                  </div>
                  <div className="text-xs text-white/40 font-mono uppercase">{t.followers}</div>
                </div>
              </div>
            </div>

            {/* 挑战列表 */}
            <div className="px-4 pb-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                {t.challenges}
                <span className="text-white/40 font-normal">({challenges.length})</span>
              </h3>

              {challenges.length === 0 ? (
                <div className="py-12 text-center">
                  <Trophy className="w-12 h-12 mx-auto text-white/20 mb-3" />
                  <p className="text-white/40 text-sm">{t.noChallenges}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {challenges.map((c, index) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedChallengeId(c.id)}
                      className="group relative aspect-square bg-white/5 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-yolo-pink transition-all opacity-0 animate-fade-in-up"
                      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
                    >
                      {c.photo_url ? (
                        <img
                          src={getAssetUrl(c.photo_url)}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-yolo-pink/20 to-yolo-lime/20 flex items-center justify-center">
                          <span className="text-3xl">🔥</span>
                        </div>
                      )}
                      {/* 悬浮信息 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <p className="text-white text-xs font-bold line-clamp-2">{c.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-white/60 text-[10px]">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" /> {c.like_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> {c.comment_count || 0}
                          </span>
                        </div>
                      </div>
                      {/* 分类标签 */}
                      <div className="absolute top-2 left-2">
                        <span className="bg-black/50 backdrop-blur-sm text-white/80 px-2 py-0.5 text-[10px] font-bold rounded-full">
                          {c.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 挑战详情模态框 */}
      {selectedChallengeId && (
        <ChallengeModal
          challengeId={selectedChallengeId}
          onClose={() => setSelectedChallengeId(null)}
          onLoginRequired={onLoginRequired}
        />
      )}
    </>,
    document.body
  );
};

export default UserProfileModal;

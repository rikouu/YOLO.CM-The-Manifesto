import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, MessageCircle, Send, Clock, Skull, Smile, ChevronLeft, Share2, Bookmark } from 'lucide-react';
import { Challenge, Comment, getChallengeDetail, getComments, addComment, toggleLike, getAssetUrl, toggleFollow } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from './Toast';
import UserProfileModal from './UserProfileModal';

interface Props {
  challengeId: string;
  onClose: () => void;
  onLoginRequired?: () => void;
}

// 常用 emoji 列表
const EMOJIS = ['😀', '😂', '🤣', '😍', '🥰', '😎', '🤩', '🥳', '😤', '💪', '🔥', '❤️', '💯', '👏', '🙌', '✨', '⚡', '🎉', '🏆', '💀', '☠️', '🤘', '👊', '🫡'];

const ChallengeModal: React.FC<Props> = ({ challengeId, onClose, onLoginRequired }) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const commentInputRef = React.useRef<HTMLInputElement>(null);
  const { user, refreshUser } = useAuth();
  const { language } = useLanguage();

  const t = {
    en: { comments: 'Comments', noComments: 'No comments yet. Be the first!', placeholder: 'Write a comment...', login: 'Login to interact', noLikes: 'No likes left', follow: 'Follow', following: 'Following', comingSoon: 'Coming soon', copied: 'Link copied!' },
    zh: { comments: '评论', noComments: '暂无评论，来抢沙发！', placeholder: '写下你的评论...', login: '登录后互动', noLikes: '赞用完了', follow: '跟随', following: '已跟随', comingSoon: '功能开发中', copied: '链接已复制！' },
    ja: { comments: 'コメント', noComments: 'コメントなし、最初になろう！', placeholder: 'コメントを書く...', login: 'ログインして参加', noLikes: 'いいねがありません', follow: 'フォロー', following: 'フォロー中', comingSoon: '近日公開', copied: 'リンクをコピー！' }
  }[language] || { comments: 'Comments', noComments: 'No comments yet. Be the first!', placeholder: 'Write a comment...', login: 'Login to interact', noLikes: 'No likes left', follow: 'Follow', following: 'Following', comingSoon: 'Coming soon', copied: 'Link copied!' };

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [challengeId]);

  // 锁定 body 滚动，防止背景滚动
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [c, cmts] = await Promise.all([getChallengeDetail(challengeId), getComments(challengeId)]);
    setChallenge(c);
    setComments(cmts);
    setLoading(false);
  };

  const handleLike = async () => {
    if (!user) {
      onLoginRequired?.();
      return;
    }
    if (liking) return;
    setLiking(true);
    try {
      const result = await toggleLike(challengeId);
      setChallenge(prev => prev ? { ...prev, like_count: result.like_count, liked_by_me: result.liked } : null);
      refreshUser();
    } catch (err: any) {
      if (err.message?.includes('Unauthorized')) onLoginRequired?.();
    }
    setLiking(false);
  };

  const handleCommentClick = () => {
    if (!user) {
      onLoginRequired?.();
      return;
    }
    // 滚动到评论输入框并聚焦
    commentInputRef.current?.focus();
    commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const comment = await addComment(challengeId, newComment.trim());
      setComments(prev => [...prev, comment]);
      setNewComment('');
      setChallenge(prev => prev ? { ...prev, comment_count: (prev.comment_count || 0) + 1 } : null);
      setShowEmoji(false);
    } catch (err: any) {
      if (err.message?.includes('Unauthorized')) alert(t.login);
    }
    setSubmitting(false);
  };

  const insertEmoji = (emoji: string) => {
    setNewComment(prev => prev + emoji);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(t.copied, 'success');
    } catch {
      showToast(t.comingSoon, 'warning');
    }
  };

  const handleBookmark = () => {
    showToast(t.comingSoon, 'warning');
  };

  const handleFollow = async () => {
    if (!user) {
      onLoginRequired?.();
      return;
    }
    if (!challenge?.user?.id || followLoading) return;
    // 不能跟随自己
    if (challenge.user.id === user.id) return;

    setFollowLoading(true);
    try {
      const result = await toggleFollow(challenge.user.id);
      setIsFollowing(result.following);
    } catch (err: any) {
      if (err.message?.includes('Unauthorized')) onLoginRequired?.();
    }
    setFollowLoading(false);
  };

  // 加载时检查跟随状态
  useEffect(() => {
    if (challenge?.user?.id && user) {
      // 这里可以从 challenge 数据中获取 is_following 状态
      // 假设后端返回了这个字段
      setIsFollowing(challenge.user.is_following || false);
    }
  }, [challenge, user]);

  // Loading 状态 - 骨架屏
  if (loading) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4" onClick={onClose}>
        <div
          className="relative bg-[#121212] w-full h-full md:w-[900px] md:h-auto md:max-h-[90vh] md:rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl animate-scale-in"
          onClick={e => e.stopPropagation()}
        >
          {/* 移动端顶部导航栏骨架 */}
          <div className="md:hidden flex-shrink-0 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 py-3" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
            <div className="w-6 h-6 bg-white/10 rounded-full animate-pulse" />
            <div className="w-6 h-6 bg-white/10 rounded-full animate-pulse" />
          </div>

          {/* 移动端骨架屏 */}
          <div className="md:hidden flex-1 overflow-hidden">
            {/* 图片骨架 */}
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-yolo-pink/10 to-yolo-lime/10 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>
            {/* 用户信息骨架 */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-white/10 rounded animate-pulse" />
                  <div className="w-16 h-3 bg-white/10 rounded animate-pulse" />
                </div>
              </div>
              <div className="w-16 h-7 bg-white/10 rounded-full animate-pulse" />
            </div>
            {/* 内容骨架 */}
            <div className="px-4 py-4 space-y-3">
              <div className="flex gap-2">
                <div className="w-16 h-6 bg-white/10 rounded-full animate-pulse" />
                <div className="w-20 h-6 bg-white/10 rounded-full animate-pulse" />
              </div>
              <div className="w-full h-6 bg-white/10 rounded animate-pulse" />
              <div className="w-3/4 h-6 bg-white/10 rounded animate-pulse" />
              <div className="space-y-2 pt-2">
                <div className="w-full h-4 bg-white/10 rounded animate-pulse" />
                <div className="w-full h-4 bg-white/10 rounded animate-pulse" />
                <div className="w-2/3 h-4 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* 桌面端骨架屏 - 左侧 */}
          <div className="hidden md:flex flex-1 bg-black items-center justify-center relative overflow-hidden">
            <div className="w-full h-full min-h-[400px] bg-gradient-to-br from-yolo-pink/10 to-yolo-lime/10 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-yolo-pink/30 border-t-yolo-pink rounded-full animate-spin" />
              </div>
            </div>
          </div>

          {/* 桌面端骨架屏 - 右侧 */}
          <div className="hidden md:flex flex-col md:w-[400px] md:min-w-[380px]">
            {/* 用户信息骨架 */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-white/10 rounded animate-pulse" />
                  <div className="w-16 h-3 bg-white/10 rounded animate-pulse" />
                </div>
              </div>
              <div className="w-16 h-7 bg-white/10 rounded-full animate-pulse" />
            </div>
            {/* 内容骨架 */}
            <div className="flex-1 px-4 py-4 space-y-3">
              <div className="flex gap-2">
                <div className="w-16 h-6 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                <div className="w-20 h-6 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                <div className="w-16 h-6 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
              <div className="w-full h-6 bg-white/10 rounded animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-3/4 h-6 bg-white/10 rounded animate-pulse" style={{ animationDelay: '200ms' }} />
              <div className="space-y-2 pt-2">
                <div className="w-full h-4 bg-white/10 rounded animate-pulse" style={{ animationDelay: '250ms' }} />
                <div className="w-full h-4 bg-white/10 rounded animate-pulse" style={{ animationDelay: '300ms' }} />
                <div className="w-2/3 h-4 bg-white/10 rounded animate-pulse" style={{ animationDelay: '350ms' }} />
              </div>
              {/* 评论区骨架 */}
              <div className="pt-4 border-t border-white/5 mt-4">
                <div className="w-20 h-5 bg-white/10 rounded animate-pulse mb-4" />
                <div className="space-y-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="flex gap-3" style={{ animationDelay: `${400 + i * 100}ms` }}>
                      <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="w-24 h-3 bg-white/10 rounded animate-pulse" />
                        <div className="w-full h-4 bg-white/10 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* 底部互动栏骨架 */}
            <div className="flex-shrink-0 border-t border-white/5 px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-6 bg-white/10 rounded animate-pulse" />
                  <div className="w-16 h-6 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="w-6 h-6 bg-white/10 rounded animate-pulse" />
              </div>
              <div className="w-full h-10 bg-white/10 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (!challenge) return null;


  // 全屏图片查看
  if (showFullImage && challenge.photo_url) {
    return createPortal(
      <div
        className="fixed inset-0 z-[10000] bg-black flex items-center justify-center"
        onClick={() => setShowFullImage(false)}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <button
          onClick={() => setShowFullImage(false)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm text-white flex items-center justify-center rounded-full transition-colors z-20 active:scale-95 hover:bg-white/20"
          style={{ top: 'max(env(safe-area-inset-top), 16px)' }}
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={getAssetUrl(challenge.photo_url)}
          alt=""
          className="max-w-[95vw] max-h-[90vh] object-contain"
        />
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4" onClick={onClose}>
      {/* 小红书风格弹窗容器 */}
      <div
        className="relative bg-[#121212] w-full h-full md:w-[900px] md:h-auto md:max-h-[90vh] md:rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 移动端顶部导航栏 */}
        <div className="md:hidden flex-shrink-0 bg-[#121212] border-b border-white/5 flex items-center justify-between px-4 py-3" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
          <button onClick={onClose} className="p-1 -ml-1">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <button onClick={handleShare} className="p-2 text-white/60 hover:text-white active:scale-95 transition-all">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 移动端：整体可滚动区域 */}
        <div className="md:hidden flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* 图片区域 - 移动端限制最大高度 */}
          <div className="w-full bg-black relative">
            {challenge.photo_url && !imageError ? (
              <>
                {/* 图片加载中的占位 */}
                {!imageLoaded && (
                  <div className="w-full aspect-[4/3] bg-gradient-to-br from-yolo-pink/20 to-yolo-lime/20 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-yolo-pink border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <button
                  type="button"
                  className={`w-full cursor-pointer ${!imageLoaded ? 'absolute inset-0 opacity-0' : ''}`}
                  onClick={() => setShowFullImage(true)}
                >
                  <img
                    src={getAssetUrl(challenge.photo_url)}
                    alt=""
                    className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                </button>
              </>
            ) : (
              <div className="w-full aspect-[4/3] bg-gradient-to-br from-yolo-pink/20 to-yolo-lime/20 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="text-6xl mb-4">🔥</div>
                  <p className="text-white/60 font-bold text-lg mb-1">{challenge.category}</p>
                  <p className="text-white/40 font-mono text-xs line-clamp-2 px-4">{challenge.title}</p>
                </div>
              </div>
            )}
          </div>

          {/* 用户信息 */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-[#121212]">
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity active:scale-[0.98]"
              onClick={() => challenge.user?.id && setSelectedUserId(challenge.user.id)}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yolo-pink to-yolo-lime p-[2px]">
                <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center overflow-hidden">
                  {challenge.user?.avatar ? (
                    <img src={getAssetUrl(challenge.user.avatar)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {(challenge.user?.nickname || challenge.user?.username || '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="font-bold text-white text-sm">{challenge.user?.nickname || challenge.user?.username}</div>
                <div className="text-xs text-white/40">@{challenge.user?.username}</div>
              </div>
            </div>
            <button
              onClick={handleFollow}
              disabled={followLoading || (user && challenge.user?.id === user.id)}
              className={`px-4 py-1.5 text-xs font-bold rounded-full active:scale-95 transition-all disabled:opacity-50 ${
                isFollowing
                  ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  : 'bg-yolo-pink text-black hover:bg-yolo-pink/80'
              }`}
            >
              {followLoading ? '...' : isFollowing ? t.following : t.follow}
            </button>
          </div>

          {/* 挑战内容 */}
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="bg-yolo-pink/20 text-yolo-pink px-2.5 py-1 text-xs font-bold rounded-full">
                {challenge.category}
              </span>
              <span className="bg-white/5 text-white/60 px-2.5 py-1 text-xs font-mono rounded-full flex items-center gap-1">
                <Skull className="w-3 h-3" /> {challenge.difficulty}/100
              </span>
              <span className="bg-white/5 text-white/60 px-2.5 py-1 text-xs font-mono rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" /> {challenge.estimated_time}
              </span>
            </div>
            <h2 className="text-lg font-black text-white mb-3 leading-snug">{challenge.title}</h2>
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
          </div>

          {/* 分隔线 */}
          <div className="h-2 bg-white/5"></div>

          {/* 评论区 */}
          <div className="px-4 py-4 pb-32">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              {t.comments}
              <span className="text-white/40 font-normal">({challenge.comment_count || 0})</span>
            </h3>

            {comments.length === 0 ? (
              <div className="py-8 text-center">
                <MessageCircle className="w-10 h-10 mx-auto text-white/20 mb-2" />
                <p className="text-white/30 text-sm">{t.noComments}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden cursor-pointer hover:ring-2 hover:ring-yolo-pink/50 transition-all"
                      onClick={() => c.user?.id && setSelectedUserId(c.user.id)}
                    >
                      {c.user?.avatar ? (
                        <img src={getAssetUrl(c.user.avatar)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (c.user?.nickname || c.user?.username || '?')[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span
                          className="font-bold text-white text-sm cursor-pointer hover:text-yolo-pink transition-colors"
                          onClick={() => c.user?.id && setSelectedUserId(c.user.id)}
                        >
                          {c.user?.nickname || c.user?.username}
                        </span>
                        <span className="text-white/30 text-xs">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-white/80 text-sm mt-1 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 移动端底部固定互动栏 */}
        <div className="md:hidden flex-shrink-0 fixed bottom-0 left-0 right-0 border-t border-white/5 bg-[#121212]" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
          {/* 互动按钮 */}
          <div className="px-4 py-2 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                disabled={!user || liking}
                className={`flex items-center gap-1.5 transition-all ${challenge.liked_by_me ? 'text-yolo-pink' : 'text-white/60 hover:text-yolo-pink'} disabled:opacity-50`}
              >
                <Heart className={`w-5 h-5 ${challenge.liked_by_me ? 'fill-current' : ''} ${liking ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-bold">{challenge.like_count || 0}</span>
              </button>
              <button
                onClick={handleCommentClick}
                className="flex items-center gap-1.5 text-white/60 hover:text-yolo-lime transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-bold">{challenge.comment_count || 0}</span>
              </button>
            </div>
            <button onClick={handleBookmark} className="p-2 text-white/40 hover:text-white active:scale-95 transition-all">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>

          {/* 评论输入 */}
          <div className="px-4 py-2">
            {user ? (
              <form onSubmit={handleComment} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmoji(!showEmoji)}
                  className={`p-2 rounded-full transition-colors ${showEmoji ? 'text-yolo-lime bg-yolo-lime/10' : 'text-white/40 hover:text-white/60'}`}
                >
                  <Smile className="w-5 h-5" />
                </button>
                <input
                  ref={commentInputRef}
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder={t.placeholder}
                  className="flex-1 bg-white/5 text-white px-4 py-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-yolo-pink/50 placeholder:text-white/30"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="p-2 bg-yolo-pink text-black rounded-full disabled:opacity-30 hover:bg-yolo-pink/80 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => onLoginRequired?.()}
                className="w-full py-2 text-center text-white/40 text-sm font-mono hover:text-yolo-pink transition-colors"
              >
                {t.login}
              </button>
            )}
          </div>

          {/* Emoji 选择器 - 移动端 */}
          {showEmoji && user && (
            <div className="px-4 pb-2">
              <div className="p-2 bg-white/5 rounded-xl flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="w-8 h-8 hover:bg-white/10 rounded-lg flex items-center justify-center text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 桌面端：左右分栏布局 */}
        {/* 左侧：图片区域 */}
        <div className="hidden md:flex flex-1 bg-black items-center justify-center relative overflow-hidden">
          {challenge.photo_url && !imageError ? (
            <>
              {/* 图片加载中的占位 */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-yolo-pink/20 to-yolo-lime/20 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-yolo-pink border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <button
                type="button"
                className="w-full h-full cursor-pointer"
                onClick={() => setShowFullImage(true)}
              >
                <img
                  src={getAssetUrl(challenge.photo_url)}
                  alt=""
                  className={`w-full h-auto md:h-full md:w-auto md:max-h-[90vh] object-contain mx-auto transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </button>
            </>
          ) : (
            <div className="w-full h-full min-h-[300px] bg-gradient-to-br from-yolo-pink/20 to-yolo-lime/20 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-8xl mb-6">🔥</div>
                <p className="text-white/60 font-bold text-xl mb-2">{challenge.category}</p>
                <p className="text-white/40 font-mono text-sm">{challenge.title}</p>
              </div>
            </div>
          )}

          {/* 桌面端关闭按钮 */}
          <button
            onClick={onClose}
            className="hidden md:flex absolute top-4 left-4 w-10 h-10 bg-black/50 backdrop-blur-sm text-white items-center justify-center rounded-full hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 右侧：内容区域 - 仅桌面端显示 */}
        <div className="hidden md:flex flex-1 flex-col min-h-0 md:w-[400px] md:min-w-[380px]">
          {/* 用户信息头部 */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity active:scale-[0.98]"
              onClick={() => challenge.user?.id && setSelectedUserId(challenge.user.id)}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yolo-pink to-yolo-lime p-[2px]">
                <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center overflow-hidden">
                  {challenge.user?.avatar ? (
                    <img src={getAssetUrl(challenge.user.avatar)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {(challenge.user?.nickname || challenge.user?.username || '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="font-bold text-white text-sm">{challenge.user?.nickname || challenge.user?.username}</div>
                <div className="text-xs text-white/40">@{challenge.user?.username}</div>
              </div>
            </div>
            <button
              onClick={handleFollow}
              disabled={followLoading || (user && challenge.user?.id === user.id)}
              className={`px-4 py-1.5 text-xs font-bold rounded-full active:scale-95 transition-all disabled:opacity-50 ${
                isFollowing
                  ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  : 'bg-yolo-pink text-black hover:bg-yolo-pink/80'
              }`}
            >
              {followLoading ? '...' : isFollowing ? t.following : t.follow}
            </button>
          </div>

          {/* 可滚动内容 */}
          <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* 挑战内容 */}
            <div className="px-4 py-4">
              {/* 分类和难度标签 */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="bg-yolo-pink/20 text-yolo-pink px-2.5 py-1 text-xs font-bold rounded-full">
                  {challenge.category}
                </span>
                <span className="bg-white/5 text-white/60 px-2.5 py-1 text-xs font-mono rounded-full flex items-center gap-1">
                  <Skull className="w-3 h-3" /> {challenge.difficulty}/100
                </span>
                <span className="bg-white/5 text-white/60 px-2.5 py-1 text-xs font-mono rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {challenge.estimated_time}
                </span>
              </div>

              {/* 标题 */}
              <h2 className="text-lg font-black text-white mb-3 leading-snug">{challenge.title}</h2>

              {/* 描述 */}
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
            </div>

            {/* 分隔线 */}
            <div className="h-2 bg-white/5"></div>

            {/* 评论区 */}
            <div className="px-4 py-4">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                {t.comments}
                <span className="text-white/40 font-normal">({challenge.comment_count || 0})</span>
              </h3>

              {comments.length === 0 ? (
                <div className="py-8 text-center">
                  <MessageCircle className="w-10 h-10 mx-auto text-white/20 mb-2" />
                  <p className="text-white/30 text-sm">{t.noComments}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden cursor-pointer hover:ring-2 hover:ring-yolo-pink/50 transition-all"
                        onClick={() => c.user?.id && setSelectedUserId(c.user.id)}
                      >
                        {c.user?.avatar ? (
                          <img src={getAssetUrl(c.user.avatar)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (c.user?.nickname || c.user?.username || '?')[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span
                            className="font-bold text-white text-sm cursor-pointer hover:text-yolo-pink transition-colors"
                            onClick={() => c.user?.id && setSelectedUserId(c.user.id)}
                          >
                            {c.user?.nickname || c.user?.username}
                          </span>
                          <span className="text-white/30 text-xs">{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-white/80 text-sm mt-1 leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 底部互动栏 */}
          <div className="flex-shrink-0 border-t border-white/5 bg-[#121212]" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
            {/* 互动按钮 */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  disabled={!user || liking}
                  className={`flex items-center gap-1.5 transition-all ${challenge.liked_by_me ? 'text-yolo-pink' : 'text-white/60 hover:text-yolo-pink'} disabled:opacity-50`}
                >
                  <Heart className={`w-6 h-6 ${challenge.liked_by_me ? 'fill-current' : ''} ${liking ? 'animate-pulse' : ''}`} />
                  <span className="text-sm font-bold">{challenge.like_count || 0}</span>
                </button>
                <button
                  onClick={handleCommentClick}
                  className="flex items-center gap-1.5 text-white/60 hover:text-yolo-lime transition-colors"
                >
                  <MessageCircle className="w-6 h-6" />
                  <span className="text-sm font-bold">{challenge.comment_count || 0}</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleBookmark} className="p-2 text-white/40 hover:text-white active:scale-95 transition-all">
                  <Bookmark className="w-5 h-5" />
                </button>
                <button onClick={handleShare} className="p-2 text-white/40 hover:text-white active:scale-95 transition-all hidden md:block">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 评论输入 */}
            <div className="px-4 py-3">
              {user ? (
                <>
                  {showEmoji && (
                    <div className="mb-3 p-2 bg-white/5 rounded-xl flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                      {EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="w-8 h-8 hover:bg-white/10 rounded-lg flex items-center justify-center text-lg transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                  <form onSubmit={handleComment} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEmoji(!showEmoji)}
                      className={`p-2 rounded-full transition-colors ${showEmoji ? 'text-yolo-lime bg-yolo-lime/10' : 'text-white/40 hover:text-white/60'}`}
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        ref={commentInputRef}
                        type="text"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder={t.placeholder}
                        className="w-full bg-white/5 text-white px-4 py-2.5 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-yolo-pink/50 placeholder:text-white/30"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submitting}
                      className="p-2.5 bg-yolo-pink text-black rounded-full disabled:opacity-30 hover:bg-yolo-pink/80 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <button
                  onClick={() => onLoginRequired?.()}
                  className="w-full py-3 text-center text-white/40 text-sm font-mono hover:text-yolo-pink transition-colors"
                >
                  {t.login}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 用户主页弹窗 */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onLoginRequired={onLoginRequired}
        />
      )}
    </div>,
    document.body
  );
};

export default ChallengeModal;

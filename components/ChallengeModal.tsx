import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Send, Clock, Skull, Smile } from 'lucide-react';
import { Challenge, Comment, getChallengeDetail, getComments, addComment, toggleLike, getAssetUrl } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  challengeId: string;
  onClose: () => void;
}

// 常用 emoji 列表
const EMOJIS = ['😀', '😂', '🤣', '😍', '🥰', '😎', '🤩', '🥳', '😤', '💪', '🔥', '❤️', '💯', '👏', '🙌', '✨', '⚡', '🎉', '🏆', '💀', '☠️', '🤘', '👊', '🫡'];

const ChallengeModal: React.FC<Props> = ({ challengeId, onClose }) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const { user, refreshUser } = useAuth();
  const { language } = useLanguage();

  const t = {
    en: { comments: 'Comments', noComments: 'No comments yet. Be the first!', placeholder: 'Write a comment...', login: 'Login to interact', noLikes: 'No likes left' },
    zh: { comments: '评论', noComments: '暂无评论，来抢沙发！', placeholder: '写下你的评论...', login: '登录后互动', noLikes: '赞用完了' },
    ja: { comments: 'コメント', noComments: 'コメントなし、最初になろう！', placeholder: 'コメントを書く...', login: 'ログインして参加', noLikes: 'いいねがありません' }
  }[language] || { comments: 'Comments', noComments: 'No comments yet. Be the first!', placeholder: 'Write a comment...', login: 'Login to interact', noLikes: 'No likes left' };

  useEffect(() => {
    loadData();
  }, [challengeId]);

  const loadData = async () => {
    setLoading(true);
    const [c, cmts] = await Promise.all([getChallengeDetail(challengeId), getComments(challengeId)]);
    setChallenge(c);
    setComments(cmts);
    setLoading(false);
  };

  const handleLike = async () => {
    if (!user || liking) return;
    setLiking(true);
    try {
      const result = await toggleLike(challengeId);
      setChallenge(prev => prev ? { ...prev, like_count: result.like_count, liked_by_me: result.liked } : null);
      refreshUser();
    } catch (err: any) {
      if (err.message?.includes('Unauthorized')) alert(t.login);
    }
    setLiking(false);
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

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={onClose}>
        <div className="w-12 h-12 border-4 border-yolo-lime border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!challenge) return null;


  // 全屏图片查看
  if (showFullImage && challenge.photo_url) {
    return (
      <div className="fixed inset-0 z-[110] bg-black flex items-center justify-center" onClick={() => setShowFullImage(false)}>
        <button onClick={() => setShowFullImage(false)} className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center rounded-full transition-colors z-20">
          <X className="w-8 h-8" />
        </button>
        <img src={getAssetUrl(challenge.photo_url)} alt="" className="max-w-full max-h-full object-contain" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-4xl bg-[#0a0a0a] border-2 border-yolo-white my-4 animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        {/* 关闭按钮 */}
        <button onClick={onClose} className="absolute -top-3 -right-3 w-10 h-10 bg-yolo-pink text-black flex items-center justify-center hover:bg-white transition-colors z-20 border-2 border-white">
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* 左侧：图片 */}
          {challenge.photo_url && (
            <div className="md:w-1/2 bg-black flex items-center justify-center cursor-pointer group" onClick={() => setShowFullImage(true)}>
              <div className="relative w-full">
                <img src={getAssetUrl(challenge.photo_url)} alt="" className="w-full h-auto max-h-[70vh] object-contain" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-mono transition-opacity">
                    {language === 'zh' ? '点击查看大图' : language === 'ja' ? 'クリックで拡大' : 'Click to enlarge'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 右侧：详情 */}
          <div className={`${challenge.photo_url ? 'md:w-1/2' : 'w-full'} flex flex-col max-h-[80vh]`}>
            {/* 用户信息 */}
            <div className="p-4 border-b border-yolo-gray/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yolo-lime flex items-center justify-center text-black font-black overflow-hidden">
                {challenge.user?.avatar ? (
                  <img src={getAssetUrl(challenge.user.avatar)} alt="" className="w-full h-full object-cover" />
                ) : (
                  (challenge.user?.nickname || challenge.user?.username || '?')[0].toUpperCase()
                )}
              </div>
              <div>
                <div className="font-bold text-white">{challenge.user?.nickname || challenge.user?.username}</div>
                <div className="text-xs text-white/40 font-mono">@{challenge.user?.username}</div>
              </div>
              <div className="ml-auto bg-yolo-pink text-black px-2 py-1 text-xs font-black">{challenge.category}</div>
            </div>

            {/* 挑战内容 */}
            <div className="p-4 border-b border-yolo-gray/50">
              <h2 className="text-xl font-black text-white mb-2">{challenge.title}</h2>
              <p className="text-white/60 mb-3">{challenge.description}</p>
              <div className="flex gap-4 text-xs font-mono">
                <span className="flex items-center gap-1 text-yolo-lime"><Clock className="w-3 h-3" /> {challenge.estimated_time}</span>
                <span className="flex items-center gap-1 text-yolo-pink"><Skull className="w-3 h-3" /> {challenge.difficulty}/100</span>
              </div>
            </div>

            {/* 点赞和评论数 */}
            <div className="p-4 border-b border-yolo-gray/50 flex items-center gap-6">
              <button 
                onClick={handleLike}
                disabled={!user || liking}
                className={`flex items-center gap-2 transition-all ${challenge.liked_by_me ? 'text-yolo-pink scale-110' : 'text-white/70 hover:text-yolo-pink hover:scale-105'} disabled:opacity-50`}
              >
                <Heart className={`w-6 h-6 ${challenge.liked_by_me ? 'fill-current' : ''}`} />
                <span className="font-bold text-white">{challenge.like_count || 0}</span>
              </button>
              <div className="flex items-center gap-2 text-white/70">
                <MessageCircle className="w-6 h-6" />
                <span className="font-bold text-white">{challenge.comment_count || 0}</span>
              </div>
              {user && (
                <div className="ml-auto text-xs text-white/50 font-mono flex items-center gap-1">
                  <Heart className="w-3 h-3 text-yolo-pink fill-current" /> {user.stats?.likes || user.likes || 0}
                </div>
              )}
            </div>


            {/* 评论区 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[150px] max-h-[300px]">
              <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider">{t.comments}</h3>
              {comments.length === 0 ? (
                <p className="text-white/30 text-sm font-mono">{t.noComments}</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-yolo-gray/50 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                      {c.user?.avatar ? (
                        <img src={getAssetUrl(c.user.avatar)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (c.user?.nickname || c.user?.username || '?')[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-bold text-yolo-lime">{c.user?.nickname || c.user?.username}</span>
                        <span className="text-white/70 ml-2">{c.content}</span>
                      </div>
                      <div className="text-xs text-white/30 font-mono mt-1">
                        {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 评论输入 */}
            {user ? (
              <div className="p-4 border-t border-yolo-gray/50">
                {/* Emoji 选择器 */}
                {showEmoji && (
                  <div className="mb-2 p-2 bg-black/50 border border-yolo-gray/50 rounded flex flex-wrap gap-1">
                    {EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="w-8 h-8 hover:bg-yolo-lime/20 rounded flex items-center justify-center text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                <form onSubmit={handleComment} className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmoji(!showEmoji)}
                    className={`px-3 py-2 border transition-colors ${showEmoji ? 'border-yolo-lime text-yolo-lime' : 'border-yolo-gray/50 text-white/50 hover:text-yolo-lime'}`}
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder={t.placeholder}
                    className="flex-1 bg-black border border-yolo-gray/50 text-white px-3 py-2 text-sm focus:border-yolo-lime focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="px-4 py-2 bg-yolo-lime text-black font-bold disabled:opacity-50 hover:bg-white transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-4 border-t border-yolo-gray/50 text-center text-white/40 text-sm font-mono">
                {t.login}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeModal;

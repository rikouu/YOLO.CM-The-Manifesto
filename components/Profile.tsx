import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getMyChallenges, updateProfile, uploadAvatar, Challenge, getAssetUrl, checkIn, getCheckInStatus, deleteChallengeApi, getFollowing, getFollowers, FollowUser, toggleFollow } from '../services/authService';
import { Camera, Edit2, Check, Trophy, Flame, Clock, Heart, Calendar, Trash2, Users, UserPlus, MessageCircle } from 'lucide-react';
import ChallengeModal from './ChallengeModal';
import ConfirmDialog from './ConfirmDialog';
import UserProfileModal from './UserProfileModal';
import { useToast } from './Toast';

type TabType = 'challenges' | 'following' | 'followers';

interface ProfileProps {
  onLogout?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onLogout }) => {
  const { user, refreshUser, logout } = useAuth();
  const { language } = useLanguage();
  const { showToast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [userLikes, setUserLikes] = useState(0);
  const [checkingIn, setCheckingIn] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('challenges');
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const t = {
    en: {
      profile: 'PROFILE', challenges: 'CHALLENGES', completed: 'COMPLETED', likes: 'HEARTS',
      edit: 'Edit', save: 'Save', logout: 'Logout', bio: 'Life motto...',
      noChallenges: 'No challenges yet. Go make some memories!',
      checkIn: 'CHECK IN', checkedIn: 'CHECKED ✓',
      deleteTitle: 'Delete Challenge', deleteMsg: 'Are you sure? You will lose all hearts earned from this challenge.',
      deleteBtn: 'DELETE', cancelBtn: 'CANCEL', checkInSuccess: 'Check-in successful!', deleted: 'Challenge deleted',
      following: 'Following', followers: 'Followers', noFollowing: 'Not following anyone yet', noFollowers: 'No followers yet',
      follow: 'Follow', unfollow: 'Following', logoutSuccess: 'Logged out successfully'
    },
    zh: {
      profile: '个人资料', challenges: '挑战', completed: '已完成', likes: '心心',
      edit: '编辑', save: '保存', logout: '退出', bio: '人生态度...',
      noChallenges: '还没有挑战记录，去创造一些回忆吧！',
      checkIn: '签到', checkedIn: '已签到 ✓',
      deleteTitle: '删除挑战', deleteMsg: '确定要删除吗？将扣除该挑战获得的所有心心。',
      deleteBtn: '删除', cancelBtn: '取消', checkInSuccess: '签到成功！', deleted: '挑战已删除',
      following: '我跟随的', followers: '跟随我的', noFollowing: '还没有跟随任何人', noFollowers: '还没有人跟随你',
      follow: '跟随', unfollow: '已跟随', logoutSuccess: '已退出登录'
    },
    ja: {
      profile: 'プロフィール', challenges: 'チャレンジ', completed: '完了', likes: 'ハート',
      edit: '編集', save: '保存', logout: 'ログアウト', bio: '人生のモットー...',
      noChallenges: 'まだチャレンジがありません。思い出を作りに行こう！',
      checkIn: 'チェックイン', checkedIn: 'チェック済 ✓',
      deleteTitle: 'チャレンジを削除', deleteMsg: '本当に削除しますか？獲得したハートが失われます。',
      deleteBtn: '削除', cancelBtn: 'キャンセル', checkInSuccess: 'チェックイン成功！', deleted: 'チャレンジを削除しました',
      following: 'フォロー中', followers: 'フォロワー', noFollowing: 'まだ誰もフォローしていません', noFollowers: 'まだフォロワーがいません',
      follow: 'フォロー', unfollow: 'フォロー中', logoutSuccess: 'ログアウトしました'
    }
  }[language] || {
    profile: 'PROFILE', challenges: 'CHALLENGES', completed: 'COMPLETED', likes: 'HEARTS',
    edit: 'Edit', save: 'Save', logout: 'Logout', bio: 'Life motto...',
    noChallenges: 'No challenges yet. Go make some memories!',
    checkIn: 'CHECK IN', checkedIn: 'CHECKED ✓',
    deleteTitle: 'Delete Challenge', deleteMsg: 'Are you sure? You will lose all hearts earned from this challenge.',
    deleteBtn: 'DELETE', cancelBtn: 'CANCEL', checkInSuccess: 'Check-in successful!', deleted: 'Challenge deleted',
    following: 'Following', followers: 'Followers', noFollowing: 'Not following anyone yet', noFollowers: 'No followers yet',
    follow: 'Follow', unfollow: 'Following', logoutSuccess: 'Logged out successfully'
  };

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || user.username);
      setBio(user.bio || '');
      setUserLikes(user.stats?.likes || user.likes || 0);
      setLoadingChallenges(true);
      getMyChallenges().then(data => {
        setChallenges(data);
        setLoadingChallenges(false);
      });
      getCheckInStatus().then(s => { setCheckedIn(s.checkedIn); setUserLikes(s.likes); });
    }
  }, [user]);

  // 加载跟随数据
  useEffect(() => {
    if (activeTab === 'following') {
      setLoadingFollow(true);
      getFollowing().then(data => {
        setFollowing(data);
        setFollowingIds(new Set(data.map(u => u.id)));
        setLoadingFollow(false);
      });
    } else if (activeTab === 'followers') {
      setLoadingFollow(true);
      Promise.all([getFollowers(), getFollowing()]).then(([followersData, followingData]) => {
        setFollowers(followersData);
        setFollowingIds(new Set(followingData.map(u => u.id)));
        setLoadingFollow(false);
      });
    }
  }, [activeTab]);

  const handleLogout = () => {
    showToast(t.logoutSuccess, 'success');
    logout();
    onLogout?.();
  };

  if (!user) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { await uploadAvatar(file); refreshUser(); }
  };

  const handleSave = async () => {
    await updateProfile({ nickname, bio });
    await refreshUser();
    setEditing(false);
  };

  const handleCheckIn = async () => {
    if (checkedIn || checkingIn) return;
    setCheckingIn(true);
    const result = await checkIn();
    if (result.success) {
      setCheckedIn(true);
      setUserLikes(result.likes);
      refreshUser();
      showToast(t.checkInSuccess, 'hearts', 5);
    }
    setCheckingIn(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteChallengeApi(deleteTarget);
      if (result.success) {
        setChallenges(prev => prev.filter(c => c.id !== deleteTarget));
        setUserLikes(prev => Math.max(0, prev - result.deducted));
        refreshUser();
        showToast(t.deleted, 'success');
      }
    } catch (err) {
      console.error(err);
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleToggleFollow = async (userId: string) => {
    try {
      const result = await toggleFollow(userId);
      if (result.following) {
        setFollowingIds(prev => new Set([...prev, userId]));
      } else {
        setFollowingIds(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
      // 刷新列表
      if (activeTab === 'following') {
        getFollowing().then(setFollowing);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const completedCount = challenges.filter(c => c.status === 'completed').length;

  return (
    <div className="min-h-screen bg-yolo-black pt-16 md:pt-20 pb-12 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto">
        {/* 头部 */}
        <div className="relative bg-[#111] border-2 border-yolo-gray/50 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 md:gap-6">
            <div className="relative group flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-3 sm:border-4 border-yolo-lime overflow-hidden bg-yolo-gray">
                {user.avatar ? (
                  <img src={getAssetUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl font-black text-yolo-lime">
                    {(user.nickname || user.username)[0].toUpperCase()}
                  </div>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>

            <div className="flex-1 w-full text-center sm:text-left">
              {editing ? (
                <div className="space-y-2 sm:space-y-3">
                  <input type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                    className="w-full bg-black border border-yolo-gray text-white px-3 py-2 font-mono text-sm sm:text-base focus:border-yolo-lime focus:outline-none" />
                  <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder={t.bio} rows={2}
                    className="w-full bg-black border border-yolo-gray text-white px-3 py-2 font-mono text-xs sm:text-sm focus:border-yolo-lime focus:outline-none resize-none" />
                  <button onClick={handleSave} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-yolo-lime text-black font-bold text-xs sm:text-sm flex items-center gap-2 mx-auto sm:mx-0 active:scale-95 transition-transform">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t.save}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white truncate">{user.nickname || user.username}</h2>
                    <button onClick={() => setEditing(true)} className="text-white/40 hover:text-yolo-lime flex-shrink-0 active:scale-95 transition-all"><Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                  </div>
                  <p className="text-white/40 font-mono text-xs sm:text-sm mb-2 sm:mb-3">@{user.username}</p>
                  {user.bio && <p className="text-white/60 text-xs sm:text-sm">{user.bio}</p>}
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 md:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-yolo-gray/50">
            <div className="text-center min-w-[50px] sm:min-w-[60px]">
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-yolo-lime">{challenges.length}</div>
              <div className="text-[9px] sm:text-[10px] md:text-xs text-white/40 uppercase font-mono">{t.challenges}</div>
            </div>
            <div className="text-center min-w-[50px] sm:min-w-[60px]">
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-yolo-pink">{completedCount}</div>
              <div className="text-[9px] sm:text-[10px] md:text-xs text-white/40 uppercase font-mono">{t.completed}</div>
            </div>
            <div className="text-center min-w-[50px] sm:min-w-[60px]">
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-red-500 flex items-center justify-center gap-1">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 fill-current" /> {userLikes}
              </div>
              <div className="text-[9px] sm:text-[10px] md:text-xs text-white/40 uppercase font-mono">{t.likes}</div>
            </div>
            <div className="text-center min-w-[50px] sm:min-w-[60px]">
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-white/80 flex items-center justify-center gap-1">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> {user.following_count || 0}
              </div>
              <div className="text-[9px] sm:text-[10px] md:text-xs text-white/40 uppercase font-mono">{t.following}</div>
            </div>
            <div className="text-center min-w-[50px] sm:min-w-[60px]">
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-white/80 flex items-center justify-center gap-1">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> {user.followers_count || 0}
              </div>
              <div className="text-[9px] sm:text-[10px] md:text-xs text-white/40 uppercase font-mono">{t.followers}</div>
            </div>

            <button onClick={handleCheckIn} disabled={checkedIn || checkingIn}
              className={`w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0 px-3 sm:px-4 py-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                checkedIn ? 'bg-white/10 text-white/40 cursor-default' : 'bg-yolo-lime text-black hover:bg-white'
              }`}>
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {checkedIn ? t.checkedIn : t.checkIn}
            </button>
          </div>

          <button onClick={handleLogout} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/40 hover:text-red-500 text-xs sm:text-sm font-mono uppercase active:scale-95 transition-all">{t.logout}</button>
        </div>

        {/* 标签页切换 */}
        <div className="flex items-center gap-1 mb-4 border-b border-yolo-gray/30">
          <button
            onClick={() => setActiveTab('challenges')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'challenges'
                ? 'text-yolo-lime border-yolo-lime'
                : 'text-white/40 border-transparent hover:text-white/60'
            }`}
          >
            <Trophy className="w-4 h-4" />
            {t.challenges}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'following'
                ? 'text-yolo-lime border-yolo-lime'
                : 'text-white/40 border-transparent hover:text-white/60'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            {t.following}
            {(user.following_count || 0) > 0 && <span className="text-xs text-white/30">({user.following_count})</span>}
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'followers'
                ? 'text-yolo-lime border-yolo-lime'
                : 'text-white/40 border-transparent hover:text-white/60'
            }`}
          >
            <Users className="w-4 h-4" />
            {t.followers}
            {(user.followers_count || 0) > 0 && <span className="text-xs text-white/30">({user.followers_count})</span>}
          </button>
        </div>

        {/* 挑战列表 */}
        {activeTab === 'challenges' && (
          <>
            {loadingChallenges ? (
              /* 挑战列表骨架屏 */
              <div className="space-y-3 sm:space-y-4">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="border-2 border-white/10 p-3 sm:p-4 animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-5 bg-white/10 rounded" />
                          <div className="w-4 h-4 bg-white/10 rounded-full" />
                        </div>
                        <div className="w-3/4 h-5 bg-white/10 rounded" />
                        <div className="space-y-2">
                          <div className="w-full h-4 bg-white/10 rounded" />
                          <div className="w-2/3 h-4 bg-white/10 rounded" />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-3 bg-white/10 rounded" />
                          <div className="w-12 h-3 bg-white/10 rounded" />
                        </div>
                      </div>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : challenges.length === 0 ? (
              <div className="text-center py-10 sm:py-12 text-white/40 font-mono text-sm">{t.noChallenges}</div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {challenges.map((c, index) => (
                  <div key={c.id} onClick={() => c.status === 'completed' && setSelectedId(c.id)}
                    className={`relative border-2 p-3 sm:p-4 transition-all group active:scale-[0.99] opacity-0 animate-fade-in-up ${c.status === 'completed' ? 'cursor-pointer hover:border-white' : ''} ${
                      c.status === 'completed' ? 'border-yolo-lime/50 bg-yolo-lime/5' : c.status === 'active' ? 'border-yolo-pink/50 bg-yolo-pink/5' : 'border-yolo-gray/50'
                    }`}
                    style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
                  >
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(c.id); }} disabled={deleting}
                      className="absolute top-2 right-2 w-6 h-6 sm:w-7 sm:h-7 bg-black/40 text-white/40 hover:text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all active:scale-95 rounded-md backdrop-blur-sm">
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                    <div className="flex items-start justify-between gap-3 sm:gap-4 pr-8">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] sm:text-xs font-mono px-1.5 sm:px-2 py-0.5 ${
                            c.status === 'completed' ? 'bg-yolo-lime text-black' : c.status === 'active' ? 'bg-yolo-pink text-black' : 'bg-yolo-gray text-white'
                          }`}>{c.category}</span>
                          {c.status === 'active' && <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yolo-pink animate-pulse" />}
                        </div>
                        <h4 className="font-bold text-white text-sm sm:text-base">{c.title}</h4>
                        <p className="text-xs sm:text-sm text-white/50 mt-1 line-clamp-2">{c.description}</p>
                        <div className="flex items-center gap-3 sm:gap-4 mt-2 text-[10px] sm:text-xs text-white/40 font-mono">
                          <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {c.estimated_time}</span>
                          {c.status === 'completed' && (
                            <>
                              <span className="flex items-center gap-1"><Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {c.like_count || 0}</span>
                              {(c.comment_count || 0) > 0 && (
                                <span className="flex items-center gap-1"><MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {c.comment_count}</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      {c.photo_url && <img src={getAssetUrl(c.photo_url)} alt="" className="w-16 h-16 sm:w-20 sm:h-20 object-cover border border-yolo-lime flex-shrink-0" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 跟随列表 */}
        {activeTab === 'following' && (
          <>
            {loadingFollow ? (
              /* 用户列表骨架屏 */
              <div className="space-y-2">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="w-24 h-4 bg-white/10 rounded" />
                      <div className="w-16 h-3 bg-white/10 rounded" />
                    </div>
                    <div className="w-16 h-7 bg-white/10 rounded-full" />
                  </div>
                ))}
              </div>
            ) : following.length === 0 ? (
              <div className="text-center py-10 sm:py-12 text-white/40 font-mono text-sm">
                <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-30" />
                {t.noFollowing}
              </div>
            ) : (
              <div className="space-y-2">
                {following.map((u, index) => (
                  <div key={u.id} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}>
                    <UserCard
                      user={u}
                      isFollowing={followingIds.has(u.id)}
                      onToggleFollow={() => handleToggleFollow(u.id)}
                      onUserClick={(userId) => setSelectedUserId(userId)}
                      t={t}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 粉丝列表 */}
        {activeTab === 'followers' && (
          <>
            {loadingFollow ? (
              /* 用户列表骨架屏 */
              <div className="space-y-2">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="w-24 h-4 bg-white/10 rounded" />
                      <div className="w-16 h-3 bg-white/10 rounded" />
                    </div>
                    <div className="w-16 h-7 bg-white/10 rounded-full" />
                  </div>
                ))}
              </div>
            ) : followers.length === 0 ? (
              <div className="text-center py-10 sm:py-12 text-white/40 font-mono text-sm">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                {t.noFollowers}
              </div>
            ) : (
              <div className="space-y-2">
                {followers.map((u, index) => (
                  <div key={u.id} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}>
                    <UserCard
                      user={u}
                      isFollowing={followingIds.has(u.id)}
                      onToggleFollow={() => handleToggleFollow(u.id)}
                      onUserClick={(userId) => setSelectedUserId(userId)}
                      t={t}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedId && <ChallengeModal challengeId={selectedId} onClose={() => { setSelectedId(null); getMyChallenges().then(setChallenges); refreshUser(); }} />}

      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={t.deleteTitle}
        message={t.deleteMsg}
        confirmText={t.deleteBtn}
        cancelText={t.cancelBtn}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
};

// 用户卡片组件
interface UserCardProps {
  user: FollowUser;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onUserClick: (userId: string) => void;
  t: { follow: string; unfollow: string };
}

const UserCard: React.FC<UserCardProps> = ({ user, isFollowing, onToggleFollow, onUserClick, t }) => {
  const [loading, setLoading] = useState(false);

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    await onToggleFollow();
    setLoading(false);
  };

  return (
    <div
      onClick={() => onUserClick(user.id)}
      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer active:scale-[0.98]"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yolo-pink to-yolo-lime p-[2px] flex-shrink-0">
        <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center overflow-hidden">
          {user.avatar ? (
            <img src={getAssetUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-bold text-sm">
              {(user.nickname || user.username || '?')[0].toUpperCase()}
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white text-sm truncate">{user.nickname || user.username}</div>
        <div className="text-xs text-white/40">@{user.username}</div>
        {user.bio && <p className="text-xs text-white/50 mt-1 line-clamp-1">{user.bio}</p>}
      </div>
      <button
        onClick={handleFollowClick}
        disabled={loading}
        className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all active:scale-95 disabled:opacity-50 ${
          isFollowing
            ? 'bg-white/10 text-white border border-white/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
            : 'bg-yolo-pink text-black hover:bg-yolo-pink/80'
        }`}
      >
        {loading ? '...' : isFollowing ? t.unfollow : t.follow}
      </button>
    </div>
  );
};

export default Profile;

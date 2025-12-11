import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getMyChallenges, updateProfile, uploadAvatar, Challenge, getAssetUrl, checkIn, getCheckInStatus, deleteChallengeApi } from '../services/authService';
import { Camera, Edit2, Check, Trophy, Flame, Clock, Heart, Calendar, Trash2 } from 'lucide-react';
import ChallengeModal from './ChallengeModal';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from './Toast';

const Profile: React.FC = () => {
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

  const t = {
    en: { 
      profile: 'PROFILE', challenges: 'CHALLENGES', completed: 'COMPLETED', likes: 'HEARTS',
      edit: 'Edit', save: 'Save', logout: 'Logout', bio: 'Life motto...',
      noChallenges: 'No challenges yet. Go make some memories!',
      checkIn: 'CHECK IN', checkedIn: 'CHECKED ✓', 
      deleteTitle: 'Delete Challenge', deleteMsg: 'Are you sure? You will lose all hearts earned from this challenge.',
      deleteBtn: 'DELETE', cancelBtn: 'CANCEL', checkInSuccess: 'Check-in successful!', deleted: 'Challenge deleted'
    },
    zh: { 
      profile: '个人资料', challenges: '挑战', completed: '已完成', likes: '心心',
      edit: '编辑', save: '保存', logout: '退出', bio: '人生态度...',
      noChallenges: '还没有挑战记录，去创造一些回忆吧！',
      checkIn: '签到', checkedIn: '已签到 ✓',
      deleteTitle: '删除挑战', deleteMsg: '确定要删除吗？将扣除该挑战获得的所有心心。',
      deleteBtn: '删除', cancelBtn: '取消', checkInSuccess: '签到成功！', deleted: '挑战已删除'
    },
    ja: { 
      profile: 'プロフィール', challenges: 'チャレンジ', completed: '完了', likes: 'ハート',
      edit: '編集', save: '保存', logout: 'ログアウト', bio: '人生のモットー...',
      noChallenges: 'まだチャレンジがありません。思い出を作りに行こう！',
      checkIn: 'チェックイン', checkedIn: 'チェック済 ✓',
      deleteTitle: 'チャレンジを削除', deleteMsg: '本当に削除しますか？獲得したハートが失われます。',
      deleteBtn: '削除', cancelBtn: 'キャンセル', checkInSuccess: 'チェックイン成功！', deleted: 'チャレンジを削除しました'
    }
  }[language] || { 
    profile: 'PROFILE', challenges: 'CHALLENGES', completed: 'COMPLETED', likes: 'HEARTS',
    edit: 'Edit', save: 'Save', logout: 'Logout', bio: 'Life motto...',
    noChallenges: 'No challenges yet. Go make some memories!',
    checkIn: 'CHECK IN', checkedIn: 'CHECKED ✓',
    deleteTitle: 'Delete Challenge', deleteMsg: 'Are you sure? You will lose all hearts earned from this challenge.',
    deleteBtn: 'DELETE', cancelBtn: 'CANCEL', checkInSuccess: 'Check-in successful!', deleted: 'Challenge deleted'
  };

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || user.username);
      setBio(user.bio || '');
      setUserLikes(user.stats?.likes || user.likes || 0);
      getMyChallenges().then(setChallenges);
      getCheckInStatus().then(s => { setCheckedIn(s.checkedIn); setUserLikes(s.likes); });
    }
  }, [user]);

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

  const completedCount = challenges.filter(c => c.status === 'completed').length;


  return (
    <div className="min-h-screen bg-yolo-black pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 头部 */}
        <div className="relative bg-[#111] border-2 border-yolo-gray/50 p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-yolo-lime overflow-hidden bg-yolo-gray">
                {user.avatar ? (
                  <img src={getAssetUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-black text-yolo-lime">
                    {(user.nickname || user.username)[0].toUpperCase()}
                  </div>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <Camera className="w-6 h-6 text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>

            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <input type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                    className="w-full bg-black border border-yolo-gray text-white px-3 py-2 font-mono focus:border-yolo-lime focus:outline-none" />
                  <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder={t.bio} rows={2}
                    className="w-full bg-black border border-yolo-gray text-white px-3 py-2 font-mono text-sm focus:border-yolo-lime focus:outline-none resize-none" />
                  <button onClick={handleSave} className="px-4 py-2 bg-yolo-lime text-black font-bold text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" /> {t.save}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-black text-white">{user.nickname || user.username}</h2>
                    <button onClick={() => setEditing(true)} className="text-white/40 hover:text-yolo-lime"><Edit2 className="w-4 h-4" /></button>
                  </div>
                  <p className="text-white/40 font-mono text-sm mb-3">@{user.username}</p>
                  {user.bio && <p className="text-white/60 text-sm">{user.bio}</p>}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-yolo-gray/50">
            <div className="text-center">
              <div className="text-3xl font-black text-yolo-lime">{challenges.length}</div>
              <div className="text-xs text-white/40 uppercase font-mono">{t.challenges}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-yolo-pink">{completedCount}</div>
              <div className="text-xs text-white/40 uppercase font-mono">{t.completed}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-red-500 flex items-center justify-center gap-1">
                <Heart className="w-6 h-6 fill-current" /> {userLikes}
              </div>
              <div className="text-xs text-white/40 uppercase font-mono">{t.likes}</div>
            </div>
            
            <button onClick={handleCheckIn} disabled={checkedIn || checkingIn}
              className={`ml-auto px-4 py-2 font-bold text-sm flex items-center gap-2 transition-all ${
                checkedIn ? 'bg-white/10 text-white/40 cursor-default' : 'bg-yolo-lime text-black hover:bg-white'
              }`}>
              <Calendar className="w-4 h-4" />
              {checkedIn ? t.checkedIn : t.checkIn}
            </button>
          </div>

          <button onClick={logout} className="absolute top-4 right-4 text-white/40 hover:text-red-500 text-sm font-mono uppercase">{t.logout}</button>
        </div>

        <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yolo-lime" /> {t.challenges}
        </h3>

        {challenges.length === 0 ? (
          <div className="text-center py-12 text-white/40 font-mono">{t.noChallenges}</div>
        ) : (
          <div className="space-y-4">
            {challenges.map(c => (
              <div key={c.id} onClick={() => c.status === 'completed' && setSelectedId(c.id)}
                className={`relative border-2 p-4 transition-all group ${c.status === 'completed' ? 'cursor-pointer hover:border-white' : ''} ${
                  c.status === 'completed' ? 'border-yolo-lime/50 bg-yolo-lime/5' : c.status === 'active' ? 'border-yolo-pink/50 bg-yolo-pink/5' : 'border-yolo-gray/50'
                }`}>
                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(c.id); }} disabled={deleting}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white/30 hover:text-red-500 hover:bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-start justify-between gap-4 pr-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-mono px-2 py-0.5 ${
                        c.status === 'completed' ? 'bg-yolo-lime text-black' : c.status === 'active' ? 'bg-yolo-pink text-black' : 'bg-yolo-gray text-white'
                      }`}>{c.category}</span>
                      {c.status === 'active' && <Flame className="w-4 h-4 text-yolo-pink animate-pulse" />}
                    </div>
                    <h4 className="font-bold text-white">{c.title}</h4>
                    <p className="text-sm text-white/50 mt-1">{c.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/40 font-mono">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.estimated_time}</span>
                    </div>
                  </div>
                  {c.photo_url && <img src={getAssetUrl(c.photo_url)} alt="" className="w-20 h-20 object-cover border border-yolo-lime" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedId && <ChallengeModal challengeId={selectedId} onClose={() => { setSelectedId(null); getMyChallenges().then(setChallenges); refreshUser(); }} />}
      
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

export default Profile;

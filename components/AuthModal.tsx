import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Lock, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { language } = useLanguage();

  const t = {
    en: {
      login: 'LOGIN', register: 'REGISTER', email: 'Email', password: 'Password',
      username: 'Username', noAccount: "Don't have an account?", hasAccount: 'Already have an account?',
      signUp: 'Sign up', signIn: 'Sign in', welcome: 'WELCOME BACK', joinUs: 'JOIN THE CHAOS'
    },
    zh: {
      login: '登录', register: '注册', email: '邮箱', password: '密码',
      username: '用户名', noAccount: '还没有账号？', hasAccount: '已有账号？',
      signUp: '注册', signIn: '登录', welcome: '欢迎回来', joinUs: '加入混乱'
    },
    ja: {
      login: 'ログイン', register: '登録', email: 'メール', password: 'パスワード',
      username: 'ユーザー名', noAccount: 'アカウントがない？', hasAccount: 'アカウントをお持ち？',
      signUp: '登録', signIn: 'ログイン', welcome: 'おかえり', joinUs: 'カオスに参加'
    }
  }[language] || {
    login: 'LOGIN', register: 'REGISTER', email: 'Email', password: 'Password',
    username: 'Username', noAccount: "Don't have an account?", hasAccount: 'Already have an account?',
    signUp: 'Sign up', signIn: 'Sign in', welcome: 'WELCOME BACK', joinUs: 'JOIN THE CHAOS'
  };

  // 锁定 body 滚动
  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#121212] rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-yolo-pink text-black flex items-center justify-center rounded-full hover:bg-white active:scale-95 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 标题 */}
        <div className="bg-yolo-lime text-black p-5 text-center relative">
          <h2 className="text-2xl font-black uppercase tracking-wider">
            {mode === 'login' ? t.welcome : t.joinUs}
          </h2>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 text-sm font-mono rounded-lg">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={t.username}
                required
                autoComplete="username"
                className="w-full bg-white/5 border border-white/10 focus:border-yolo-lime text-white pl-12 pr-4 py-3.5 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-yolo-lime/30 transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t.email}
              required
              autoComplete="email"
              className="w-full bg-white/5 border border-white/10 focus:border-yolo-lime text-white pl-12 pr-4 py-3.5 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-yolo-lime/30 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t.password}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full bg-white/5 border border-white/10 focus:border-yolo-lime text-white pl-12 pr-4 py-3.5 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-yolo-lime/30 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-yolo-lime text-black font-black uppercase tracking-wider rounded-xl hover:bg-yolo-pink active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-5 h-5" />
            {loading ? '...' : mode === 'login' ? t.login : t.register}
          </button>

          <div className="text-center text-white/50 text-sm font-mono pt-2">
            {mode === 'login' ? t.noAccount : t.hasAccount}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-yolo-pink hover:text-yolo-lime transition-colors font-bold"
            >
              {mode === 'login' ? t.signUp : t.signIn}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AuthModal;

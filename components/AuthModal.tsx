import React, { useState } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-[#0a0a0a] border-2 border-yolo-white relative animate-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button 
          onClick={onClose}
          className="absolute -top-3 -right-3 w-10 h-10 bg-yolo-pink text-black flex items-center justify-center hover:bg-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 标题 */}
        <div className="bg-yolo-lime text-black p-4 text-center">
          <h2 className="text-2xl font-black uppercase tracking-wider">
            {mode === 'login' ? t.welcome : t.joinUs}
          </h2>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 text-sm font-mono">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yolo-gray" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={t.username}
                required
                className="w-full bg-black border-2 border-yolo-gray focus:border-yolo-lime text-white pl-12 pr-4 py-3 font-mono uppercase focus:outline-none transition-colors"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yolo-gray" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t.email}
              required
              className="w-full bg-black border-2 border-yolo-gray focus:border-yolo-lime text-white pl-12 pr-4 py-3 font-mono focus:outline-none transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yolo-gray" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t.password}
              required
              minLength={6}
              className="w-full bg-black border-2 border-yolo-gray focus:border-yolo-lime text-white pl-12 pr-4 py-3 font-mono focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-yolo-lime text-black font-black uppercase tracking-wider hover:bg-yolo-pink transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-5 h-5" />
            {loading ? '...' : mode === 'login' ? t.login : t.register}
          </button>

          <div className="text-center text-yolo-gray text-sm font-mono">
            {mode === 'login' ? t.noAccount : t.hasAccount}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-yolo-lime hover:text-yolo-pink transition-colors"
            >
              {mode === 'login' ? t.signUp : t.signIn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;

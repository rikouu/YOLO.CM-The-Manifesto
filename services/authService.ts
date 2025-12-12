const API_BASE = import.meta.env.VITE_API_URL || '';

// 获取完整的资源 URL（用于图片等静态资源）
export function getAssetUrl(path: string | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // 本地开发时，静态资源需要完整域名
  const baseUrl = import.meta.env.VITE_ASSET_URL || API_BASE || '';
  return `${baseUrl}${path}`;
}

export interface User {
  id: string;
  username: string;
  email: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
  likes?: number;
  stats?: { total: number; completed: number; likes: number };
  following_count?: number;
  followers_count?: number;
  is_following?: boolean;
}

export interface Challenge {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  estimated_time?: string;
  status: 'pending' | 'active' | 'completed';
  photo_url?: string;
  completed_at?: string;
  created_at: string;
  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;
  user?: { id?: string; username: string; nickname?: string; avatar?: string; likes?: number; is_following?: boolean };
}

export interface Comment {
  id: string;
  challenge_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: { id?: string; username: string; nickname?: string; avatar?: string };
}

function getToken(): string | null {
  return localStorage.getItem('yolo_token');
}

function setToken(token: string) {
  localStorage.setItem('yolo_token', token);
}

function clearToken() {
  localStorage.removeItem('yolo_token');
}

async function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    throw new Error('Unauthorized');
  }
  return res;
}

export async function register(username: string, email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Registration failed');
  }
  const data = await res.json();
  setToken(data.token);
  return data;
}

export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Login failed');
  }
  const data = await res.json();
  setToken(data.token);
  return data;
}

export async function getMe(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await authFetch('/api/auth/me');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function updateProfile(data: { nickname?: string; bio?: string }): Promise<User> {
  const res = await authFetch('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function uploadAvatar(file: File): Promise<User> {
  const token = getToken();
  const formData = new FormData();
  formData.append('avatar', file);
  
  const res = await fetch(`${API_BASE}/api/auth/avatar`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  return res.json();
}

export function logout() {
  clearToken();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// 挑战相关
export async function acceptChallenge(challenge: {
  title: string;
  description: string;
  category: string;
  difficulty: number;
  estimatedTime?: string;
}): Promise<Challenge> {
  const res = await authFetch('/api/challenges/accept', {
    method: 'POST',
    body: JSON.stringify(challenge),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to accept challenge');
  }
  return res.json();
}

export async function getActiveChallenge(): Promise<Challenge | null> {
  const res = await authFetch('/api/challenges/active');
  if (!res.ok) return null;
  return res.json();
}

export async function completeChallenge(id: string, photo: File): Promise<Challenge> {
  const token = getToken();
  const formData = new FormData();
  formData.append('photo', photo);
  
  const res = await fetch(`${API_BASE}/api/challenges/${id}/complete`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to complete challenge');
  }
  return res.json();
}

export async function getMyChallenges(): Promise<Challenge[]> {
  const res = await authFetch('/api/challenges/my');
  return res.json();
}

export async function getChallengeWall(limit = 50, offset = 0): Promise<Challenge[]> {
  const res = await fetch(`${API_BASE}/api/challenges/wall?limit=${limit}&offset=${offset}`);
  return res.json();
}

// 获取挑战详情
export async function getChallengeDetail(id: string): Promise<Challenge> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/challenges/${id}`, { headers });
  return res.json();
}

// 获取评论
export async function getComments(challengeId: string): Promise<Comment[]> {
  const res = await fetch(`${API_BASE}/api/challenges/${challengeId}/comments`);
  return res.json();
}

// 添加评论
export async function addComment(challengeId: string, content: string): Promise<Comment> {
  const res = await authFetch(`/api/challenges/${challengeId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  return res.json();
}

// 点赞/取消点赞
export async function toggleLike(challengeId: string): Promise<{ liked: boolean; like_count: number; user_likes: number }> {
  const res = await authFetch(`/api/challenges/${challengeId}/like`, { method: 'POST' });
  return res.json();
}

// 签到
export async function checkIn(): Promise<{ success: boolean; likes: number; message: string }> {
  const res = await authFetch('/api/checkin', { method: 'POST' });
  return res.json();
}

// 获取签到状态
export async function getCheckInStatus(): Promise<{ checkedIn: boolean; likes: number }> {
  const res = await authFetch('/api/checkin/status');
  return res.json();
}

// 删除挑战
export async function deleteChallengeApi(id: string): Promise<{ success: boolean; deducted: number }> {
  const res = await authFetch(`/api/challenges/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete challenge');
  }
  return res.json();
}

// 格式化数字显示（用于角标）
export function formatLikesCount(num: number): string {
  if (num >= 10000) {
    const w = num / 10000;
    return w >= 10 ? `${Math.floor(w)}w+` : `${w.toFixed(1).replace(/\.0$/, '')}w+`;
  }
  if (num >= 1000) {
    const k = num / 1000;
    return k >= 10 ? `${Math.floor(k)}k+` : `${k.toFixed(1).replace(/\.0$/, '')}k+`;
  }
  if (num >= 100) {
    return `${Math.floor(num / 100) * 100}+`;
  }
  return String(num);
}

// 跟随相关接口
export interface FollowUser {
  id: string;
  username: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
  is_following?: boolean;
}

// 跟随/取消跟随用户
export async function toggleFollow(userId: string): Promise<{ following: boolean; followers_count: number }> {
  const res = await authFetch(`/api/users/${userId}/follow`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to toggle follow');
  }
  return res.json();
}

// 获取我跟随的用户列表
export async function getFollowing(): Promise<FollowUser[]> {
  const res = await authFetch('/api/users/following');
  if (!res.ok) return [];
  return res.json();
}

// 获取跟随我的用户列表
export async function getFollowers(): Promise<FollowUser[]> {
  const res = await authFetch('/api/users/followers');
  if (!res.ok) return [];
  return res.json();
}

// 获取用户公开资料
export async function getUserProfile(userId: string): Promise<User | null> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/users/${userId}/profile`, { headers });
  if (!res.ok) return null;
  return res.json();
}

// 获取用户的已完成挑战
export async function getUserChallenges(userId: string): Promise<Challenge[]> {
  const res = await fetch(`${API_BASE}/api/users/${userId}/challenges`);
  if (!res.ok) return [];
  return res.json();
}

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  createUser, getUserByEmail, getUserById, getUserByUsername, updateUser,
  createChallenge, getChallengeById, getUserChallenges, getActiveChallenge,
  completeChallenge, getCompletedChallenges, getUserStats, getChallengeWithDetails,
  addComment, getComments, toggleLike, checkIn, hasCheckedInToday, getUserLikes,
  deleteChallenge
} from './db';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'yolo-secret-key-change-in-production';

// 确保上传目录存在
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer 配置
const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, uploadDir),
  filename: (_req: any, file: any, cb: any) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// JWT 验证中间件
interface AuthRequest extends express.Request {
  userId?: string;
  file?: Express.Multer.File;
}

function authMiddleware(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// 配置
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const PROXY_URL = process.env.GEMINI_PROXY_URL;
const BASE_URL = PROXY_URL || 'https://generativelanguage.googleapis.com';

// Fallback 数据
const fallbacks: Record<string, { title: string; desc: string }> = {
  en: { title: "Disconnect", desc: "Turn off your phone for exactly 60 minutes. No cheating." },
  zh: { title: "断开连接", desc: "关掉手机整整60分钟。不许作弊。" },
  ja: { title: "切断", desc: "携帯電話をきっかり60分間電源オフにしてください。不正なしで。" }
};

// Gemini API 调用
async function callGemini(prompt: string) {
  const url = `${BASE_URL}/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 1.2, responseMimeType: "application/json" }
    })
  });
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

// ========== 用户 API ==========

// 注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (getUserByEmail(email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (getUserByUsername(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const user = createUser(username, email, password);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = getUserByEmail(email);
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!bcrypt.compareSync(password, user.password as string)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 获取当前用户
app.get('/api/auth/me', authMiddleware as any, (req: AuthRequest, res) => {
  const user = getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const stats = getUserStats(req.userId!);
  res.json({ ...user, stats });
});

// 更新用户资料
app.put('/api/auth/profile', authMiddleware as any, (req: AuthRequest, res) => {
  const { nickname, bio } = req.body;
  const user = updateUser(req.userId!, { nickname, bio });
  res.json(user);
});

// 上传头像
app.post('/api/auth/avatar', authMiddleware as any, upload.single('avatar'), (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const avatarUrl = `/uploads/${req.file.filename}`;
  const user = updateUser(req.userId!, { avatar: avatarUrl });
  res.json(user);
});

// ========== 挑战 API ==========

// 生成挑战（不需要登录）
app.post('/api/generate-challenge', async (req, res) => {
  try {
    const { mood, language = 'en' } = req.body;
    if (!mood) return res.status(400).json({ error: 'mood is required' });

    const prompt = `Generate a unique, slightly chaotic, but safe "YOLO" challenge for a user.
The user's current mood is: ${mood}.
The challenge should be something memorable that breaks their routine.
Make it edgy but legal and safe.

IMPORTANT: The content MUST be in language: ${language} (zh=Chinese, ja=Japanese, en=English).

Return ONLY valid JSON:
{
  "title": "short catchy title",
  "description": "specific instruction",
  "difficulty": 50,
  "category": "SOCIAL",
  "estimatedTime": "30 mins"
}

category: SOCIAL, PHYSICAL, MENTAL, or CHAOS
difficulty: 1-100`;

    const text = await callGemini(prompt);
    if (text) {
      res.json(JSON.parse(text));
    } else {
      throw new Error("No response");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    const lang = req.body?.language || 'en';
    const fb = fallbacks[lang] || fallbacks.en;
    res.json({ title: fb.title, description: fb.desc, difficulty: 40, category: "MENTAL", estimatedTime: "60 mins" });
  }
});

// 接受挑战（需要登录）
app.post('/api/challenges/accept', authMiddleware as any, (req: AuthRequest, res) => {
  try {
    const { title, description, category, difficulty, estimatedTime } = req.body;
    
    // 检查是否有进行中的挑战
    const active = getActiveChallenge(req.userId!);
    if (active) {
      return res.status(400).json({ error: 'You already have an active challenge', challenge: active });
    }
    
    const challenge = createChallenge(req.userId!, {
      title, description, category, difficulty, estimated_time: estimatedTime
    });
    res.json(challenge);
  } catch (error) {
    console.error('Accept challenge error:', error);
    res.status(500).json({ error: 'Failed to accept challenge' });
  }
});

// 获取当前进行中的挑战
app.get('/api/challenges/active', authMiddleware as any, (req: AuthRequest, res) => {
  const challenge = getActiveChallenge(req.userId!);
  res.json(challenge);
});

// 完成挑战（上传照片）
app.post('/api/challenges/:id/complete', authMiddleware as any, upload.single('photo'), (req: AuthRequest, res) => {
  try {
    const challenge = getChallengeById(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (challenge.user_id !== req.userId) return res.status(403).json({ error: 'Not your challenge' });
    if (challenge.status !== 'active') return res.status(400).json({ error: 'Challenge not active' });
    if (!req.file) return res.status(400).json({ error: 'Photo required' });
    
    const photoUrl = `/uploads/${req.file.filename}`;
    const completed = completeChallenge(req.params.id, photoUrl);
    res.json(completed);
  } catch (error) {
    console.error('Complete challenge error:', error);
    res.status(500).json({ error: 'Failed to complete challenge' });
  }
});

// 获取用户的所有挑战
app.get('/api/challenges/my', authMiddleware as any, (req: AuthRequest, res) => {
  const challenges = getUserChallenges(req.userId!);
  res.json(challenges);
});

// 获取挑战瀑布墙（所有用户完成的挑战）
app.get('/api/challenges/wall', (_req, res) => {
  const limit = parseInt(_req.query.limit as string) || 50;
  const offset = parseInt(_req.query.offset as string) || 0;
  const challenges = getCompletedChallenges(limit, offset);
  res.json(challenges);
});

// 获取挑战详情（含点赞评论数）
app.get('/api/challenges/:id', (req: AuthRequest, res) => {
  // 尝试获取用户ID（可选）
  const token = req.headers.authorization?.replace('Bearer ', '');
  let userId: string | undefined;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch {}
  }
  const challenge = getChallengeWithDetails(req.params.id, userId);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
  res.json(challenge);
});

// 获取挑战评论
app.get('/api/challenges/:id/comments', (_req, res) => {
  const comments = getComments(_req.params.id);
  res.json(comments);
});

// 添加评论
app.post('/api/challenges/:id/comments', authMiddleware as any, (req: AuthRequest, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
  const comment = addComment(req.params.id, req.userId!, content.trim());
  res.json(comment);
});

// 点赞/取消点赞
app.post('/api/challenges/:id/like', authMiddleware as any, (req: AuthRequest, res) => {
  const result = toggleLike(req.params.id, req.userId!);
  res.json(result);
});

// 签到
app.post('/api/checkin', authMiddleware as any, (req: AuthRequest, res) => {
  const result = checkIn(req.userId!);
  res.json(result);
});

// 获取签到状态
app.get('/api/checkin/status', authMiddleware as any, (req: AuthRequest, res) => {
  const checkedIn = hasCheckedInToday(req.userId!);
  const likes = getUserLikes(req.userId!);
  res.json({ checkedIn, likes });
});

// 删除挑战
app.delete('/api/challenges/:id', authMiddleware as any, (req: AuthRequest, res) => {
  const result = deleteChallenge(req.params.id, req.userId!);
  if (!result.success) {
    return res.status(404).json({ error: 'Challenge not found or not yours' });
  }
  res.json({ success: true, deducted: result.deducted });
});

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📡 Using API endpoint: ${BASE_URL}`);
});

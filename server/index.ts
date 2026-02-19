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
  deleteChallenge, toggleFollow, getFollowing, getFollowers, getUserPublicProfile,
  getUserCompletedChallenges, getFollowingCount, getFollowersCount,
  getAIUsageToday, incrementAIUsage, setUserAILimit, setUserAdmin, listAllUsers,
  DEFAULT_DAILY_AI_LIMIT
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

function adminMiddleware(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const user = req.userId ? getUserById(req.userId) : null;
  if (!user || !(user as any).is_admin) {
    return res.status(403).json({ error: 'Admin required' });
  }
  next();
}

// 配置
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const BASE_URL = 'https://generativelanguage.googleapis.com'; // ARM在日本，直连无需代理

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
  const followingCount = getFollowingCount(req.userId!);
  const followersCount = getFollowersCount(req.userId!);
  res.json({ ...user, stats, following_count: followingCount, followers_count: followersCount });
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

// 生成挑战（需要登录 + 每日限额）
app.post('/api/generate-challenge', authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    // 检查每日限额
    const usage = getAIUsageToday(req.userId!);
    if (usage.remaining <= 0) {
      return res.status(429).json({
        error: `Daily AI generation limit reached (${usage.limit}/day). Try again tomorrow.`,
        usage
      });
    }
    
    const { mood, language = 'en', environment, socialLevel } = req.body;
    if (!mood) return res.status(400).json({ error: 'mood is required' });

    // 根据语言构建示例
    const langConfig: Record<string, { instruction: string }> = {
      zh: { instruction: '请用中文回复，标题和描述都必须是中文' },
      ja: { instruction: '日本語で回答してください。タイトルと説明は日本語で書いてください' },
      en: { instruction: 'Reply in English. Title and description must be in English' }
    };

    const config = langConfig[language] || langConfig.en;

    // 构建环境和社交约束
    const envConstraint = environment && environment !== 'any' 
      ? `Environment: ${environment === 'indoor' ? 'INDOOR only' : environment === 'outdoor' ? 'OUTDOOR only' : 'ONLINE/digital only'}.`
      : '';
    
    const socialConstraint = socialLevel && socialLevel !== 'any'
      ? `Social: ${socialLevel === 'solo' ? 'SOLO (no people interaction)' : socialLevel === 'one-on-one' ? 'ONE-ON-ONE interaction' : socialLevel === 'strangers' ? 'with STRANGERS' : 'GROUP activity (3+ people)'}.`
      : '';

    const prompt = `You are a YOLO challenge generator. Create a UNIQUE challenge that makes people feel ALIVE.
${config.instruction}

IMPORTANT: Generate a COMPLETELY NEW and CREATIVE challenge. DO NOT copy examples. Each response must be DIFFERENT.

User's mood: "${mood}"
${envConstraint ? envConstraint : ''}
${socialConstraint ? socialConstraint : ''}

YOLO PHILOSOPHY: Life is too short for regrets. Push comfort zones. Create unforgettable memories.

GOOD challenges:
- Ask someone "out of your league" for their number
- Sing loudly in a public place for 30 seconds
- Send that risky text you've been drafting
- Talk to the most intimidating person in the room
- Do something embarrassing on purpose and own it
- Give a genuine compliment to 5 strangers
- Video call someone you haven't talked to in years

BAD challenges (NEVER suggest these):
- Generic self-care (meditate, journal, walk)
- Illegal or dangerous activities
- Harassment or making others uncomfortable
- Vague advice ("be confident")

The challenge should make them think "oh shit, can I really do this?" then "...why not?"

Generate 3 ideas mentally, pick the most FUN and DOABLE one.

Return ONLY valid JSON (no markdown, no explanation):
{"title":"YOUR_UNIQUE_TITLE","description":"YOUR_SPECIFIC_DESCRIPTION","difficulty":NUMBER,"category":"CATEGORY","estimatedTime":"TIME","environment":"ENV","socialLevel":"LEVEL"}

Rules:
- title: 2-6 words, catchy, in ${language === 'zh' ? 'Chinese' : language === 'ja' ? 'Japanese' : 'English'}
- description: 1-2 sentences, specific action with context
- difficulty: 30-90 (no easy mode)
- category: SOCIAL/PHYSICAL/MENTAL/CHAOS
- estimatedTime: "5 mins" to "2 hours"
- environment: indoor/outdoor/online
- socialLevel: solo/one-on-one/strangers/group

BE CREATIVE! SURPRISE ME!`;

    const text = await callGemini(prompt);
    if (!text) throw new Error("Empty response");
    
    // 清理响应文本
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    const jsonMatch = jsonStr.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // 严格验证必要字段
    if (!parsed.title || !parsed.description) {
      throw new Error("Missing title or description");
    }
    
    res.json({
      title: String(parsed.title),
      description: String(parsed.description),
      difficulty: Math.min(100, Math.max(1, Number(parsed.difficulty) || 50)),
      category: ['SOCIAL', 'PHYSICAL', 'MENTAL', 'CHAOS'].includes(parsed.category) ? parsed.category : 'CHAOS',
      estimatedTime: String(parsed.estimatedTime || parsed.estimated_time || '30 mins'),
      environment: ['indoor', 'outdoor', 'online'].includes(parsed.environment) ? parsed.environment : 'outdoor',
      socialLevel: ['solo', 'one-on-one', 'strangers', 'group'].includes(parsed.socialLevel) ? parsed.socialLevel : 'solo',
      usage: incrementAIUsage(req.userId!)
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    const lang = req.body?.language || 'en';
    const fb = fallbacks[lang] || fallbacks.en;
    res.json({ title: fb.title, description: fb.desc, difficulty: 40, category: "MENTAL", estimatedTime: "60 mins", environment: "indoor", socialLevel: "solo" });
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

// ========== AI 使用量 API ==========

// 获取当前用户AI使用情况
app.get('/api/ai/usage', authMiddleware as any, (req: AuthRequest, res) => {
  const usage = getAIUsageToday(req.userId!);
  res.json(usage);
});

// ========== 管理员 API ==========

// 列出所有用户
app.get('/api/admin/users', authMiddleware as any, adminMiddleware as any, (_req, res) => {
  res.json(listAllUsers());
});

// 设置用户每日AI生成限额（null = 恢复默认）
app.put('/api/admin/users/:id/ai-limit', authMiddleware as any, adminMiddleware as any, (req, res) => {
  const { limit } = req.body; // number or null
  const user = setUserAILimit(req.params.id, limit === null ? null : Number(limit));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user, message: `AI daily limit set to ${limit ?? DEFAULT_DAILY_AI_LIMIT} (default: ${DEFAULT_DAILY_AI_LIMIT})` });
});

// 设置/取消管理员权限
app.put('/api/admin/users/:id/admin', authMiddleware as any, adminMiddleware as any, (req, res) => {
  const { is_admin } = req.body;
  const user = setUserAdmin(req.params.id, Boolean(is_admin));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ========== 用户关系 API ==========

// 跟随/取消跟随用户
app.post('/api/users/:id/follow', authMiddleware as any, (req: AuthRequest, res) => {
  const targetUserId = req.params.id;
  if (targetUserId === req.userId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }
  const result = toggleFollow(req.userId!, targetUserId);
  res.json(result);
});

// 获取我跟随的用户列表
app.get('/api/users/following', authMiddleware as any, (req: AuthRequest, res) => {
  const following = getFollowing(req.userId!);
  res.json(following);
});

// 获取跟随我的用户列表
app.get('/api/users/followers', authMiddleware as any, (req: AuthRequest, res) => {
  const followers = getFollowers(req.userId!, req.userId);
  res.json(followers);
});

// 获取用户公开资料
app.get('/api/users/:id/profile', (req: AuthRequest, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  let currentUserId: string | undefined;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      currentUserId = decoded.userId;
    } catch {}
  }
  const profile = getUserPublicProfile(req.params.id, currentUserId);
  if (!profile) return res.status(404).json({ error: 'User not found' });
  res.json(profile);
});

// 获取用户已完成的挑战
app.get('/api/users/:id/challenges', (_req, res) => {
  const challenges = getUserCompletedChallenges(_req.params.id);
  res.json(challenges);
});

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📡 Using API endpoint: ${BASE_URL}`);
});

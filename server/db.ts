import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const DATA_DIR = './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CHALLENGES_FILE = path.join(DATA_DIR, 'challenges.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');
const LIKES_FILE = path.join(DATA_DIR, 'likes.json');
const CHECKINS_FILE = path.join(DATA_DIR, 'checkins.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// 初始化文件
const initFile = (file: string) => { if (!fs.existsSync(file)) fs.writeFileSync(file, '[]'); };
initFile(USERS_FILE);
initFile(CHALLENGES_FILE);
initFile(COMMENTS_FILE);
initFile(LIKES_FILE);
initFile(CHECKINS_FILE);

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
  likes: number; // 持有的赞数量
  created_at: string;
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
}

export interface Comment {
  id: string;
  challenge_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Like {
  id: string;
  challenge_id: string;
  user_id: string;
  created_at: string;
}

export interface CheckIn {
  user_id: string;
  date: string; // YYYY-MM-DD
}

// 读写函数
function readJSON<T>(file: string): T[] {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
function writeJSON<T>(file: string, data: T[]) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const readUsers = () => readJSON<User>(USERS_FILE);
const writeUsers = (d: User[]) => writeJSON(USERS_FILE, d);
const readChallenges = () => readJSON<Challenge>(CHALLENGES_FILE);
const writeChallenges = (d: Challenge[]) => writeJSON(CHALLENGES_FILE, d);
const readComments = () => readJSON<Comment>(COMMENTS_FILE);
const writeComments = (d: Comment[]) => writeJSON(COMMENTS_FILE, d);
const readLikes = () => readJSON<Like>(LIKES_FILE);
const writeLikes = (d: Like[]) => writeJSON(LIKES_FILE, d);
const readCheckIns = () => readJSON<CheckIn>(CHECKINS_FILE);
const writeCheckIns = (d: CheckIn[]) => writeJSON(CHECKINS_FILE, d);

// ========== 用户 ==========
export function createUser(username: string, email: string, password: string): User {
  const users = readUsers();
  const id = uuidv4();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user: User = {
    id, username, email, password: hashedPassword, nickname: username,
    likes: 5, // 新用户赠送5个赞
    created_at: new Date().toISOString()
  };
  users.push(user);
  writeUsers(users);
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

export function getUserByEmail(email: string): User | null {
  return readUsers().find(u => u.email === email) || null;
}

export function getUserById(id: string): User | null {
  const user = readUsers().find(u => u.id === id);
  if (!user) return null;
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

export function getUserByUsername(username: string): User | null {
  const user = readUsers().find(u => u.username === username);
  if (!user) return null;
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

export function updateUser(id: string, data: Partial<Pick<User, 'nickname' | 'avatar' | 'bio'>>): User | null {
  const users = readUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  if (data.nickname !== undefined) users[index].nickname = data.nickname;
  if (data.avatar !== undefined) users[index].avatar = data.avatar;
  if (data.bio !== undefined) users[index].bio = data.bio;
  writeUsers(users);
  return getUserById(id);
}

export function updateUserLikes(id: string, delta: number): number {
  const users = readUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return 0;
  users[index].likes = (users[index].likes || 0) + delta;
  if (users[index].likes < 0) users[index].likes = 0;
  writeUsers(users);
  return users[index].likes;
}

export function getUserLikes(id: string): number {
  const user = readUsers().find(u => u.id === id);
  return user?.likes || 0;
}


// ========== 挑战 ==========
export function createChallenge(userId: string, challenge: {
  title: string; description: string; category: string; difficulty: number; estimated_time?: string;
}): Challenge {
  const challenges = readChallenges();
  const newChallenge: Challenge = {
    id: uuidv4(), user_id: userId, ...challenge, estimated_time: challenge.estimated_time,
    status: 'active', created_at: new Date().toISOString()
  };
  challenges.push(newChallenge);
  writeChallenges(challenges);
  return newChallenge;
}

export function getChallengeById(id: string): Challenge | null {
  return readChallenges().find(c => c.id === id) || null;
}

export function getUserChallenges(userId: string): Challenge[] {
  return readChallenges().filter(c => c.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getActiveChallenge(userId: string): Challenge | null {
  return readChallenges().find(c => c.user_id === userId && c.status === 'active') || null;
}

export function completeChallenge(id: string, photoUrl: string): Challenge | null {
  const challenges = readChallenges();
  const index = challenges.findIndex(c => c.id === id);
  if (index === -1) return null;
  challenges[index].status = 'completed';
  challenges[index].photo_url = photoUrl;
  challenges[index].completed_at = new Date().toISOString();
  writeChallenges(challenges);
  // 完成挑战奖励 +10 心心
  updateUserLikes(challenges[index].user_id, 10);
  return challenges[index];
}

// 删除挑战（扣除该挑战获得的心心）
export function deleteChallenge(id: string, userId: string): { success: boolean; deducted: number } {
  const challenges = readChallenges();
  const likes = readLikes();
  const comments = readComments();
  
  const index = challenges.findIndex(c => c.id === id && c.user_id === userId);
  if (index === -1) return { success: false, deducted: 0 };
  
  const challenge = challenges[index];
  
  // 计算需要扣除的心心：该挑战收到的点赞数 + 完成奖励(10)
  const receivedLikes = likes.filter(l => l.challenge_id === id).length;
  const completionBonus = challenge.status === 'completed' ? 10 : 0;
  const totalDeduct = receivedLikes + completionBonus;
  
  // 删除挑战
  challenges.splice(index, 1);
  writeChallenges(challenges);
  
  // 删除相关点赞（返还给点赞者）
  const challengeLikes = likes.filter(l => l.challenge_id === id);
  challengeLikes.forEach(l => updateUserLikes(l.user_id, 1));
  const remainingLikes = likes.filter(l => l.challenge_id !== id);
  writeLikes(remainingLikes);
  
  // 删除相关评论
  const remainingComments = comments.filter(c => c.challenge_id !== id);
  writeComments(remainingComments);
  
  // 扣除用户心心
  updateUserLikes(userId, -totalDeduct);
  
  return { success: true, deducted: totalDeduct };
}

export function getCompletedChallenges(limit = 50, offset = 0): (Challenge & { user?: Partial<User>; like_count?: number; comment_count?: number })[] {
  const challenges = readChallenges();
  const users = readUsers();
  const likes = readLikes();
  const comments = readComments();
  
  const completed = challenges
    .filter(c => c.status === 'completed')
    .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())
    .slice(offset, offset + limit);
  
  return completed.map(c => {
    const user = users.find(u => u.id === c.user_id);
    const likeCount = likes.filter(l => l.challenge_id === c.id).length;
    const commentCount = comments.filter(cm => cm.challenge_id === c.id).length;
    return {
      ...c, like_count: likeCount, comment_count: commentCount,
      user: user ? { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, likes: user.likes } : undefined
    };
  });
}

export function getChallengeWithDetails(id: string, currentUserId?: string): (Challenge & { 
  user?: Partial<User>; like_count: number; comment_count: number; liked_by_me: boolean 
}) | null {
  const challenge = getChallengeById(id);
  if (!challenge) return null;
  const users = readUsers();
  const likes = readLikes();
  const comments = readComments();
  const user = users.find(u => u.id === challenge.user_id);
  const challengeLikes = likes.filter(l => l.challenge_id === id);
  const challengeComments = comments.filter(c => c.challenge_id === id);
  return {
    ...challenge,
    like_count: challengeLikes.length,
    comment_count: challengeComments.length,
    liked_by_me: currentUserId ? challengeLikes.some(l => l.user_id === currentUserId) : false,
    user: user ? { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar } : undefined
  };
}

export function getUserStats(userId: string): { total: number; completed: number; likes: number } {
  const challenges = readChallenges().filter(c => c.user_id === userId);
  const user = readUsers().find(u => u.id === userId);
  return {
    total: challenges.length,
    completed: challenges.filter(c => c.status === 'completed').length,
    likes: user?.likes || 0
  };
}


// ========== 评论 ==========
export function addComment(challengeId: string, userId: string, content: string): Comment & { user?: Partial<User> } {
  const comments = readComments();
  const comment: Comment = {
    id: uuidv4(), challenge_id: challengeId, user_id: userId, content, created_at: new Date().toISOString()
  };
  comments.push(comment);
  writeComments(comments);
  const user = getUserById(userId);
  return { ...comment, user: user ? { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar } : undefined };
}

export function getComments(challengeId: string): (Comment & { user?: Partial<User> })[] {
  const comments = readComments().filter(c => c.challenge_id === challengeId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const users = readUsers();
  return comments.map(c => {
    const user = users.find(u => u.id === c.user_id);
    return { ...c, user: user ? { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar } : undefined };
  });
}

// ========== 点赞 ==========
export function toggleLike(challengeId: string, userId: string): { liked: boolean; like_count: number; user_likes: number } {
  const likes = readLikes();
  const challenge = getChallengeById(challengeId);
  if (!challenge) return { liked: false, like_count: 0, user_likes: getUserLikes(userId) };
  
  const existingIndex = likes.findIndex(l => l.challenge_id === challengeId && l.user_id === userId);
  
  if (existingIndex >= 0) {
    // 取消点赞：返还赞给点赞者，从作者扣除
    likes.splice(existingIndex, 1);
    writeLikes(likes);
    updateUserLikes(userId, 1); // 返还
    updateUserLikes(challenge.user_id, -1); // 扣除
    return { liked: false, like_count: likes.filter(l => l.challenge_id === challengeId).length, user_likes: getUserLikes(userId) };
  } else {
    // 点赞：检查用户是否有足够的赞
    const userLikes = getUserLikes(userId);
    if (userLikes <= 0) {
      return { liked: false, like_count: likes.filter(l => l.challenge_id === challengeId).length, user_likes: 0 };
    }
    likes.push({ id: uuidv4(), challenge_id: challengeId, user_id: userId, created_at: new Date().toISOString() });
    writeLikes(likes);
    updateUserLikes(userId, -1); // 消耗
    updateUserLikes(challenge.user_id, 1); // 作者获得
    return { liked: true, like_count: likes.filter(l => l.challenge_id === challengeId).length, user_likes: getUserLikes(userId) };
  }
}

export function getLikeCount(challengeId: string): number {
  return readLikes().filter(l => l.challenge_id === challengeId).length;
}

export function hasLiked(challengeId: string, userId: string): boolean {
  return readLikes().some(l => l.challenge_id === challengeId && l.user_id === userId);
}

// ========== 签到 ==========
export function checkIn(userId: string): { success: boolean; likes: number; message: string } {
  const checkIns = readCheckIns();
  const today = new Date().toISOString().split('T')[0];
  const alreadyCheckedIn = checkIns.some(c => c.user_id === userId && c.date === today);
  
  if (alreadyCheckedIn) {
    return { success: false, likes: getUserLikes(userId), message: 'Already checked in today' };
  }
  
  checkIns.push({ user_id: userId, date: today });
  writeCheckIns(checkIns);
  const newLikes = updateUserLikes(userId, 5);
  return { success: true, likes: newLikes, message: 'Check-in successful! +5 likes' };
}

export function hasCheckedInToday(userId: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return readCheckIns().some(c => c.user_id === userId && c.date === today);
}

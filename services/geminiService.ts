import { Challenge, Language, Environment, SocialLevel } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const fallbacks: Record<Language, { title: string; desc: string }> = {
  en: { title: "Disconnect", desc: "Turn off your phone for exactly 60 minutes. No cheating." },
  zh: { title: "断开连接", desc: "关掉手机整整60分钟。不许作弊。" },
  ja: { title: "切断", desc: "携帯電話をきっかり60分間電源オフにしてください。不正なしで。" }
};

export interface GenerateOptions {
  mood: string;
  language: Language;
  environment?: Environment;
  socialLevel?: SocialLevel;
}

export const generateYoloChallenge = async (options: GenerateOptions): Promise<Challenge & { usage?: { count: number; limit: number; remaining: number } }> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('LOGIN_REQUIRED');
  }

  const response = await fetch(`${API_BASE_URL}/api/generate-challenge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      mood: options.mood,
      language: options.language,
      environment: options.environment !== 'any' ? options.environment : undefined,
      socialLevel: options.socialLevel !== 'any' ? options.socialLevel : undefined,
    }),
  });

  if (response.status === 401) throw new Error('LOGIN_REQUIRED');
  if (response.status === 429) {
    const data = await response.json();
    throw new Error(data.error || 'LIMIT_REACHED');
  }
  if (!response.ok) throw new Error(`API error: ${response.status}`);

  return await response.json();
};
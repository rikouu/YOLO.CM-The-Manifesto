import { Challenge, Language, Environment, SocialLevel } from '../types';

// API 基础地址 - 开发环境通过 Vite 代理，生产环境配置实际后端地址
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Fallback 数据
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

export const generateYoloChallenge = async (options: GenerateOptions): Promise<Challenge> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-challenge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mood: options.mood,
        language: options.language,
        environment: options.environment !== 'any' ? options.environment : undefined,
        socialLevel: options.socialLevel !== 'any' ? options.socialLevel : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json() as Challenge;
  } catch (error) {
    console.error("API Error:", error);
    
    // Fallback if API fails
    const fb = fallbacks[options.language];
    return {
      title: fb.title,
      description: fb.desc,
      difficulty: 40,
      category: "MENTAL",
      estimatedTime: "60 mins",
      environment: "indoor",
      socialLevel: "solo"
    };
  }
};
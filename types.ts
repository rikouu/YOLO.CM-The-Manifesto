export interface Challenge {
  title: string;
  description: string;
  difficulty: number; // 1-100
  category: 'SOCIAL' | 'PHYSICAL' | 'MENTAL' | 'CHAOS';
  estimatedTime: string;
  environment?: 'indoor' | 'outdoor' | 'online';
  socialLevel?: 'solo' | 'one-on-one' | 'strangers' | 'group';
}

export type Environment = 'any' | 'indoor' | 'outdoor' | 'online';
export type SocialLevel = 'any' | 'solo' | 'one-on-one' | 'strangers' | 'group';

export enum AppMode {
  INTRO = 'INTRO',
  HOME = 'HOME',
  DARE = 'DARE',
  STATS = 'STATS',
  MANIFESTO = 'MANIFESTO',
  COIN = 'COIN',
  MERCH = 'MERCH',
  PROFILE = 'PROFILE',
  WALL = 'WALL',
}

export interface NavItem {
  id: AppMode;
  label: string;
}

export type Language = 'en' | 'zh' | 'ja';
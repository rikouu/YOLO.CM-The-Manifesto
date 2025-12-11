export interface Challenge {
  title: string;
  description: string;
  difficulty: number; // 1-100
  category: 'SOCIAL' | 'PHYSICAL' | 'MENTAL' | 'CHAOS';
  estimatedTime: string;
}

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
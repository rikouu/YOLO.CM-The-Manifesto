import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Language } from '../types';
import { translations } from '../services/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 检测浏览器语言并返回支持的语言
const detectBrowserLanguage = (): Language => {
  // 优先从 localStorage 读取用户之前的选择
  const saved = localStorage.getItem('yolo-language');
  if (saved && ['en', 'zh', 'ja'].includes(saved)) {
    return saved as Language;
  }
  
  // 获取浏览器语言
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  const langCode = browserLang.toLowerCase().split('-')[0]; // 'zh-CN' -> 'zh'
  
  // 映射到支持的语言
  if (langCode === 'zh') return 'zh';
  if (langCode === 'ja') return 'ja';
  return 'en'; // 默认英文
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(detectBrowserLanguage);
  
  // 包装 setLanguage 以同时保存到 localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('yolo-language', lang);
  };

  const value = {
    language,
    setLanguage,
    t: translations[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
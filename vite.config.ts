import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: parseInt(env.VITE_DEV_PORT || '3001'),
      host: '0.0.0.0',
      // 开发环境代理 API 请求到后端
      // 只有当 VITE_API_URL 为空时才启用代理（本地开发模式）
      proxy: !env.VITE_API_URL ? {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:4002',
          changeOrigin: true,
        },
        '/uploads': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:4002',
          changeOrigin: true,
        }
      } : undefined
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});

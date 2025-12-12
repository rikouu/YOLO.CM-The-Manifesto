import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3001,
    host: '0.0.0.0',
    // 开发环境代理 API 请求到后端
    proxy: {
      '/api': {
        //target: 'https://yolo.cm',
        target: 'http://localhost:4002',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});

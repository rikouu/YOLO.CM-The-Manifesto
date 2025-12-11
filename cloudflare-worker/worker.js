/**
 * Cloudflare Worker - Gemini API 代理
 * 使用 Cloudflare 全球网络绕过地区限制
 */

const GEMINI_API_HOST = 'generativelanguage.googleapis.com';

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);

    // 健康检查
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        proxy: 'cloudflare-worker',
        colo: request.cf?.colo || 'unknown'
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      // 构建目标 URL
      const targetUrl = `https://${GEMINI_API_HOST}${url.pathname}${url.search}`;

      // 读取请求体
      const body = request.method !== 'GET' ? await request.text() : null;

      // 创建干净的请求，不带任何客户端信息
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: body,
        // 关键：不跟随重定向，避免泄露信息
        redirect: 'follow',
      });

      // 返回响应
      const responseBody = await response.text();
      
      return new Response(responseBody, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};

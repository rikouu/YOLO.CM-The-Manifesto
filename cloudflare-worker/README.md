# Gemini API Cloudflare Worker 代理

## 部署步骤

### 1. 安装 Wrangler CLI
```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare
```bash
wrangler login
```

### 3. 部署 Worker
```bash
cd cloudflare-worker
wrangler deploy
```

部署成功后会得到一个 URL，类似：
`https://gemini-proxy.你的用户名.workers.dev`

### 4. 配置后端使用代理

在 `server/.env.local` 中添加：
```
GEMINI_PROXY_URL=https://gemini-proxy.你的用户名.workers.dev
```

## 测试代理

```bash
curl https://gemini-proxy.xxx.workers.dev/health
```

## 免费额度

Cloudflare Workers 免费版：
- 每天 100,000 次请求
- 足够个人项目使用

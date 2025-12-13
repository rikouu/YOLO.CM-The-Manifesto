# YOLO.CM - The Manifesto

> **DIE WITH MEMORIES, NOT DREAMS.**

一个赛博朋克风格的 YOLO 挑战平台，鼓励用户突破舒适区，创造难忘回忆。

## ✨ 功能特性

- 🎲 **AI 挑战生成** - 基于 Gemini AI 生成个性化挑战
- 🪙 **YOLO 硬币** - 按住蓄力投掷硬币决定命运
- 👤 **用户系统** - 注册登录、个人资料、挑战记录
- ❤️ **心心系统** - 签到获得、点赞消耗、完成挑战奖励
- 🏆 **挑战墙** - 展示所有用户完成的挑战（小红书风格）
- 💬 **互动功能** - 点赞、评论、emoji 表情
- 👥 **社交系统** - 关注/粉丝、用户主页、社交网络
- 🌍 **多语言** - 支持中文、英文、日文

## 🛠️ 技术栈

**前端:**
- React 18 + TypeScript
- Vite
- TailwindCSS
- Lucide Icons
- React Portal（弹窗）

**后端:**
- Node.js + Express
- JSON 文件存储（无需数据库）
- JWT 认证
- Multer 文件上传

**AI:**
- Google Gemini API
- 美国代理服务器（绕过中国地区限制）

---

## 📦 项目结构

```
yolo.cm/
├── components/          # React 组件
│   ├── DareGenerator.tsx   # 挑战生成器
│   ├── ChallengeWall.tsx   # 挑战墙（瀑布流）
│   ├── ChallengeModal.tsx  # 挑战详情弹窗（小红书风格）
│   ├── Profile.tsx         # 用户资料（含关注/粉丝）
│   ├── UserProfileModal.tsx # 他人主页弹窗
│   ├── YoloCoin.tsx        # 硬币投掷
│   └── ...
├── contexts/            # React Context
├── services/            # API 服务
├── server/              # 后端服务
│   ├── index.ts            # Express 入口
│   ├── db.ts               # JSON 数据存储
│   └── data/               # 数据文件目录
│       ├── users.json
│       ├── challenges.json
│       ├── comments.json
│       ├── likes.json
│       ├── checkins.json
│       └── follows.json    # 关注关系
├── gemini-proxy-server/ # Gemini API 代理
└── cloudflare-worker/   # Cloudflare Worker 代理
```


---

## 🚀 本地开发

### 1. 安装依赖

```bash
# 前端
npm install

# 后端
cd server
npm install
```

### 2. 配置环境变量

**前端 `.env.local`:**
```env
# API 地址配置
# 本地开发: 留空，使用 Vite proxy 代理到 VITE_PROXY_TARGET
# 生产环境: 设置为实际后端地址，如 https://yolo.cm
VITE_API_URL=

# 代理目标（仅本地开发时使用）
VITE_PROXY_TARGET=http://localhost:4002

# 静态资源地址（本地开发时指向生产服务器获取图片）
VITE_ASSET_URL=https://yolo.cm
```

**后端 `server/.env.local`:**
```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_PROXY_URL=http://your-proxy-server:8787
PORT=4002
JWT_SECRET=your_random_secret_key
```

生成 JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. 启动开发服务器

```bash
# 终端 1 - 前端（端口 3001）
npm run dev

# 终端 2 - 后端（端口 4002）
cd server
npm start
```

### 4. Vite 代理配置说明

`vite.config.ts` 使用智能代理配置：

- **本地开发**（`VITE_API_URL` 为空）：启用 proxy，请求代理到 `VITE_PROXY_TARGET`
- **生产环境**（`VITE_API_URL` 有值）：禁用 proxy，直接请求指定 URL

```typescript
proxy: !env.VITE_API_URL ? {
  '/api': { target: env.VITE_PROXY_TARGET || 'http://localhost:4002' },
  '/uploads': { target: env.VITE_PROXY_TARGET || 'http://localhost:4002' }
} : undefined
```

---

## 🌐 生产部署

### 方式一：传统服务器部署

#### 1. 构建前端

```bash
npm run build
```

生成的文件在 `dist/` 目录。

#### 2. 部署后端

```bash
cd server
npm install
npm run build
```

#### 3. 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动后端
cd server
pm2 start dist/index.js --name yolo-api

# 查看状态
pm2 status

# 查看日志
pm2 logs yolo-api
```

#### 4. Nginx 配置

```nginx
server {
    listen 80;
    server_name yolo.cm;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yolo.cm;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 前端静态文件
    root /var/www/yolo.cm/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:4002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 上传文件静态服务
    location /uploads {
        alias /var/www/yolo.cm/server/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```


### 方式二：Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# 复制后端
COPY server/package*.json ./
RUN npm install --production

COPY server/dist ./
COPY server/.env.local ./

# 创建数据目录
RUN mkdir -p data uploads

EXPOSE 4002

CMD ["node", "index.js"]
```

```bash
docker build -t yolo-api .
docker run -d -p 4002:4002 -v ./data:/app/data -v ./uploads:/app/uploads yolo-api
```

### 方式三：Vercel 部署（仅前端）

1. 连接 GitHub 仓库到 Vercel
2. 设置环境变量：
   - `VITE_API_URL=https://your-api-server.com`
3. 部署

---

## 🔧 Gemini API 代理配置

由于 Gemini API 在某些地区不可用，需要配置代理服务器。

### 方式一：Node.js 代理（推荐）

在美国 VPS 上部署 `gemini-proxy-server/index.js`:

```bash
# 安装依赖
npm install express cors

# 使用 PM2 运行
pm2 start index.js --name gemini-proxy
```

### 方式二：Cloudflare Worker

1. 登录 Cloudflare Dashboard
2. 创建 Worker
3. 粘贴 `cloudflare-worker/worker.js` 代码
4. 部署

然后在后端 `.env.local` 中配置：
```env
GEMINI_PROXY_URL=https://your-worker.workers.dev
```

---

## ❤️ 心心系统说明

| 操作 | 心心变化 |
|------|---------|
| 新用户注册 | +5 |
| 每日签到 | +5 |
| 完成挑战 | +10 |
| 给别人点赞 | -1 |
| 被别人点赞 | +1 |
| 取消点赞 | 返还 |
| 删除挑战 | 扣除该挑战获得的所有心心 |

---

## 👥 社交系统说明

### 关注功能
- 点击用户头像/名称可查看用户主页
- 支持关注/取消关注
- 个人资料页显示关注数和粉丝数
- 可在 Profile 页面的标签页中查看关注列表和粉丝列表

### API 端点
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/users/:id/follow` | POST | 关注/取消关注用户 |
| `/api/users/following` | GET | 获取我关注的用户列表 |
| `/api/users/followers` | GET | 获取关注我的用户列表 |
| `/api/users/:id/profile` | GET | 获取用户公开资料 |
| `/api/users/:id/challenges` | GET | 获取用户已完成挑战 |

---

## ❓ 常见问题

### Q: Gemini API 报错 `ECONNREFUSED`
**A:** 代理服务器未运行或地址配置错误。检查：
1. 代理服务器是否在运行：`pm2 status`
2. `.env.local` 中 `GEMINI_PROXY_URL` 是否正确
3. 防火墙是否开放端口

### Q: 图片上传后显示 404
**A:** Nginx 未配置 `/uploads` 静态文件服务。添加：
```nginx
location /uploads {
    alias /path/to/server/uploads;
}
```

### Q: 本地开发图片不显示
**A:** 本地开发时图片在生产服务器上。确保 `.env.local` 中配置：
```env
VITE_ASSET_URL=https://yolo.cm
```

### Q: TypeScript 编译报错 `better-sqlite3`
**A:** 项目已改用 JSON 文件存储，无需 SQLite。如果仍有问题：
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

### Q: JWT 认证失败
**A:** 检查 `server/.env.local` 中是否配置了 `JWT_SECRET`。

### Q: 后端启动报错 `Cannot find module`
**A:** 需要先编译 TypeScript：
```bash
cd server
npm run build
node dist/index.js
```

或使用开发模式：
```bash
npm start  # 使用 tsx 直接运行
```

### Q: 跨域错误 (CORS)
**A:**
- 本地开发：使用 Vite 代理，不要直接调用生产 API
- 生产环境：后端已配置 `cors()` 中间件

---

## 📝 开发注意事项

1. **不要提交敏感信息** - `.env.local` 已在 `.gitignore` 中
2. **数据备份** - 定期备份 `server/data/` 目录
3. **图片存储** - 生产环境建议使用 CDN 或对象存储
4. **API 限流** - 生产环境建议添加请求限流

---

## 📄 License

MIT

---

**YOLO - You Only Live Once. Make it count.**

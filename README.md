# YOLO.CM — The Manifesto

生命太短，别后悔。YOLO 挑战生成器。

## 功能

- 🎲 AI生成挑战 — Gemini驱动，每日24次免费额度（登录用户）
- 👤 用户系统 — 注册/登录/个人资料
- 🏆 挑战社区 — 接受、完成、晒照片
- ❤️ 互动 — 点赞、评论、关注
- 🔑 管理员 — 管理用户限额、权限

## 快速开始（Docker）

```bash
git clone https://github.com/rikouu/YOLO.CM-The-Manifesto.git
cd YOLO.CM-The-Manifesto

# 配置后端
cp server/env.example server/.env
# 编辑 server/.env，填入 GEMINI_API_KEY 和 JWT_SECRET

# 启动
docker compose up -d

# 访问 http://localhost:8910
```

## 环境变量（server/.env）

| 变量 | 说明 |
|------|------|
| `GEMINI_API_KEY` | Google AI Studio API Key（必填）|
| `JWT_SECRET` | JWT签名密钥（必须修改）|
| `FRONTEND_URL` | 允许的前端域名 |
| `PORT` | 后端端口（默认3001，容器内部）|
| `TZ` | 时区（默认Asia/Tokyo）|

## 管理员 API

```bash
# 列出所有用户
GET /api/admin/users   (需要 admin token)

# 设置用户每日AI生成限额
PUT /api/admin/users/:id/ai-limit
{"limit": 50}   # 数字或 null（恢复默认24次）

# 设置管理员权限
PUT /api/admin/users/:id/admin
{"is_admin": true}
```

设置第一个管理员：直接编辑 `server/data/users.json`，给自己的账号加 `"is_admin": true`。

## AI使用量

- 默认每用户每日24次
- 管理员可按用户调整
- `GET /api/ai/usage` — 查看当日使用情况

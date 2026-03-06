# 🐱🐶 猫狗杀 - 后端服务

多人联机社交推理游戏后端，基于 Node.js + TypeScript + Socket.IO

## 🚀 快速开始

### 环境要求

- Node.js 18+
- MongoDB 6+
- Redis 7+

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等
```

### 开发模式运行

```bash
npm run dev
```

### 生产模式运行

```bash
npm run build
npm start
```

## 📡 API 接口

### 认证接口

#### 注册
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "player1",
  "email": "player1@example.com",
  "password": "password123"
}
```

#### 登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "player1@example.com",
  "password": "password123"
}
```

#### 获取用户信息
```
GET /api/auth/me
Authorization: Bearer <token>
```

#### 更新游戏统计
```
POST /api/auth/update-stats
Authorization: Bearer <token>
Content-Type: application/json

{
  "won": true
}
```

### 游戏接口

#### 获取房间列表
```
GET /api/game/rooms
```

#### 获取房间详情
```
GET /api/game/rooms/:code
```

#### 获取排行榜
```
GET /api/game/leaderboard
```

## 🔌 Socket.IO 事件

### 客户端 → 服务器

| 事件 | 参数 | 描述 |
|------|------|------|
| `create_room` | `{ userId, username, settings }` | 创建房间 |
| `join_room` | `{ roomCode, userId, username }` | 加入房间 |
| `leave_room` | - | 离开房间 |
| `start_game` | - | 开始游戏 (仅房主) |
| `move_player` | `{ x, y }` | 移动玩家 |
| `complete_task` | `{ taskId }` | 完成任务 |
| `emergency_meeting` | - | 发起紧急会议 |
| `cast_vote` | `{ targetId }` | 投票 |
| `chat_message` | `{ message }` | 发送消息 |
| `sabotage` | `{ type }` | 破坏 (仅狗狗) |

### 服务器 → 客户端

| 事件 | 参数 | 描述 |
|------|------|------|
| `room_created` | `{ roomCode, gameId }` | 房间创建成功 |
| `room_joined` | `{ game, player }` | 加入房间成功 |
| `player_joined` | `{ player }` | 有新玩家加入 |
| `player_left` | `{ playerId }` | 有玩家离开 |
| `game_started` | `{ role, players }` | 游戏开始 (含角色) |
| `game_state_update` | `{ game }` | 游戏状态更新 |
| `meeting_started` | `{ deadPlayer }` | 会议开始 |
| `voting_result` | `{ ejectedPlayer, skipped }` | 投票结果 |
| `game_ended` | `{ winner }` | 游戏结束 |
| `error` | `{ message }` | 错误信息 |

## 🎮 游戏流程

1. **创建/加入房间** - 玩家通过房间码加入
2. **等待玩家** - 房主等待足够玩家加入
3. **开始游戏** - 房主点击开始，分配角色
4. **游戏阶段** - 猫咪完成任务，狗狗搞破坏
5. **紧急会议** - 发现可疑行为时发起
6. **投票淘汰** - 玩家投票决定淘汰谁
7. **游戏结束** - 一方达成胜利条件

## 🏗️ 项目结构

```
backend/
├── src/
│   ├── index.ts              # 入口文件
│   ├── types/
│   │   └── game.ts           # 游戏类型定义
│   ├── models/
│   │   └── User.ts           # 用户模型
│   ├── routes/
│   │   ├── auth.ts           # 认证路由
│   │   └── game.ts           # 游戏路由
│   ├── services/
│   │   └── gameService.ts    # 游戏逻辑服务
│   └── sockets/
│       └── gameSocket.ts     # Socket.IO 处理器
├── package.json
├── tsconfig.json
└── .env.example
```

## 📝 角色说明

### 🐱 猫咪 (好人)
- 目标：完成所有任务或找出所有狗狗
- 能力：完成任务、发起紧急会议、投票

### 🐶 狗狗 (坏人)
- 目标：淘汰足够多的猫咪
- 能力：破坏设施、假装完成任务

### 🦊 狐狸 (中立)
- 目标：存活到最后
- 特殊胜利条件

## ⚙️ 配置说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务器端口 | 3000 |
| `MONGODB_URI` | MongoDB 连接字符串 | mongodb://localhost:27017/cat-dog-kill |
| `REDIS_HOST` | Redis 主机 | localhost |
| `REDIS_PORT` | Redis 端口 | 6379 |
| `JWT_SECRET` | JWT 密钥 | (需自定义) |
| `MIN_PLAYERS` | 最少玩家数 | 4 |
| `MAX_PLAYERS` | 最多玩家数 | 10 |

## 🐳 Docker 部署

```bash
# 构建镜像
docker build -t cat-dog-kill-server .

# 运行容器
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --network cat-dog-kill-network \
  cat-dog-kill-server
```

## 📊 性能优化

- 使用 Redis 缓存房间状态
- Socket.IO 房间隔离玩家通信
- 游戏状态增量更新
- 心跳检测断线重连

## 🔒 安全考虑

- JWT 认证保护 API
- 输入验证防止注入
- 速率限制防止滥用
- CORS 配置限制来源

## 📝 开发待办

- [ ] 添加单元测试
- [ ] 集成 MongoDB 持久化
- [ ] 实现好友系统
- [ ] 添加语音聊天支持
- [ ] 实现观战模式
- [ ] 添加反作弊机制

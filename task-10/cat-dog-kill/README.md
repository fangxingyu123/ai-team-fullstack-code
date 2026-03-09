# 🐱🐶 猫狗杀 - Cat Dog Kill

一款多人联机社交推理游戏，类似"鹅鸭杀"。玩家扮演猫咪或狗狗，在地图中完成任务或搞破坏。

![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Node.js-blue)
![Swift](https://img.shields.io/badge/Swift-5.9-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📱 游戏截图

（待添加）

---

## 🎮 核心玩法

### 角色系统 (5 种角色)

| 角色 | 阵营 | 目标 | 特殊能力 |
|------|------|------|----------|
| 🐱 猫咪 | 好人 | 完成所有任务或找出所有狗狗 | 无（基础角色） |
| 🐶 狗狗 | 坏人 | 淘汰足够多的猫咪 | 破坏设施 |
| 🦊 狐狸 | 中立 | 存活到最后 | 单独胜利条件 |
| 🕵️ 侦探 | 好人 | 与好人阵营共同胜利 | 调查身份（每局 3 次） |
| 🎯 猎人 | 好人 | 与好人阵营共同胜利 | 死亡反击（每局 1 次） |

📖 详细角色说明请查看 [docs/ROLES.md](docs/ROLES.md)

### 游戏流程

```
1. 大厅 → 2. 创建/加入房间 → 3. 角色分配 → 4. 游戏阶段
                                              ↓
    胜利判定 ← 投票淘汰 ← 紧急会议 ← 移动/任务/破坏
```

### 胜利条件

- **猫咪胜利**: 完成所有任务 OR 找出所有狗狗
- **狗狗胜利**: 淘汰足够多的猫咪（狗狗数量 ≥ 猫咪数量）
- **狐狸胜利**: 存活到最后（场上只剩狐狸）

---

## 🛠️ 技术架构

### 前端 (iOS)

```
ios/CatDogKill/
├── CatDogKillApp.swift      # App 入口
├── Models/
│   └── GameStateManager.swift  # 游戏状态管理
├── Network/
│   ├── SocketManager.swift     # Socket.IO 连接
│   └── AuthManager.swift       # 用户认证
└── Views/
    ├── ContentView.swift       # 主界面
    ├── AuthView.swift          # 登录注册
    ├── GameView.swift          # 游戏界面
    └── ...
```

**技术栈**:
- Swift 5.9+
- SwiftUI
- Starscream (WebSocket)
- Combine

### 后端

```
backend/
├── src/
│   ├── index.ts              # 服务器入口
│   ├── types/game.ts         # 类型定义
│   ├── models/User.ts        # 用户模型
│   ├── routes/
│   │   ├── auth.ts           # 认证路由
│   │   └── game.ts           # 游戏路由
│   ├── services/
│   │   └── gameService.ts    # 游戏逻辑
│   └── sockets/
│       └── gameSocket.ts     # Socket.IO 处理
└── package.json
```

**技术栈**:
- Node.js 18+
- TypeScript
- Express
- Socket.IO
- MongoDB (用户数据)
- Redis (房间状态)

---

## 🚀 快速开始

### 后端服务

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 配置数据库连接

# 启动 MongoDB 和 Redis
# MongoDB: mongod
# Redis: redis-server

# 开发模式运行
npm run dev

# 生产模式
npm run build
npm start
```

### iOS 客户端

```bash
cd ios

# 打开 Xcode 项目
open CatDogKill/CatDogKill.xcodeproj

# 或使用 CocoaPods (如果需要)
cd CatDogKill
pod install
open CatDogKill.xcworkspace

# 在 Xcode 中运行
# 需要 iOS 16+ 模拟器或真机
```

---

## 📡 API 文档

### REST API

#### 认证

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/auth/me` | 获取当前用户 |
| POST | `/api/auth/update-stats` | 更新游戏统计 |

#### 游戏

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/game/rooms` | 获取房间列表 |
| GET | `/api/game/rooms/:code` | 获取房间详情 |
| GET | `/api/game/leaderboard` | 获取排行榜 |

### Socket.IO 事件

#### 客户端 → 服务器

```typescript
// 房间管理
create_room: { userId, username, settings }
join_room: { roomCode, userId, username }
leave_room: {}
start_game: {}

// 游戏操作
move_player: { x, y }
complete_task: { taskId }
emergency_meeting: {}
cast_vote: { targetId }
chat_message: { message }
sabotage: { type }

// 角色技能（Phase 2 新增）
investigate: { targetId }           // 侦探调查
hunter_eliminate: { targetId }      // 猎人消除
```

#### 服务器 → 客户端

```typescript
room_created: { roomCode, gameId }
room_joined: { game, player }
player_joined: { player }
player_left: { playerId }
game_started: { role, players }
game_state_update: { game }
meeting_started: { deadPlayer }
voting_result: { ejectedPlayer, skipped }
game_ended: { winner }
error: { message }

// 角色技能（Phase 2 新增）
investigation_result: { targetPlayerId, targetRole, targetTeam }
hunter_elimination: { hunterId, targetId }
```

---

## 📦 功能模块

### MVP (第一阶段) ✅

- [x] 用户注册/登录
- [x] 创建/加入房间
- [x] 4 人基础对战
- [x] 猫咪/狗狗基础角色
- [ ] 简单地图（1 张）
- [x] 基础任务系统
- [x] 紧急会议 + 投票
- [x] 游戏结算

### 第二阶段 🚧

- [x] 更多角色（狐狸、侦探、猎人）✅
- [ ] 更多地图（3-5 张）
- [ ] 语音聊天
- [ ] 好友系统
- [ ] 排行榜
- [ ] 成就系统

### 第三阶段 📋

- [ ] 自定义房间（密码、规则）
- [ ] 观战模式
- [ ] 回放系统
- [ ] 皮肤/装扮系统
- [ ] 赛季系统

---

## 🎨 UI 设计

### 配色方案

| 用途 | 颜色 | Hex |
|------|------|-----|
| 主色调 | 蓝色 | `#007AFF` |
| 猫咪 | 蓝色 | `#34C759` |
| 狗狗 | 红色 | `#FF3B30` |
| 狐狸 | 紫色 | `#AF52DE` |
| 背景 | 深色 | `#1C1C1E` |

### 界面结构

```
┌─────────────────────────────────┐
│  首页     房间     我的          │  ← Tab 导航
├─────────────────────────────────┤
│                                 │
│         🐱🐶                     │
│        猫狗杀                    │
│    多人联机社交推理游戏           │
│                                 │
│    ┌─────────────────┐          │
│    │   创建房间       │          │  ← 主要操作
│    └─────────────────┘          │
│    ┌─────────────────┐          │
│    │   加入房间       │          │
│    └─────────────────┘          │
│    ┌─────────────────┐          │
│    │   快速匹配       │          │
│    └─────────────────┘          │
│                                 │
│  ● 已连接                        │  ← 状态栏
└─────────────────────────────────┘
```

---

## 🐳 Docker 部署

### 构建镜像

```bash
# 后端
cd backend
docker build -t cat-dog-kill-server .

# Redis
docker pull redis:7

# MongoDB
docker pull mongo:6
```

### Docker Compose

```yaml
version: '3.8'
services:
  server:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/cat-dog-kill
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:6
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:7
    volumes:
      - redis-data:/data

volumes:
  mongo-data:
  redis-data:
```

---

## 📊 性能优化

- **Redis 缓存**: 房间状态实时缓存
- **Socket.IO 房间**: 隔离玩家通信
- **状态增量更新**: 只发送变化的数据
- **心跳检测**: 断线重连机制
- **CDN 加速**: 静态资源分发

---

## 🔒 安全考虑

- JWT 认证保护 API
- 输入验证防止注入攻击
- 速率限制防止滥用
- CORS 配置限制来源
- 密码 bcrypt 加密存储
- WebSocket 连接验证

---

## 📝 开发待办

### 后端
- [ ] 添加单元测试
- [ ] 集成 MongoDB 持久化
- [ ] 实现反作弊机制
- [ ] 添加日志系统
- [ ] 实现匹配系统

### 前端
- [ ] 完善游戏动画
- [ ] 添加音效
- [ ] 优化虚拟摇杆
- [ ] 适配 iPad
- [ ] 添加本地化

### 基础设施
- [ ] CI/CD 配置
- [ ] 监控告警
- [ ] 性能分析
- [ ] 压力测试

---

## 📱 系统要求

### iOS 客户端
- iOS 16.0+
- iPhone / iPad
- 网络连接

### 后端服务
- Node.js 18+
- MongoDB 6+
- Redis 7+
- 推荐 2GB+ 内存

---

## 📄 许可证

MIT License

---

## 👥 团队

- 开发：qianwen-worker
- 创建时间：2026-03-06

---

## 📞 联系方式

- GitHub Issues: 提交问题和建议
- Discord: 社区讨论

---

## 🙏 致谢

参考游戏：
- 鹅鸭杀 (Goose Goose Duck)
- Among Us
- 太空狼人杀

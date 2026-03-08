# 🚀 猫狗杀 - 快速开始指南

## 环境准备

### 必需软件

| 软件 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 后端运行 |
| MongoDB | 6+ | 用户数据存储 |
| Redis | 7+ | 房间状态缓存 |
| Xcode | 15+ | iOS 开发 |
| Docker | 24+ | 容器化部署 (可选) |

### 可选软件

| 软件 | 用途 |
|------|------|
| MongoDB Compass | MongoDB 图形化管理 |
| Redis Insight | Redis 图形化管理 |
| Postman | API 测试 |

---

## 方式一：Docker 快速启动 (推荐)

### 1. 启动服务

```bash
cd /home/node/.openclaw/workspace/cat-dog-kill
docker-compose up -d
```

### 2. 查看日志

```bash
docker-compose logs -f server
```

### 3. 停止服务

```bash
docker-compose down
```

### 4. 重置数据

```bash
docker-compose down -v
```

---

## 方式二：本地开发环境

### 1. 启动 MongoDB

```bash
# macOS (Homebrew)
brew services start mongodb-community@6.0

# Linux (Systemd)
sudo systemctl start mongod

# Docker
docker run -d -p 27017:27017 --name mongo mongo:6
```

### 2. 启动 Redis

```bash
# macOS (Homebrew)
brew services start redis

# Linux (Systemd)
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 --name redis redis:7
```

### 3. 安装后端依赖

```bash
cd backend
npm install
```

### 4. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接
```

### 5. 启动后端服务

```bash
# 开发模式 (支持热重载)
npm run dev

# 生产模式
npm run build
npm start
```

### 6. 验证服务

```bash
curl http://localhost:3000/health
# 返回：{"status":"ok","timestamp":"..."}
```

---

## iOS 客户端开发

### 1. 打开项目

```bash
cd ios
open CatDogKill/CatDogKill.xcodeproj
```

或使用 Swift Package Manager:

```bash
cd ios/CatDogKill
swift build
```

### 2. 配置开发环境

- 在 Xcode 中选择目标设备 (模拟器或真机)
- 修改 `SocketManager.swift` 中的服务器地址:
  ```swift
  init(serverURL: String = "ws://localhost:3000")
  ```
  真机测试时改为电脑 IP 地址

### 3. 运行应用

- 点击 Xcode 的运行按钮 (▶️)
- 或使用快捷键 `Cmd + R`

---

## API 测试

### 使用 curl 测试

```bash
# 用户注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# 用户登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 健康检查
curl http://localhost:3000/health
```

### 使用 Postman

导入以下集合进行测试:

1. 创建新集合 "猫狗杀 API"
2. 添加请求 (参考 docs/API.md)
3. 设置环境变量 `base_url = http://localhost:3000`

---

## 常见问题

### Q: MongoDB 连接失败

```bash
# 检查 MongoDB 是否运行
mongod --version

# 查看 MongoDB 日志
tail -f /var/log/mongodb/mongod.log
```

### Q: Redis 连接失败

```bash
# 检查 Redis 是否运行
redis-cli ping
# 应返回：PONG

# 重启 Redis
brew services restart redis
```

### Q: 端口被占用

```bash
# 查看端口占用
lsof -i :3000
lsof -i :27017
lsof -i :6379

# 杀死占用端口的进程
kill -9 <PID>
```

### Q: npm install 失败

```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

### Q: iOS 模拟器无法连接本地服务器

修改 `SocketManager.swift`:

```swift
// 模拟器使用 localhost
init(serverURL: String = "ws://localhost:3000")

// 真机使用电脑 IP
init(serverURL: String = "ws://192.168.1.100:3000")
```

---

## 开发工具推荐

### 后端

| 工具 | 用途 |
|------|------|
| VS Code | 代码编辑 |
| MongoDB Compass | 数据库管理 |
| Redis Insight | Redis 管理 |
| Postman | API 测试 |
| wscat | WebSocket 测试 |

### 前端

| 工具 | 用途 |
|------|------|
| Xcode | iOS 开发 |
| Instruments | 性能分析 |
| Simulator | iOS 模拟 |

---

## 下一步

1. ✅ 完成环境搭建
2. 🔄 启动后端服务
3. 🔄 启动 iOS 客户端
4. ⏳ 进行功能测试
5. ⏳ 提交反馈和问题

---

**文档版本**: 1.0  
**最后更新**: 2026-03-08

# 📡 API 接口文档

## 基础信息

- **基础 URL**: `http://localhost:3000`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

---

## 认证接口

### 1. 用户注册

**请求**:
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "player1",
  "email": "player1@example.com",
  "password": "password123"
}
```

**响应 (201)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65e8a1b2c3d4e5f6g7h8i9j0",
    "username": "player1",
    "email": "player1@example.com",
    "avatar": "",
    "level": 1,
    "wins": 0,
    "losses": 0,
    "gamesPlayed": 0
  }
}
```

**错误响应**:
```json
{
  "message": "User already exists"
}
```

---

### 2. 用户登录

**请求**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "player1@example.com",
  "password": "password123"
}
```

**响应 (200)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65e8a1b2c3d4e5f6g7h8i9j0",
    "username": "player1",
    "email": "player1@example.com",
    "avatar": "",
    "level": 1,
    "wins": 0,
    "losses": 0,
    "gamesPlayed": 0
  }
}
```

---

### 3. 获取当前用户

**请求**:
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**响应 (200)**:
```json
{
  "id": "65e8a1b2c3d4e5f6g7h8i9j0",
  "username": "player1",
  "email": "player1@example.com",
  "avatar": "",
  "level": 5,
  "wins": 12,
  "losses": 8,
  "gamesPlayed": 20,
  "createdAt": "2026-03-06T00:00:00.000Z"
}
```

---

### 4. 更新游戏统计

**请求**:
```http
POST /api/auth/update-stats
Authorization: Bearer <token>
Content-Type: application/json

{
  "won": true
}
```

**响应 (200)**:
```json
{
  "level": 5,
  "wins": 13,
  "losses": 8,
  "gamesPlayed": 21
}
```

---

## 游戏接口

### 5. 获取房间列表

**请求**:
```http
GET /api/game/rooms
```

**响应 (200)**:
```json
{
  "rooms": [
    {
      "code": "ABC123",
      "playerCount": 3,
      "maxPlayers": 4,
      "isPlaying": false
    }
  ]
}
```

---

### 6. 获取房间详情

**请求**:
```http
GET /api/game/rooms/:code
```

**响应 (200)**:
```json
{
  "room": {
    "code": "ABC123",
    "playerCount": 3,
    "maxPlayers": 10,
    "isPlaying": false,
    "host": "player1",
    "settings": {
      "playerCount": 4,
      "dogCount": 1,
      "foxCount": 0
    }
  }
}
```

---

### 7. 获取排行榜

**请求**:
```http
GET /api/game/leaderboard
```

**响应 (200)**:
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "username": "ProPlayer",
      "wins": 150,
      "winRate": 0.75
    },
    {
      "rank": 2,
      "username": "GameMaster",
      "wins": 120,
      "winRate": 0.70
    }
  ]
}
```

---

## Socket.IO 事件

### 连接

```javascript
const socket = io('ws://localhost:3000');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

---

### 客户端 → 服务器事件

#### 创建房间
```javascript
socket.emit('create_room', {
  userId: 'user123',
  username: 'player1',
  settings: {
    playerCount: 4,
    dogCount: 1,
    foxCount: 0,
    taskCount: 10,
    votingTime: 30000,
    discussionTime: 60000
  }
});
```

#### 加入房间
```javascript
socket.emit('join_room', {
  roomCode: 'ABC123',
  userId: 'user456',
  username: 'player2'
});
```

#### 离开房间
```javascript
socket.emit('leave_room');
```

#### 开始游戏 (仅房主)
```javascript
socket.emit('start_game');
```

#### 移动玩家
```javascript
socket.emit('move_player', {
  x: 50,
  y: 50
});
```

#### 完成任务
```javascript
socket.emit('complete_task', {
  taskId: 'task-1'
});
```

#### 发起紧急会议
```javascript
socket.emit('emergency_meeting');
```

#### 投票
```javascript
socket.emit('cast_vote', {
  targetId: 'player-123' // null for skip
});
```

#### 发送聊天消息
```javascript
socket.emit('chat_message', {
  message: 'Hello everyone!'
});
```

#### 破坏 (仅狗狗)
```javascript
socket.emit('sabotage', {
  type: 'lock_doors' // lock_doors, disable_lights, disable_comms, speed_boost
});
```

---

### 服务器 → 客户端事件

#### 房间创建成功
```javascript
socket.on('room_created', (data) => {
  console.log('Room Code:', data.roomCode);
  console.log('Game ID:', data.gameId);
});
```

#### 加入房间成功
```javascript
socket.on('room_joined', (data) => {
  console.log('Game:', data.game);
  console.log('My Player:', data.player);
});
```

#### 新玩家加入
```javascript
socket.on('player_joined', (data) => {
  console.log('New player:', data.player);
});
```

#### 玩家离开
```javascript
socket.on('player_left', (data) => {
  console.log('Player left:', data.playerId);
});
```

#### 游戏开始
```javascript
socket.on('game_started', (data) => {
  console.log('My Role:', data.role); // cat, dog, fox
  console.log('Players:', data.players);
});
```

#### 游戏状态更新
```javascript
socket.on('game_state_update', (data) => {
  console.log('Game State:', data);
});
```

#### 会议开始
```javascript
socket.on('meeting_started', (data) => {
  console.log('Dead Player:', data.deadPlayer);
});
```

#### 投票结果
```javascript
socket.on('voting_result', (data) => {
  console.log('Ejected:', data.ejectedPlayer);
  console.log('Skipped:', data.skipped);
});
```

#### 游戏结束
```javascript
socket.on('game_ended', (data) => {
  console.log('Winner:', data.winner); // cats, dogs, fox
});
```

#### 错误
```javascript
socket.on('error', (data) => {
  console.error('Error:', data.message);
});
```

#### 聊天消息
```javascript
socket.on('chat_message', (data) => {
  console.log(`${data.username}: ${data.message}`);
});
```

---

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token 无效 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 速率限制

- 认证接口：10 次/分钟
- 游戏接口：100 次/分钟
- Socket 事件：50 次/秒

---

## 示例代码

### iOS (Swift)
```swift
// 登录
let response = await authManager.login(
  email: "player@example.com",
  password: "password123"
)

// 创建房间
gameState.createRoom(username: "Player", settings: [
  "playerCount": 4,
  "dogCount": 1
])

// 加入房间
gameState.joinRoom(roomCode: "ABC123", username: "Player")
```

### JavaScript
```javascript
// 连接 Socket
const socket = io('ws://localhost:3000');

// 创建房间
socket.emit('create_room', {
  username: 'player1',
  settings: { playerCount: 4 }
});

// 监听游戏开始
socket.on('game_started', (data) => {
  console.log('My role:', data.role);
});
```

---

**文档版本**: 1.0  
**最后更新**: 2026-03-07

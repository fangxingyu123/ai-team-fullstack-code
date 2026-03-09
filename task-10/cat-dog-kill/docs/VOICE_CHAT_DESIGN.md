# 🎙️ 语音聊天系统设计文档

## 📋 概述

为猫狗杀游戏实现实时语音聊天功能，支持游戏内语音交流，增强社交推理体验。

---

## 🎯 功能需求

### 核心功能
- ✅ 实时语音通话（低延迟 < 200ms）
- ✅ 房间语音频道（自动加入/离开）
- ✅ 语音开关（静音/取消静音）
- ✅ 音量调节
- ✅ 回声消除
- ✅ 噪音抑制
- ✅ 自动增益控制

### 游戏集成
- ✅ 游戏开始时自动加入语音
- ✅ 会议期间语音优先
- ✅ 死亡玩家语音限制（可选）
- ✅ 语音状态显示（谁在说话）

---

## 🛠️ 技术选型

### 方案对比

| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| **WebRTC (P2P)** | 低延迟、免费、开源 | NAT 穿透复杂 | ✅ 推荐 |
| WebRTC (SFU) | 扩展性好、带宽优化 | 需要媒体服务器 | 后期优化 |
| Agora | 稳定、易集成 | 收费、依赖第三方 | 备选 |
| Twilio | 稳定、文档好 | 收费较高 | 备选 |

### 最终方案：WebRTC P2P + 信令服务器

**架构**:
```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Player A   │◄───────►│  Signaling   │◄───────►│  Player B   │
│  (iOS App)  │  WebSocket│   Server    │ WebSocket│  (iOS App)  │
│             │         │  (Node.js)   │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
       │                                              │
       │            ┌─────────────────┐              │
       └───────────►│   WebRTC P2P    │◄─────────────┘
                    │   (Audio Stream)│
                    └─────────────────┘
```

---

## 📡 协议设计

### Socket.IO 语音事件

#### 客户端 → 服务器

```typescript
// 加入语音房间
join_voice_room: { roomId: string, userId: string }

// 离开语音房间
leave_voice_room: { roomId: string }

// WebRTC Offer (发起连接)
webrtc_offer: { roomId: string, targetUserId: string, offer: RTCSessionDescription }

// WebRTC Answer (回复连接)
webrtc_answer: { roomId: string, targetUserId: string, answer: RTCSessionDescription }

// ICE Candidate (网络路径)
webrtc_ice_candidate: { roomId: string, targetUserId: string, candidate: RTCIceCandidate }

// 语音状态更新
voice_status_update: { muted: boolean }
```

#### 服务器 → 客户端

```typescript
// 用户加入语音房间
user_joined_voice: { userId: string, username: string }

// 用户离开语音房间
user_left_voice: { userId: string }

// 接收 WebRTC Offer
webrtc_offer_received: { fromUserId: string, offer: RTCSessionDescription }

// 接收 WebRTC Answer
webrtc_answer_received: { fromUserId: string, answer: RTCSessionDescription }

// 接收 ICE Candidate
webrtc_ice_candidate_received: { fromUserId: string, candidate: RTCIceCandidate }

// 语音状态更新
user_voice_status: { userId: string, muted: boolean, speaking: boolean }

// 错误
voice_error: { message: string }
```

---

## 🏗️ 后端实现

### 文件结构

```
backend/src/
├── services/
│   └── voiceService.ts          # 语音房间管理
├── sockets/
│   └── voiceSocket.ts           # 语音 Socket 处理
└── types/
    └── voice.ts                 # 语音类型定义
```

### 核心逻辑

1. **信令服务器**: 转发 WebRTC 连接信息（Offer/Answer/ICE）
2. **房间管理**: 跟踪语音房间中的用户
3. **状态同步**: 广播语音状态（静音/说话）

---

## 📱 iOS 实现

### 文件结构

```
ios/CatDogKill/
├── Network/
│   └── VoiceManager.swift         # WebRTC 信令管理
├── Audio/
│   ├── VoiceChatManager.swift     # 语音聊天核心
│   └── AudioEngine.swift          # 音频引擎
├── Models/
│   └── VoiceState.swift           # 语音状态模型
└── Views/
    └── VoiceChatView.swift        # 语音 UI 组件
```

### 依赖

```swift
// WebRTC Framework (通过 Swift Package Manager)
https://github.com/webrtc-sdk/webrtc-ios

// 或使用 CocoaPods
pod 'GoogleWebRTC'
```

### 核心流程

1. **初始化**: 创建 RTCPeerConnection
2. **加入房间**: 通过 Socket.IO 加入语音频道
3. **创建 Offer**: 发起 WebRTC 连接
4. **交换 ICE**: 发现最佳网络路径
5. **建立连接**: P2P 音频流传输
6. **离开房间**: 清理连接

---

## 🔒 安全考虑

### 认证
- 语音房间加入需要游戏房间认证
- WebSocket 连接使用 JWT Token

### 加密
- WebRTC 默认使用 DTLS-SRTP 加密
- 信令通道使用 WSS (WebSocket Secure)

### 隐私
- 用户可控制麦克风权限
- 离开游戏自动离开语音
- 支持一键静音

---

## 📊 性能优化

### 带宽优化
- 使用 Opus 音频编码 (20-40 kbps)
- 静音检测（不说话时不发送）
- 自适应比特率

### 延迟优化
- 使用 TURN 服务器优化 NAT 穿透
- 选择最近的 STUN 服务器
- P2P 直连优先

### 电量优化
- 后台自动暂停语音
- 智能重连机制
- 降低采样率（16kHz 足够语音）

---

## 🧪 测试计划

### 功能测试
- [ ] 一对一语音通话
- [ ] 多人语音（4-10 人）
- [ ] 静音/取消静音
- [ ] 加入/离开语音房间
- [ ] 断线重连

### 性能测试
- [ ] 延迟测试 (< 200ms)
- [ ] 带宽测试 (< 50 kbps/人)
- [ ] CPU/内存占用
- [ ] 电量消耗

### 兼容性测试
- [ ] iOS 16+ 不同版本
- [ ] WiFi/4G/5G 网络
- [ ] 不同设备型号

---

## 🚀 部署配置

### STUN/TURN 服务器

**免费 STUN** (Google):
```
stun:stun.l.google.com:19302
stun:stun1.l.google.com:19302
```

**自建 TURN** (coturn):
```bash
# Docker 部署
docker run -p 3478:3478 -p 3478:3478/udp \
  -p 5349:5349 -p 5349:5349/udp \
  -p 49152-65535:49152-65535/udp \
  coturn/coturn
```

### 环境变量

```env
# 语音聊天配置
VOICE_ENABLED=true
STUN_SERVERS=stun:stun.l.google.com:19302
TURN_SERVER=turn:your-turn-server.com:3478
TURN_USERNAME=cat-dog-kill
TURN_PASSWORD=your-secret-password
```

---

## 📈 扩展计划

### Phase 2 (当前)
- [x] 基础语音通话
- [x] 房间语音集成
- [ ] 语音状态 UI

### Phase 3
- [ ] 3D 空间音频（距离衰减）
- [ ] 变声器（娱乐功能）
- [ ] 语音消息录制
- [ ] 语音转文字（会议记录）

---

## 🐛 故障排查

### 常见问题

**问题 1: 无法建立连接**
- 检查 STUN/TURN 服务器配置
- 确认防火墙允许 UDP 流量
- 查看 ICE 连接状态

**问题 2: 有回声**
- 启用回声消除 (AEC)
- 检查是否双重捕获音频
- 建议用户使用耳机

**问题 3: 音质差**
- 检查网络带宽
- 调整 Opus 编码比特率
- 启用噪音抑制

---

## 📚 参考资料

- [WebRTC 官方文档](https://webrtc.org/)
- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Google WebRTC iOS](https://github.com/webrtc-sdk/webrtc-ios)
- [Opus 音频编码](https://opus-codec.org/)
- [coturn TURN 服务器](https://github.com/coturn/coturn)

---

**文档版本**: 1.0  
**创建时间**: 2026-03-09  
**作者**: qianwen-worker

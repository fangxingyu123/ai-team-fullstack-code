# 🎭 角色系统文档

**版本**: 2.0  
**更新时间**: 2026-03-09  
**状态**: ✅ 已完成

---

## 📋 角色概览

猫狗杀现在支持 5 种不同的角色，分为 3 个阵营：

| 角色 | 图标 | 阵营 | 特殊能力 | 数量限制 |
|------|------|------|----------|----------|
| 🐱 猫咪 | `cat` | 好人 | 无 | 基础角色 |
| 🐶 狗狗 | `dog` | 坏人 | 破坏 | 1-3 |
| 🦊 狐狸 | `fox` | 中立 | 单独胜利 | 0-2 |
| 🕵️ 侦探 | `detective` | 好人 | 调查身份 | 0-2 |
| 🎯 猎人 | `hunter` | 好人 | 死亡反击 | 0-2 |

---

## 🎮 角色详情

### 🐱 猫咪 (Cat)

**阵营**: 好人  
**难度**: ⭐  
**特殊能力**: 无

**胜利条件**:
- 完成所有任务
- 或找出并淘汰所有狗狗

**游戏策略**:
- 积极完成任务
- 观察其他玩家行为
- 在会议中分享信息
- 保护有特殊能力的好人角色

---

### 🐶 狗狗 (Dog)

**阵营**: 坏人  
**难度**: ⭐⭐⭐  
**特殊能力**: 破坏

**胜利条件**:
- 淘汰足够多的猫咪（狗狗数量 ≥ 好人数量）

**破坏类型**:
1. `lock_doors` - 锁门（限制玩家移动）
2. `disable_lights` - 关闭灯光（降低视野）
3. `disable_comms` - 切断通讯（禁用聊天）
4. `speed_boost` - 加速（短时间内移动加速）

**游戏策略**:
- 伪装成普通猫咪
- 在关键时刻发动破坏
- 优先淘汰有特殊能力的好人
- 与其他狗狗配合（如果有多只狗狗）

---

### 🦊 狐狸 (Fox)

**阵营**: 中立  
**难度**: ⭐⭐⭐⭐⭐  
**特殊能力**: 单独胜利条件

**胜利条件**:
- 存活到只剩自己一人
- 或存活到好人阵营获胜且场上只有狐狸和好人

**游戏策略**:
- 保持低调，避免被注意
- 必要时可以假装是好人
- 在投票中保持平衡，避免任何一方过快胜利
- 利用混乱局面生存

---

### 🕵️ 侦探 (Detective)

**阵营**: 好人  
**难度**: ⭐⭐⭐  
**特殊能力**: 调查身份

**能力详情**:
- 每局游戏有 **3 次** 调查机会
- 可以调查任意存活玩家的身份
- 调查结果包括：角色、阵营
- 调查只能在游戏进行中进行（会议期间不能使用）

**胜利条件**: 与好人阵营相同

**游戏策略**:
- 谨慎使用调查机会
- 优先调查行为可疑的玩家
- 保护好自己的身份，避免被狗狗发现
- 在会议中巧妙透露调查信息

**使用方式**:
```swift
// iOS 客户端
gameStateManager.investigate(targetId: "player-123")

// 服务器返回调查结果
socketManager.onInvestigationResult { result in
    print("目标角色：\(result.targetRole)")
    print("目标阵营：\(result.targetTeam)")
}
```

---

### 🎯 猎人 (Hunter)

**阵营**: 好人  
**难度**: ⭐⭐⭐⭐  
**特殊能力**: 死亡反击

**能力详情**:
- 当猎人被淘汰时（投票或被狗狗击杀），可以带走一名玩家
- 每局游戏只能使用 **1 次**
- 可以选择任意存活玩家作为目标
- 必须在死亡后短时间内选择目标（超时则无法使用）

**胜利条件**: 与好人阵营相同

**游戏策略**:
- 不要轻易暴露猎人身份
- 死亡时优先带走确认为狗狗的玩家
- 如果无法确定，可以带走最可疑的玩家
- 有时可以故意暴露身份来威慑狗狗

**使用方式**:
```swift
// iOS 客户端 - 当猎人死亡时触发
socketManager.onPlayerDied { player in
    if player.role == .hunter && !player.hasUsedHunterAbility {
        // 显示猎人技能 UI，让玩家选择目标
        showHunterAbilityUI()
    }
}

// 玩家选择目标后
gameStateManager.hunterEliminate(targetId: "suspected-dog")
```

---

## ⚙️ 游戏配置

### 推荐配置

| 玩家数 | 猫咪 | 狗狗 | 狐狸 | 侦探 | 猎人 |
|--------|------|------|------|------|------|
| 4 | 2 | 1 | 0 | 1 | 0 |
| 5 | 2 | 1 | 0 | 1 | 1 |
| 6 | 3 | 1 | 0 | 1 | 1 |
| 7 | 3 | 2 | 0 | 1 | 1 |
| 8 | 4 | 2 | 0 | 1 | 1 |
| 9 | 4 | 2 | 1 | 1 | 1 |
| 10 | 4 | 2 | 1 | 2 | 1 |

### 自定义配置

创建房间时可以自定义角色数量：

```typescript
// 后端 API 示例
const settings = {
  playerCount: 8,
  dogCount: 2,
  foxCount: 1,
  detectiveCount: 1,
  hunterCount: 1,
  taskCount: 12,
  votingTime: 30000,
  discussionTime: 60000
};

socket.emit('create_room', {
  username: "Player1",
  settings: settings
});
```

---

## 🏆 胜利条件判定

### 好人阵营胜利（猫咪、侦探、猎人）
1. 所有狗狗被淘汰
2. 所有任务完成
3. 狐狸存活但场上只剩狐狸和好人（狐狸单独胜利优先）

### 坏人阵营胜利（狗狗）
1. 狗狗数量 ≥ 好人数量（猫咪 + 侦探 + 猎人）

### 中立阵营胜利（狐狸）
1. 存活到场上只剩自己
2. 或存活到好人胜利且场上只有狐狸和好人

### 判定优先级
1. 狐狸单独胜利条件（最高优先级）
2. 狗狗胜利条件
3. 好人胜利条件

---

## 🔌 Socket 事件

### 客户端 → 服务器

#### 调查（侦探技能）
```typescript
socket.emit('investigate', {
  targetId: 'player-123'
});
```

#### 猎人消除（猎人技能）
```typescript
socket.emit('hunter_eliminate', {
  targetId: 'player-456'
});
```

### 服务器 → 客户端

#### 调查结果
```typescript
socket.on('investigation_result', (data) => {
  console.log(`调查目标：${data.targetPlayerId}`);
  console.log(`角色：${data.targetRole}`);
  console.log(`阵营：${data.targetTeam}`);
});
```

#### 猎人消除
```typescript
socket.on('hunter_elimination', (data) => {
  console.log(`猎人 ${data.hunterId} 淘汰了 ${data.targetId}`);
});
```

---

## 📱 iOS 集成

### 角色枚举扩展

```swift
enum PlayerRole: String, Codable {
    case cat = "cat"
    case dog = "dog"
    case fox = "fox"
    case detective = "detective"
    case hunter = "hunter"
    
    var displayName: String {
        switch self {
        case .cat: return "猫咪"
        case .dog: return "狗狗"
        case .fox: return "狐狸"
        case .detective: return "侦探"
        case .hunter: return "猎人"
        }
    }
    
    var icon: String {
        switch self {
        case .cat: return "🐱"
        case .dog: return "🐶"
        case .fox: return "🦊"
        case .detective: return "🕵️"
        case .hunter: return "🎯"
        }
    }
    
    var team: PlayerTeam {
        switch self {
        case .cat, .detective, .hunter: return .good
        case .dog: return .bad
        case .fox: return .neutral
        }
    }
}
```

### 使用技能

```swift
// 侦探调查
func useDetectiveAbility(on player: Player) {
    guard let myRole = gameStateManager.myRole,
          myRole == .detective else { return }
    
    gameStateManager.investigate(targetId: player.id)
}

// 猎人消除
func useHunterAbility(on player: Player) {
    guard let myRole = gameStateManager.myRole,
          myRole == .hunter else { return }
    
    gameStateManager.hunterEliminate(targetId: player.id)
}
```

---

## 🎯 平衡性说明

### 角色强度评估

| 角色 | 强度 | 上手难度 | 推荐新手 |
|------|------|----------|----------|
| 猫咪 | ⭐⭐ | ⭐ | ✅ |
| 狗狗 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ❌ |
| 狐狸 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ |
| 侦探 | ⭐⭐⭐ | ⭐⭐ | ✅ |
| 猎人 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⚠️ |

### 平衡性调整建议

- **狗狗过强**: 减少狗狗数量或增加任务数量
- **好人过强**: 增加狗狗破坏频率或减少调查次数
- **狐狸太难**: 调整胜利条件，允许狐狸与好人共享胜利

---

## 📝 更新日志

### v2.0 (2026-03-09)
- ✅ 新增侦探角色
- ✅ 新增猎人角色
- ✅ 完善狐狸胜利条件
- ✅ 添加角色配置系统
- ✅ 添加 Socket 事件支持
- ✅ iOS 客户端集成

### v1.0 (2026-03-07)
- ✅ 基础猫咪角色
- ✅ 基础狗狗角色
- ✅ 基础破坏系统

---

## 🤔 FAQ

**Q: 侦探可以调查自己吗？**  
A: 不可以，调查目标必须是其他玩家。

**Q: 猎人被投票淘汰时可以使用技能吗？**  
A: 可以，任何死亡方式都可以触发猎人技能。

**Q: 狐狸可以和狗狗一起胜利吗？**  
A: 不可以，狐狸只能单独胜利或与好人共享胜利。

**Q: 一局游戏可以有多个侦探吗？**  
A: 可以，推荐配置最多 2 个侦探。

**Q: 猎人技能有使用时间限制吗？**  
A: 建议在实现中添加 30 秒倒计时，超时未使用则技能失效。

---

**文档维护**: qianwen-worker  
**联系方式**: 项目 Issues

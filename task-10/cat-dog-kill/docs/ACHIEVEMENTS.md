# 🏆 成就系统设计文档

## 概述

成就系统用于追踪玩家的游戏进度和里程碑，提供额外的游戏目标和成就感。

---

## 成就类别

| 类别 | 图标 | 说明 |
|------|------|------|
| 🏆 胜利 | victory | 与游戏胜利相关的成就 |
| 📋 任务 | tasks | 与任务完成相关的成就 |
| 💬 社交 | social | 与社交互动、投票相关的成就 |
| 🎭 角色 | role | 与特定角色玩法相关的成就 |
| 🔥 连胜 | streak | 与连胜/连败相关的成就 |
| 📦 收集 | collection | 与游戏场次、收集相关的成就 |
| ⭐ 特殊 | special | 特殊条件解锁的隐藏成就 |

---

## 成就难度

| 难度 | 颜色 | 点数 | 说明 |
|------|------|------|------|
| 简单 | 🟢 绿色 | 1 点 | 容易达成的基础成就 |
| 中等 | 🔵 蓝色 | 3 点 | 需要一定游戏经验的成就 |
| 困难 | 🟠 橙色 | 5 点 | 需要较高技巧或投入的成就 |
| 传奇 | 🟣 紫色 | 10 点 | 极少数玩家能达成的成就 |

---

## 成就列表

### 胜利类 (Victory)

| 图标 | 名称 | 条件 | 难度 | 点数 |
|------|------|------|------|------|
| 🎉 | 首战告捷 | 赢得第 1 场游戏 | 简单 | 1 |
| 🏆 | 十战十胜 | 累计赢得 10 场游戏 | 中等 | 3 |
| 👑 | 百战百胜 | 累计赢得 50 场游戏 | 困难 | 5 |
| 💎 | 传奇王者 | 累计赢得 100 场游戏 | 传奇 | 10 |

### 连胜类 (Streak)

| 图标 | 名称 | 条件 | 难度 | 点数 |
|------|------|------|------|------|
| 🔥 | 连胜高手 | 取得 3 连胜 | 中等 | 3 |
| ⚡ | 不败神话 | 取得 5 连胜 | 困难 | 5 |

### 任务类 (Tasks)

| 图标 | 名称 | 条件 | 难度 | 点数 |
|------|------|------|------|------|
| 🐝 | 勤劳小蜜蜂 | 累计完成 10 个任务 | 简单 | 1 |
| ⭐ | 任务达人 | 累计完成 50 个任务 | 中等 | 3 |
| 🎯 | 任务大师 | 累计完成 100 个任务 | 困难 | 5 |
| ✨ | 完美主义者 | 完美完成 10 个任务 | 中等 | 3 |

### 社交类 (Social)

| 图标 | 名称 | 条件 | 难度 | 点数 |
|------|------|------|------|------|
| 📢 | 会议达人 | 发起 10 次紧急会议 | 简单 | 1 |
| 🔍 | 名侦探 | 正确投票 20 次 | 中等 | 3 |
| 🕵️ | 神探夏洛克 | 正确投票 50 次 | 困难 | 5 |

### 角色类 (Role)

| 图标 | 名称 | 条件 | 难度 | 点数 |
|------|------|------|------|------|
| 🐱 | 忠诚猫咪 | 作为猫咪赢得 10 场胜利 | 中等 | 3 |
| 🐶 | 狡猾狗狗 | 作为狗狗赢得 10 场胜利 | 中等 | 3 |
| 🦊 | 神秘狐狸 | 作为狐狸赢得 5 场胜利 | 困难 | 5 |
| 💣 | 破坏大王 | 成功破坏 20 次 | 中等 | 3 |
| 🔎 | 真相侦探 | 成功调查 10 次 | 中等 | 3 |
| 🎯 | 复仇猎人 | 作为猎人淘汰 5 名敌人 | 困难 | 5 |
| 👻 | 不死狐狸 | 作为狐狸存活 10 次 | 困难 | 5 |

### 特殊类 (Special)

| 图标 | 名称 | 条件 | 难度 | 点数 | 隐藏 |
|------|------|------|------|------|------|
| ⏱️ | 速战速决 | 5 分钟内赢得 5 场游戏 | 困难 | 5 | 否 |
| 🔄 | 绝地翻盘 | 在劣势情况下翻盘 3 次 | 传奇 | 10 | 是 |

### 收集类 (Collection)

| 图标 | 名称 | 条件 | 难度 | 点数 |
|------|------|------|------|------|
| 🎮 | 资深玩家 | 累计进行 100 场游戏 | 困难 | 5 |

---

## API 接口

### 获取所有成就

```http
GET /api/achievements
```

**响应示例:**
```json
{
  "achievements": [...],
  "grouped": {...},
  "categories": [
    {"id": "victory", "label": "胜利", "count": 4},
    ...
  ]
}
```

### 获取我的成就进度

```http
GET /api/achievements/my
Authorization: Bearer <token>
```

**响应示例:**
```json
{
  "achievements": [...],
  "progress": [
    {
      "achievementId": "first_win",
      "unlocked": true,
      "progress": 1,
      "unlockedAt": "2026-03-09T10:00:00.000Z"
    }
  ],
  "totalPoints": 15,
  "unlockedCount": 5,
  "totalCount": 22,
  "completionRate": 23
}
```

### 获取其他用户成就

```http
GET /api/achievements/user/:userId
```

**响应示例:**
```json
{
  "userId": "xxx",
  "totalPoints": 50,
  "unlockedCount": 10,
  "totalCount": 22,
  "completionRate": 45,
  "unlockedAchievements": [
    {
      "achievementId": "first_win",
      "name": "首战告捷",
      "icon": "🎉",
      "points": 1,
      "unlockedAt": "2026-03-09T10:00:00.000Z"
    }
  ]
}
```

---

## 数据库结构

### Achievement 集合

```typescript
{
  achievementId: string;      // 唯一标识
  name: string;               // 成就名称
  description: string;        // 成就描述
  icon: string;               // 成就图标 (emoji)
  category: string;           // 类别
  difficulty: string;         // 难度
  conditionType: string;      // 条件类型
  conditionTarget: number;    // 目标值
  points: number;             // 成就点数
  isHidden: boolean;          // 是否隐藏
  createdAt: Date;
  updatedAt: Date;
}
```

### User 集合 (新增字段)

```typescript
{
  // ... 现有字段
  
  achievementPoints: number;  // 总成就点数
  achievements: [{
    achievementId: string;    // 成就 ID
    unlocked: boolean;        // 是否已解锁
    progress: number;         // 当前进度
    unlockedAt?: Date;        // 解锁时间
  }];
  stats: {
    tasksCompleted: number;
    correctVotes: number;
    dogWins: number;
    catWins: number;
    foxWins: number;
    winStreak: number;
    loseStreak: number;
    meetingsCalled: number;
    sabotages: number;
    investigations: number;
    hunterKills: number;
    survivals: number;
    perfectTasks: number;
    speedVictories: number;
    comebacks: number;
  };
}
```

---

## 解锁逻辑

成就解锁在游戏事件发生时自动触发：

1. **游戏结束**: 更新胜利/失败、角色胜利、任务完成等
2. **投票结束**: 更新正确投票统计
3. **任务完成**: 更新任务完成统计
4. **破坏发动**: 更新破坏统计
5. **调查使用**: 更新调查统计
6. **猎人击杀**: 更新猎人击杀统计

### 连胜/连败追踪

```typescript
// 胜利时
winStreak += 1
loseStreak = 0

// 失败时
loseStreak += 1
winStreak = 0
```

---

## 前端实现

### iOS (SwiftUI)

- `Achievement.swift` - 成就模型
- `AchievementManager.swift` - 网络管理
- `AchievementsView.swift` - 成就界面

### 界面功能

1. **成就概览**: 显示总点数、完成率、解锁数量
2. **类别筛选**: 按成就类别筛选查看
3. **进度追踪**: 显示未解锁成就的进度条
4. **难度标识**: 用颜色区分成就难度
5. **隐藏成就**: 未解锁前隐藏描述

---

## 运营建议

### 成就点数用途

1. **等级系统**: 成就点数可计入玩家等级
2. **称号系统**: 达到特定点数解锁特殊称号
3. **排行榜**: 成就点数排行榜
4. **赛季奖励**: 赛季结束时根据成就点数发放奖励

### 未来扩展

1. **赛季成就**: 每个赛季限定成就
2. **活动成就**: 特殊活动期间成就
3. **合作成就**: 与好友一起完成的成就
4. **挑战成就**: 每日/每周挑战任务

---

## 脚本工具

### 初始化成就

```bash
cd backend
npx ts-node src/scripts/initAchievements.ts
```

### 迁移现有用户数据

```bash
cd backend
npx ts-node src/scripts/migrateUsers.ts
```

---

**文档版本**: 1.0  
**创建时间**: 2026-03-09  
**作者**: qianwen-worker

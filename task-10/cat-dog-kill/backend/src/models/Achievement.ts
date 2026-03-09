import mongoose, { Document, Schema } from 'mongoose';

/**
 * 成就模型
 * 定义游戏中所有可解锁的成就
 */
export interface IAchievement extends Document {
  // 成就 ID (唯一标识)
  achievementId: string;
  
  // 成就名称
  name: string;
  
  // 成就描述
  description: string;
  
  // 成就图标 (emoji 或图片 URL)
  icon: string;
  
  // 成就类别
  category: AchievementCategory;
  
  // 成就难度
  difficulty: AchievementDifficulty;
  
  // 解锁条件类型
  conditionType: ConditionType;
  
  // 解锁条件目标值
  conditionTarget: number;
  
  // 成就点数
  points: number;
  
  // 是否隐藏成就
  isHidden: boolean;
  
  // 创建时间
  createdAt: Date;
}

// 成就类别
export enum AchievementCategory {
  // 游戏胜利相关
  VICTORY = 'victory',
  // 任务完成相关
  TASKS = 'tasks',
  // 社交/投票相关
  SOCIAL = 'social',
  // 特殊角色相关
  ROLE = 'role',
  // 连败/连胜相关
  STREAK = 'streak',
  // 收集类
  COLLECTION = 'collection',
  // 特殊成就
  SPECIAL = 'special'
}

// 成就难度
export enum AchievementDifficulty {
  EASY = 'easy',       // 简单 - 1 点
  MEDIUM = 'medium',   // 中等 - 3 点
  HARD = 'hard',       // 困难 - 5 点
  LEGENDARY = 'legendary' // 传奇 - 10 点
}

// 条件类型
export enum ConditionType {
  // 胜利次数
  WINS = 'wins',
  // 失败次数
  LOSSES = 'losses',
  // 游戏场次
  GAMES_PLAYED = 'games_played',
  // 完成任务数
  TASKS_COMPLETED = 'tasks_completed',
  // 投票正确次数
  CORRECT_VOTES = 'correct_votes',
  // 作为狗狗获胜次数
  DOG_WINS = 'dog_wins',
  // 作为猫咪获胜次数
  CAT_WINS = 'cat_wins',
  // 作为狐狸获胜次数
  FOX_WINS = 'fox_wins',
  // 连胜场次
  WIN_STREAK = 'win_streak',
  // 连败场次
  LOSE_STREAK = 'lose_streak',
  // 紧急会议发起次数
  MEETINGS_CALLED = 'meetings_called',
  // 破坏成功次数
  SABOTAGES = 'sabotages',
  // 调查成功次数 (侦探)
  INVESTIGATIONS = 'investigations',
  // 猎人击杀次数
  HUNTER_KILLS = 'hunter_kills',
  // 存活到最后 (狐狸)
  SURVIVALS = 'survivals',
  // 完美任务 (无错误)
  PERFECT_TASKS = 'perfect_tasks',
  // 快速胜利
  SPEED_VICTORY = 'speed_victory',
  // 绝地翻盘
  COMEBACK = 'comeback'
}

const AchievementSchema: Schema = new Schema({
  achievementId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true,
    default: '🏆'
  },
  category: {
    type: String,
    required: true,
    enum: Object.values(AchievementCategory)
  },
  difficulty: {
    type: String,
    required: true,
    enum: Object.values(AchievementDifficulty)
  },
  conditionType: {
    type: String,
    required: true,
    enum: Object.values(ConditionType)
  },
  conditionTarget: {
    type: Number,
    required: true
  },
  points: {
    type: Number,
    required: true,
    default: 1
  },
  isHidden: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model<IAchievement>('Achievement', AchievementSchema);

import Achievement, { 
  IAchievement, 
  AchievementCategory, 
  AchievementDifficulty, 
  ConditionType 
} from '../models/Achievement';
import User, { IUser, IAchievementProgress } from '../models/User';
import { Role, RoleTeam } from '../types/game';

/**
 * 成就服务
 * 管理成就的解锁、进度追踪和查询
 */
export class AchievementService {
  /**
   * 初始化默认成就
   * 在数据库为空时调用
   */
  async initializeDefaultAchievements(): Promise<void> {
    const count = await Achievement.countDocuments();
    if (count > 0) {
      console.log('✅ Achievements already initialized');
      return;
    }

    const defaultAchievements: Partial<IAchievement>[] = [
      // ========== 胜利类成就 ==========
      {
        achievementId: 'first_win',
        name: '首战告捷',
        description: '赢得第 1 场游戏',
        icon: '🎉',
        category: AchievementCategory.VICTORY,
        difficulty: AchievementDifficulty.EASY,
        conditionType: ConditionType.WINS,
        conditionTarget: 1,
        points: 1,
        isHidden: false
      },
      {
        achievementId: 'win_10',
        name: '十战十胜',
        description: '累计赢得 10 场游戏',
        icon: '🏆',
        category: AchievementCategory.VICTORY,
        difficulty: AchievementDifficulty.MEDIUM,
        conditionType: ConditionType.WINS,
        conditionTarget: 10,
        points: 3,
        isHidden: false
      },
      {
        achievementId: 'win_50',
        name: '百战百胜',
        description: '累计赢得 50 场游戏',
        icon: '👑',
        category: AchievementCategory.VICTORY,
        difficulty: AchievementDifficulty.HARD,
        conditionType: ConditionType.WINS,
        conditionTarget: 50,
        points: 5,
        isHidden: false
      },
      {
        achievementId: 'win_100',
        name: '传奇王者',
        description: '累计赢得 100 场游戏',
        icon: '💎',
        category: AchievementCategory.VICTORY,
        difficulty: AchievementDifficulty.LEGENDARY,
        conditionType: ConditionType.WINS,
        conditionTarget: 100,
        points: 10,
        isHidden: false
      },
      {
        achievementId: 'win_streak_3',
        name: '连胜高手',
        description: '取得 3 连胜',
        icon: '🔥',
        category: AchievementCategory.STREAK,
        difficulty: AchievementDifficulty.MEDIUM,
        conditionType: ConditionType.WIN_STREAK,
        conditionTarget: 3,
        points: 3,
        isHidden: false
      },
      {
        achievementId: 'win_streak_5',
        name: '不败神话',
        description: '取得 5 连胜',
        icon: '⚡',
        category: AchievementCategory.STREAK,
        difficulty: AchievementDifficulty.HARD,
        conditionType: ConditionType.WIN_STREAK,
        conditionTarget: 5,
        points: 5,
        isHidden: false
      },

      // ========== 任务类成就 ==========
      {
        achievementId: 'task_10',
        name: '勤劳小蜜蜂',
        description: '累计完成 10 个任务',
        icon: '🐝',
        category: AchievementCategory.TASKS,
        difficulty: AchievementDifficulty.EASY,
        conditionType: ConditionType.TASKS_COMPLETED,
        conditionTarget: 10,
        points: 1,
        isHidden: false
      },
      {
        achievementId: 'task_50',
        name: '任务达人',
        description: '累计完成 50 个任务',
        icon: '⭐',
        category: AchievementCategory.TASKS,
        difficulty: AchievementDifficulty.MEDIUM,
        conditionType: ConditionType.TASKS_COMPLETED,
        conditionTarget: 50,
        points: 3,
        isHidden: false
      },
      {
        achievementId: 'task_100',
        description: '累计完成 100 个任务',
        name: '任务大师',
        icon: '🎯',
        category: AchievementCategory.TASKS,
        difficulty: AchievementDifficulty.HARD,
        conditionType: ConditionType.TASKS_COMPLETED,
        conditionTarget: 100,
        points: 5,
        isHidden: false
      },
      {
        achievementId: 'perfect_task_10',
        name: '完美主义者',
        description: '完美完成 10 个任务 (无错误)',
        icon: '✨',
        category: AchievementCategory.TASKS,
        difficulty: AchievementDifficulty.MEDIUM,
        conditionType: ConditionType.PERFECT_TASKS,
        conditionTarget: 10,
        points: 3,
        isHidden: false
      },

      // ========== 社交类成就 ==========
      {
        achievementId: 'meeting_10',
        name: '会议达人',
        description: '发起 10 次紧急会议',
        icon: '📢',
        category: AchievementCategory.SOCIAL,
        difficulty: AchievementDifficulty.EASY,
        conditionType: ConditionType.MEETINGS_CALLED,
        conditionTarget: 10,
        points: 1,
        isHidden: false
      },
      {
        achievementId: 'correct_vote_20',
        name: '名侦探',
        description: '正确投票 20 次',
        icon: '🔍',
        category: AchievementCategory.SOCIAL,
        difficulty: AchievementDifficulty.MEDIUM,
        conditionType: ConditionType.CORRECT_VOTES,
        conditionTarget: 20,
        points: 3,
        isHidden: false
      },
      {
        achievementId: 'correct_vote_50',
        name: '神探夏洛克',
        description: '正确投票 50 次',
        icon: '🕵️',
        category: AchievementCategory.SOCIAL,
        difficulty: AchievementDifficulty.HARD,
        conditionType: ConditionType.CORRECT_VOTES,
        conditionTarget: 50,
        points: 5,
        isHidden: false
      },

      // ========== 角色类成就 ==========
      {
        achievementId: 'cat_win_10',
        name: '忠诚猫咪',
        description: '作为猫咪赢得 10 场胜利',
        icon: '🐱',
        category: AchievementCategory.ROLE,
        difficulty: AchievementDifficulty.MEDIUM,
        conditionType: ConditionType.CAT_WINS,
        conditionTarget: 10,
        points: 3,
        isHidden: false
      },
      {
        achievementId: 'dog_win_10',
        name: '狡猾狗狗',
        description: '作为狗狗赢得 10 场胜利',
        icon: '🐶',
        category: AchievementCategory.ROLE,
        difficulty: AchievementDifficulty.MEDIUM,
        conditionType: ConditionType.DOG_WINS,
        conditionTarget: 10,
        points: 3,
        isHidden: false
      },
      {
        achievementId: 'fox_win_5',
        name: '神秘狐狸',
        description: '作为狐狸赢得 5 场胜利',
        icon: '🦊',
        category: AchievementCategory.ROLE,
        difficulty: AchievementDifficulty.HARD,
        conditionType: ConditionType.FOX_WINS,
        conditionTarget: 5,
        points: 5,
        isHidden: false
      },
      {
        achievementId: 'sabotage_20',
        name: '破坏大王',
        description: '成功破坏 20 次',
        icon: '💣',
        category: AchievementCategory.ROLE,
        difficulty: AchievementDifficulty.MEDIUM,
        conditionType: ConditionType.SABOTAGES,
        conditionTarget: 20,
        points: 3,
        isHidden: false
      },
      {
        achievementId: 'investigation_10',
        name: '真相侦探',
        description: '成功调查 10 次 (侦探角色)',
        icon: '🔎',
        category: AchievementCategory.ROLE,
        difficulty: AchievementDifficulty.MEDIUM,
        conditionType: ConditionType.INVESTIGATIONS,
        conditionTarget: 10,
        points: 3,
        isHidden: false
      },
      {
        achievementId: 'hunter_kill_5',
        name: '复仇猎人',
        description: '作为猎人淘汰 5 名敌人',
        icon: '🎯',
        category: AchievementCategory.ROLE,
        difficulty: AchievementDifficulty.HARD,
        conditionType: ConditionType.HUNTER_KILLS,
        conditionTarget: 5,
        points: 5,
        isHidden: false
      },
      {
        achievementId: 'survival_10',
        name: '不死狐狸',
        description: '作为狐狸存活 10 次',
        icon: '👻',
        category: AchievementCategory.ROLE,
        difficulty: AchievementDifficulty.HARD,
        conditionType: ConditionType.SURVIVALS,
        conditionTarget: 10,
        points: 5,
        isHidden: false
      },

      // ========== 特殊成就 ==========
      {
        achievementId: 'speed_victory_5',
        name: '速战速决',
        description: '5 分钟内赢得 5 场游戏',
        icon: '⏱️',
        category: AchievementCategory.SPECIAL,
        difficulty: AchievementDifficulty.HARD,
        conditionType: ConditionType.SPEED_VICTORY,
        conditionTarget: 5,
        points: 5,
        isHidden: false
      },
      {
        achievementId: 'comeback_3',
        name: '绝地翻盘',
        description: '在劣势情况下翻盘 3 次',
        icon: '🔄',
        category: AchievementCategory.SPECIAL,
        difficulty: AchievementDifficulty.LEGENDARY,
        conditionType: ConditionType.COMEBACK,
        conditionTarget: 3,
        points: 10,
        isHidden: true
      },
      {
        achievementId: 'games_100',
        name: '资深玩家',
        description: '累计进行 100 场游戏',
        icon: '🎮',
        category: AchievementCategory.COLLECTION,
        difficulty: AchievementDifficulty.HARD,
        conditionType: ConditionType.GAMES_PLAYED,
        conditionTarget: 100,
        points: 5,
        isHidden: false
      }
    ];

    await Achievement.insertMany(defaultAchievements);
    console.log(`✅ Initialized ${defaultAchievements.length} default achievements`);
  }

  /**
   * 获取所有成就
   */
  async getAllAchievements(): Promise<IAchievement[]> {
    return Achievement.find().sort({ category: 1, difficulty: 1 });
  }

  /**
   * 获取用户的成就进度
   */
  async getUserAchievements(userId: string): Promise<{
    achievements: IAchievement[];
    progress: IAchievementProgress[];
    totalPoints: number;
    unlockedCount: number;
  }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const allAchievements = await this.getAllAchievements();
    const userProgress = user.achievements || [];
    const totalPoints = user.achievementPoints || 0;
    const unlockedCount = userProgress.filter(a => a.unlocked).length;

    return {
      achievements: allAchievements,
      progress: userProgress,
      totalPoints,
      unlockedCount
    };
  }

  /**
   * 更新成就进度
   * 在游戏事件发生时调用
   */
  async updateAchievementProgress(
    userId: string,
    conditionType: ConditionType,
    increment: number = 1
  ): Promise<IAchievementProgress[]> {
    const user = await User.findById(userId);
    if (!user) return [];

    // 更新统计数据
    const statField = this.conditionTypeToStatField(conditionType);
    if (statField) {
      user.stats[statField] = (user.stats[statField] || 0) + increment;
    }

    // 获取所有相关成就
    const relatedAchievements = await Achievement.find({ conditionType });
    const newlyUnlocked: IAchievementProgress[] = [];

    for (const achievement of relatedAchievements) {
      // 查找用户当前进度
      let progress = user.achievements.find(a => a.achievementId === achievement.achievementId);
      
      if (!progress) {
        // 创建新进度记录
        progress = {
          achievementId: achievement.achievementId,
          unlocked: false,
          progress: 0
        };
        user.achievements.push(progress);
      }

      // 如果已解锁，跳过
      if (progress.unlocked) continue;

      // 更新进度
      progress.progress += increment;

      // 检查是否满足解锁条件
      if (progress.progress >= achievement.conditionTarget) {
        progress.unlocked = true;
        progress.unlockedAt = new Date();
        user.achievementPoints += achievement.points;
        newlyUnlocked.push(progress);
        console.log(`🏆 User ${userId} unlocked achievement: ${achievement.name}`);
      }
    }

    // 特殊处理：游戏场次
    if (conditionType === ConditionType.GAMES_PLAYED) {
      user.gamesPlayed += increment;
    }

    await user.save();
    return newlyUnlocked;
  }

  /**
   * 游戏结束时更新成就
   */
  async onGameEnd(
    userId: string,
    won: boolean,
    role: Role,
    team: RoleTeam,
    tasksCompleted: number = 0,
    correctVote: boolean = false,
    meetingCalled: boolean = false,
    sabotages: number = 0,
    investigations: number = 0,
    hunterKill: boolean = false,
    gameDurationSeconds: number = 0
  ): Promise<IAchievementProgress[]> {
    const updates: Promise<IAchievementProgress[]>[] = [];

    // 游戏场次
    updates.push(this.updateAchievementProgress(userId, ConditionType.GAMES_PLAYED, 1));

    // 胜利/失败
    if (won) {
      updates.push(this.updateAchievementProgress(userId, ConditionType.WINS, 1));
      
      // 根据角色更新胜利统计
      if (team === RoleTeam.CAT) {
        updates.push(this.updateAchievementProgress(userId, ConditionType.CAT_WINS, 1));
      } else if (team === RoleTeam.DOG) {
        updates.push(this.updateAchievementProgress(userId, ConditionType.DOG_WINS, 1));
      } else if (role === Role.FOX) {
        updates.push(this.updateAchievementProgress(userId, ConditionType.FOX_WINS, 1));
        updates.push(this.updateAchievementProgress(userId, ConditionType.SURVIVALS, 1));
      }
    }

    // 任务完成
    if (tasksCompleted > 0) {
      updates.push(this.updateAchievementProgress(userId, ConditionType.TASKS_COMPLETED, tasksCompleted));
    }

    // 正确投票
    if (correctVote) {
      updates.push(this.updateAchievementProgress(userId, ConditionType.CORRECT_VOTES, 1));
    }

    // 发起会议
    if (meetingCalled) {
      updates.push(this.updateAchievementProgress(userId, ConditionType.MEETINGS_CALLED, 1));
    }

    // 破坏
    if (sabotages > 0) {
      updates.push(this.updateAchievementProgress(userId, ConditionType.SABOTAGES, sabotages));
    }

    // 调查
    if (investigations > 0) {
      updates.push(this.updateAchievementProgress(userId, ConditionType.INVESTIGATIONS, investigations));
    }

    // 猎人击杀
    if (hunterKill) {
      updates.push(this.updateAchievementProgress(userId, ConditionType.HUNTER_KILLS, 1));
    }

    // 速战速决 (5 分钟内胜利)
    if (won && gameDurationSeconds < 300) {
      updates.push(this.updateAchievementProgress(userId, ConditionType.SPEED_VICTORY, 1));
    }

    const results = await Promise.all(updates);
    return results.flat();
  }

  /**
   * 更新连胜/连败
   */
  async updateStreak(userId: string, won: boolean): Promise<IAchievementProgress[]> {
    const user = await User.findById(userId);
    if (!user) return [];

    if (won) {
      user.stats.winStreak = (user.stats.winStreak || 0) + 1;
      user.stats.loseStreak = 0;
      
      // 检查连胜成就
      return this.updateAchievementProgress(userId, ConditionType.WIN_STREAK, user.stats.winStreak);
    } else {
      user.stats.loseStreak = (user.stats.loseStreak || 0) + 1;
      user.stats.winStreak = 0;
      
      // 连败成就不需要检查（没有连败成就）
      return [];
    }
  }

  /**
   * 条件类型转换为统计字段名
   */
  private conditionTypeToStatField(conditionType: ConditionType): keyof IUser['stats'] | null {
    const mapping: Record<ConditionType, keyof IUser['stats'] | null> = {
      [ConditionType.WINS]: null,
      [ConditionType.LOSSES]: null,
      [ConditionType.GAMES_PLAYED]: null,
      [ConditionType.TASKS_COMPLETED]: 'tasksCompleted',
      [ConditionType.CORRECT_VOTES]: 'correctVotes',
      [ConditionType.DOG_WINS]: 'dogWins',
      [ConditionType.CAT_WINS]: 'catWins',
      [ConditionType.FOX_WINS]: 'foxWins',
      [ConditionType.WIN_STREAK]: 'winStreak',
      [ConditionType.LOSE_STREAK]: 'loseStreak',
      [ConditionType.MEETINGS_CALLED]: 'meetingsCalled',
      [ConditionType.SABOTAGES]: 'sabotages',
      [ConditionType.INVESTIGATIONS]: 'investigations',
      [ConditionType.HUNTER_KILLS]: 'hunterKills',
      [ConditionType.SURVIVALS]: 'survivals',
      [ConditionType.PERFECT_TASKS]: 'perfectTasks',
      [ConditionType.SPEED_VICTORY]: 'speedVictories',
      [ConditionType.COMEBACK]: 'comebacks'
    };
    return mapping[conditionType] || null;
  }

  /**
   * 获取成就类别标签
   */
  getCategoryLabel(category: AchievementCategory): string {
    const labels: Record<AchievementCategory, string> = {
      [AchievementCategory.VICTORY]: '胜利',
      [AchievementCategory.TASKS]: '任务',
      [AchievementCategory.SOCIAL]: '社交',
      [AchievementCategory.ROLE]: '角色',
      [AchievementCategory.STREAK]: '连胜',
      [AchievementCategory.COLLECTION]: '收集',
      [AchievementCategory.SPECIAL]: '特殊'
    };
    return labels[category];
  }

  /**
   * 获取难度标签
   */
  getDifficultyLabel(difficulty: AchievementDifficulty): string {
    const labels: Record<AchievementDifficulty, string> = {
      [AchievementDifficulty.EASY]: '简单',
      [AchievementDifficulty.MEDIUM]: '中等',
      [AchievementDifficulty.HARD]: '困难',
      [AchievementDifficulty.LEGENDARY]: '传奇'
    };
    return labels[difficulty];
  }
}

// 导出单例
export const achievementService = new AchievementService();

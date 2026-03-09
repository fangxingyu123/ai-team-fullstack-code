import mongoose from 'mongoose';
import User, { IUser } from '../models/User';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
  level: number;
}

export class LeaderboardService {
  /**
   * 获取排行榜数据
   * @param limit 返回数量限制（默认 100）
   * @returns 排行榜列表
   */
  async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    try {
      // 查询用户数据，按胜场数降序排序
      const users = await User.find()
        .select('username wins losses gamesPlayed level')
        .sort({ wins: -1, gamesPlayed: -1 }) // 先按胜场排序，胜场相同按游戏场次排序
        .limit(limit)
        .lean();

      // 转换为排行榜格式
      const leaderboard: LeaderboardEntry[] = users.map((user, index) => {
        const winRate = user.gamesPlayed > 0 
          ? user.wins / user.gamesPlayed 
          : 0;

        return {
          rank: index + 1,
          userId: user._id.toString(),
          username: user.username,
          wins: user.wins,
          losses: user.losses,
          gamesPlayed: user.gamesPlayed,
          winRate: Math.round(winRate * 100) / 100, // 保留两位小数
          level: user.level
        };
      });

      return leaderboard;
    } catch (error: any) {
      console.error('Leaderboard query error:', error);
      throw new Error('Failed to fetch leaderboard');
    }
  }

  /**
   * 获取玩家的排名
   * @param userId 用户 ID
   * @returns 玩家排名信息
   */
  async getPlayerRank(userId: string): Promise<{ rank: number; total: number } | null> {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      
      // 获取当前用户的胜场数
      const currentUser = await User.findById(userId).select('wins').lean();
      if (!currentUser) return null;

      // 计算排名：统计胜场数大于当前用户的玩家数量
      const countBetter = await User.countDocuments({
        wins: { $gt: currentUser.wins }
      });

      // 统计总玩家数
      const total = await User.countDocuments();

      return {
        rank: countBetter + 1,
        total
      };
    } catch (error: any) {
      console.error('Get player rank error:', error);
      return null;
    }
  }

  /**
   * 获取排行榜前 N 名（简化版，用于缓存）
   * @param topN 前 N 名（默认 10）
   * @returns 前 N 名排行榜
   */
  async getTopPlayers(topN: number = 10): Promise<LeaderboardEntry[]> {
    return this.getLeaderboard(topN);
  }
}

// 导出单例
export const leaderboardService = new LeaderboardService();

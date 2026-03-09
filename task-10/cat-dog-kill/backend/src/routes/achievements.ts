import express, { Request, Response } from 'express';
import { achievementService } from '../services/achievementService';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/achievements
 * 获取所有成就列表
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const achievements = await achievementService.getAllAchievements();
    
    // 按类别分组
    const grouped = achievements.reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    }, {} as Record<string, typeof achievements>);

    res.json({ 
      achievements,
      grouped,
      categories: Object.keys(grouped).map(cat => ({
        id: cat,
        label: achievementService.getCategoryLabel(cat as any),
        count: grouped[cat].length
      }))
    });
  } catch (error: any) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Failed to fetch achievements' });
  }
});

/**
 * GET /api/achievements/my
 * 获取当前用户的成就进度
 * 需要认证
 */
router.get('/my', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await achievementService.getUserAchievements(userId);
    
    res.json({
      achievements: result.achievements,
      progress: result.progress,
      totalPoints: result.totalPoints,
      unlockedCount: result.unlockedCount,
      totalCount: result.achievements.length,
      completionRate: result.achievements.length > 0 
        ? Math.round((result.unlockedCount / result.achievements.length) * 100) 
        : 0
    });
  } catch (error: any) {
    console.error('Get user achievements error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch achievements' });
  }
});

/**
 * GET /api/achievements/user/:userId
 * 获取指定用户的成就进度 (公开信息)
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await achievementService.getUserAchievements(userId);
    
    res.json({
      userId,
      totalPoints: result.totalPoints,
      unlockedCount: result.unlockedCount,
      totalCount: result.achievements.length,
      completionRate: result.achievements.length > 0 
        ? Math.round((result.unlockedCount / result.achievements.length) * 100) 
        : 0,
      // 只显示已解锁的成就（隐藏成就除外）
      unlockedAchievements: result.progress
        .filter(p => p.unlocked)
        .map(p => {
          const achievement = result.achievements.find(a => a.achievementId === p.achievementId);
          if (!achievement || achievement.isHidden) return null;
          return {
            achievementId: p.achievementId,
            name: achievement.name,
            icon: achievement.icon,
            points: achievement.points,
            unlockedAt: p.unlockedAt
          };
        })
        .filter(Boolean)
    });
  } catch (error: any) {
    console.error('Get user achievements error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch achievements' });
  }
});

export default router;

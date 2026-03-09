import express, { Request, Response } from 'express';
import { getAllMaps, getMap, recommendMap } from '../types/maps';
import { leaderboardService } from '../services/leaderboardService';

const router = express.Router();

// Get available rooms (for matchmaking)
router.get('/rooms', async (req: Request, res: Response) => {
  try {
    // This would query Redis for active rooms
    // For now, return empty array
    res.json({ rooms: [] });
  } catch (error: any) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room details by code
router.get('/rooms/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    // This would query Redis for room details
    res.json({ 
      room: {
        code,
        playerCount: 0,
        maxPlayers: 10,
        isPlaying: false
      }
    });
  } catch (error: any) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboards
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 100;
    const leaderboard = await leaderboardService.getLeaderboard(limit);
    res.json({ leaderboard });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get player's own rank
router.get('/leaderboard/rank', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    
    const rankInfo = await leaderboardService.getPlayerRank(userId as string);
    if (!rankInfo) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    res.json(rankInfo);
  } catch (error: any) {
    console.error('Get player rank error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all available maps
router.get('/maps', async (req: Request, res: Response) => {
  try {
    const maps = getAllMaps();
    res.json({ maps });
  } catch (error: any) {
    console.error('Get maps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific map details
router.get('/maps/:mapId', async (req: Request, res: Response) => {
  try {
    const { mapId } = req.params;
    const map = getMap(mapId);
    
    if (!map) {
      return res.status(404).json({ message: 'Map not found' });
    }
    
    res.json({ map });
  } catch (error: any) {
    console.error('Get map error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recommended map for player count
router.get('/maps/recommend/:playerCount', async (req: Request, res: Response) => {
  try {
    const { playerCount } = req.params;
    const count = parseInt(playerCount, 10);
    
    if (isNaN(count) || count < 4 || count > 10) {
      return res.status(400).json({ message: 'Invalid player count' });
    }
    
    const recommendedMapId = recommendMap(count);
    const map = getMap(recommendedMapId);
    
    res.json({ 
      recommendedMapId,
      map: map ? {
        id: map.id,
        name: map.name,
        description: map.description,
        difficulty: map.difficulty
      } : null
    });
  } catch (error: any) {
    console.error('Recommend map error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

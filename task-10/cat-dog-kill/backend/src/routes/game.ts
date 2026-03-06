import express, { Request, Response } from 'express';

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
    // This would query MongoDB for top players
    res.json({
      leaderboard: [
        { rank: 1, username: 'ProPlayer', wins: 150, winRate: 0.75 },
        { rank: 2, username: 'GameMaster', wins: 120, winRate: 0.70 },
        { rank: 3, username: 'CatLover', wins: 100, winRate: 0.65 },
        { rank: 4, username: 'Doggo', wins: 95, winRate: 0.62 },
        { rank: 5, username: 'FoxHunter', wins: 90, winRate: 0.60 }
      ]
    });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Friend from '../models/Friend';

const router = express.Router();

interface AuthRequest extends Request {
  user?: any;
}

// Helper function to get user from token
async function getUserFromToken(token: string): Promise<any> {
  const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
  const user = await User.findById(decoded.userId).select('-password');
  if (!user) {
    throw new Error('User not found');
  }
  return { decoded, user };
}

// Get friend requests (pending incoming)
router.get('/requests', async (req: AuthRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const { decoded } = await getUserFromToken(token);
    
    // Find all pending friend requests where this user is the recipient
    const requests = await Friend.find({ 
      friendId: decoded.userId, 
      status: 'pending' 
    }).populate('userId', 'username avatar level');

    const formattedRequests = requests.map((req: any) => ({
      id: req._id,
      from: {
        id: req.userId._id,
        username: req.userId.username,
        avatar: req.userId.avatar,
        level: req.userId.level
      },
      createdAt: req.createdAt
    }));

    res.json({ requests: formattedRequests });
  } catch (error: any) {
    console.error('Get friend requests error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Get friends list (accepted friendships)
router.get('/list', async (req: AuthRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const { decoded } = await getUserFromToken(token);
    
    // Find all accepted friendships (both directions)
    const [sentFriends, receivedFriends] = await Promise.all([
      Friend.find({ 
        userId: decoded.userId, 
        status: 'accepted' 
      }).populate('friendId', 'username avatar level wins losses gamesPlayed'),
      Friend.find({ 
        friendId: decoded.userId, 
        status: 'accepted' 
      }).populate('userId', 'username avatar level wins losses gamesPlayed')
    ]);

    // Combine and format friends
    const friends = new Map();
    
    sentFriends.forEach((f: any) => {
      friends.set(f.friendId._id.toString(), {
        id: f.friendId._id,
        username: f.friendId.username,
        avatar: f.friendId.avatar,
        level: f.friendId.level,
        wins: f.friendId.wins,
        losses: f.friendId.losses,
        gamesPlayed: f.friendId.gamesPlayed,
        winRate: f.friendId.gamesPlayed > 0 
          ? (f.friendId.wins / f.friendId.gamesPlayed).toFixed(2) 
          : '0.00',
        isOnline: false, // Will be updated by socket service
        createdAt: f.createdAt
      });
    });

    receivedFriends.forEach((f: any) => {
      if (!friends.has(f.userId._id.toString())) {
        friends.set(f.userId._id.toString(), {
          id: f.userId._id,
          username: f.userId.username,
          avatar: f.userId.avatar,
          level: f.userId.level,
          wins: f.userId.wins,
          losses: f.userId.losses,
          gamesPlayed: f.userId.gamesPlayed,
          winRate: f.userId.gamesPlayed > 0 
            ? (f.userId.wins / f.userId.gamesPlayed).toFixed(2) 
            : '0.00',
          isOnline: false,
          createdAt: f.createdAt
        });
      }
    });

    res.json({ friends: Array.from(friends.values()) });
  } catch (error: any) {
    console.error('Get friends list error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Send friend request
router.post('/request', async (req: AuthRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const { decoded, user } = await getUserFromToken(token);
    const { targetUsername } = req.body;

    if (!targetUsername) {
      return res.status(400).json({ message: 'Target username required' });
    }

    // Find target user
    const targetUser = await User.findOne({ username: targetUsername });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser._id.toString() === decoded.userId) {
      return res.status(400).json({ message: 'Cannot add yourself as a friend' });
    }

    // Check if already friends or request exists
    const existingFriend = await Friend.findOne({
      $or: [
        { userId: decoded.userId, friendId: targetUser._id },
        { userId: targetUser._id, friendId: decoded.userId }
      ]
    });

    if (existingFriend) {
      if (existingFriend.status === 'accepted') {
        return res.status(400).json({ message: 'Already friends' });
      } else if (existingFriend.status === 'blocked') {
        return res.status(400).json({ message: 'Friend request blocked' });
      } else if (existingFriend.userId.toString() === targetUser._id.toString()) {
        return res.status(400).json({ message: 'Friend request already sent' });
      }
    }

    // Create friend request
    const friendRequest = new Friend({
      userId: decoded.userId,
      friendId: targetUser._id,
      status: 'pending'
    });

    await friendRequest.save();

    res.json({ 
      message: 'Friend request sent',
      request: {
        to: {
          id: targetUser._id,
          username: targetUser.username
        }
      }
    });
  } catch (error: any) {
    console.error('Send friend request error:', error);
    if (error.message === 'User not found') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept friend request
router.post('/accept/:requestId', async (req: AuthRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const { decoded } = await getUserFromToken(token);
    const { requestId } = req.params;

    const friendRequest = await Friend.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Verify this request is for the current user
    if (friendRequest.friendId.toString() !== decoded.userId) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Accept the request
    friendRequest.status = 'accepted';
    await friendRequest.save();

    res.json({ 
      message: 'Friend request accepted',
      friend: {
        id: friendRequest.userId,
        username: (await User.findById(friendRequest.userId))?.username
      }
    });
  } catch (error: any) {
    console.error('Accept friend request error:', error);
    if (error.message === 'User not found') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject friend request
router.post('/reject/:requestId', async (req: AuthRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const { decoded } = await getUserFromToken(token);
    const { requestId } = req.params;

    const friendRequest = await Friend.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Verify this request is for the current user
    if (friendRequest.friendId.toString() !== decoded.userId) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    // Delete the request
    await Friend.findByIdAndDelete(requestId);

    res.json({ message: 'Friend request rejected' });
  } catch (error: any) {
    console.error('Reject friend request error:', error);
    if (error.message === 'User not found') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove friend
router.delete('/remove/:friendId', async (req: AuthRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const { decoded } = await getUserFromToken(token);
    const { friendId } = req.params;

    // Remove friendship in both directions
    await Promise.all([
      Friend.deleteOne({ userId: decoded.userId, friendId }),
      Friend.deleteOne({ userId: friendId, friendId: decoded.userId })
    ]);

    res.json({ message: 'Friend removed' });
  } catch (error: any) {
    console.error('Remove friend error:', error);
    if (error.message === 'User not found') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Block user
router.post('/block/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const { decoded } = await getUserFromToken(token);
    const { userId } = req.params;

    if (userId === decoded.userId) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    // Remove any existing friendship and create block
    await Friend.deleteOne({ 
      $or: [
        { userId: decoded.userId, friendId: userId },
        { userId: userId, friendId: decoded.userId }
      ]
    });

    const block = new Friend({
      userId: decoded.userId,
      friendId: userId,
      status: 'blocked'
    });

    await block.save();

    res.json({ message: 'User blocked' });
  } catch (error: any) {
    console.error('Block user error:', error);
    if (error.message === 'User not found') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users by username
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const { decoded } = await getUserFromToken(token);
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query required' });
    }

    // Search for users matching the query
    const users = await User.find({
      username: { $regex: query, $options: 'i' },
      _id: { $ne: decoded.userId }
    })
    .select('username avatar level')
    .limit(20);

    res.json({ 
      users: users.map(u => ({
        id: u._id,
        username: u.username,
        avatar: u.avatar,
        level: u.level
      }))
    });
  } catch (error: any) {
    console.error('Search users error:', error);
    if (error.message === 'User not found') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

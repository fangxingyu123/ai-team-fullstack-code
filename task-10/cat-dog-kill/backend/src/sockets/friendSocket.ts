import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';

// 在线用户映射：userId -> socketId
const onlineUsers = new Map<string, string>();

// 用户的好友列表缓存（用于快速推送在线状态）
const userFriends = new Map<string, Set<string>>();

export function initializeFriendSocket(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Friend socket connected: ${socket.id}`);

    // 用户登录上线
    socket.on('friend_login', async (data: { userId: string; friendIds: string[] }) => {
      try {
        const { userId, friendIds } = data;
        
        // 记录用户在线
        onlineUsers.set(userId, socket.id);
        
        // 缓存好友关系
        userFriends.set(userId, new Set(friendIds));
        
        // 加入自己的房间（用于接收好友请求）
        socket.join(`user:${userId}`);
        
        // 通知所有在线好友：我上线了
        const friendsOnline = friendIds.filter(fid => onlineUsers.has(fid));
        for (const friendId of friendsOnline) {
          const friendSocketId = onlineUsers.get(friendId);
          if (friendSocketId) {
            io.to(friendSocketId).emit('friend_online', { userId });
          }
        }
        
        // 返回所有在线好友
        socket.emit('friends_online', { 
          onlineFriends: friendsOnline 
        });
        
        console.log(`🟢 User ${userId} logged in, ${friendsOnline.length} friends online`);
      } catch (error) {
        console.error('Friend login error:', error);
      }
    });

    // 用户下线
    socket.on('disconnect', async () => {
      console.log(`🔌 Friend socket disconnected: ${socket.id}`);
      
      // 查找并移除下线用户
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          
          // 通知所有在线好友：我下线了
          const friends = userFriends.get(userId);
          if (friends) {
            for (const friendId of friends) {
              const friendSocketId = onlineUsers.get(friendId);
              if (friendSocketId) {
                io.to(friendSocketId).emit('friend_offline', { userId });
              }
            }
            userFriends.delete(userId);
          }
          
          socket.leave(`user:${userId}`);
          console.log(`🔴 User ${userId} logged out`);
          break;
        }
      }
    });

    // 发送好友请求通知
    socket.on('send_friend_request', async (data: { 
      fromUserId: string; 
      fromUsername: string; 
      toUserId: string 
    }) => {
      try {
        const { fromUserId, fromUsername, toUserId } = data;
        
        // 向目标用户发送通知
        io.to(`user:${toUserId}`).emit('friend_request_received', {
          fromUserId,
          fromUsername,
          timestamp: Date.now()
        });
        
        console.log(`📩 Friend request from ${fromUsername} to ${toUserId}`);
      } catch (error) {
        console.error('Send friend request error:', error);
      }
    });

    // 好友请求被接受通知
    socket.on('friend_request_accepted', async (data: { 
      fromUserId: string; 
      toUserId: string;
      toUsername: string;
    }) => {
      try {
        const { fromUserId, toUserId, toUsername } = data;
        
        // 通知发送请求的用户：请求被接受了
        io.to(`user:${fromUserId}`).emit('friend_request_accepted', {
          friendId: toUserId,
          friendUsername: toUsername,
          timestamp: Date.now()
        });
        
        // 更新好友关系缓存
        if (!userFriends.has(toUserId)) {
          userFriends.set(toUserId, new Set());
        }
        userFriends.get(toUserId)?.add(fromUserId);
        
        if (!userFriends.has(fromUserId)) {
          userFriends.set(fromUserId, new Set());
        }
        userFriends.get(fromUserId)?.add(toUserId);
        
        console.log(`✅ Friend request accepted: ${toUsername} is now friends with ${fromUserId}`);
      } catch (error) {
        console.error('Friend request accepted error:', error);
      }
    });

    // 移除好友通知
    socket.on('friend_removed', async (data: { 
      userId: string; 
      friendId: string 
    }) => {
      try {
        const { userId, friendId } = data;
        
        // 通知被移除的好友
        io.to(`user:${friendId}`).emit('friend_removed', {
          byUserId: userId,
          timestamp: Date.now()
        });
        
        // 更新缓存
        userFriends.get(userId)?.delete(friendId);
        userFriends.get(friendId)?.delete(userId);
        
        console.log(`❌ Friend removed: ${userId} removed ${friendId}`);
      } catch (error) {
        console.error('Friend removed error:', error);
      }
    });

    // 邀请好友加入房间
    socket.on('invite_friend', async (data: {
      fromUserId: string;
      fromUsername: string;
      toUserId: string;
      roomCode: string;
    }) => {
      try {
        const { fromUserId, fromUsername, toUserId, roomCode } = data;
        
        // 向目标用户发送邀请通知
        io.to(`user:${toUserId}`).emit('friend_invited', {
          fromUserId,
          fromUsername,
          roomCode,
          timestamp: Date.now()
        });
        
        console.log(`🎮 Friend invite: ${fromUsername} invited ${toUserId} to room ${roomCode}`);
      } catch (error) {
        console.error('Invite friend error:', error);
      }
    });

    // 接受房间邀请
    socket.on('accept_invite', async (data: {
      toUserId: string;
      fromUserId: string;
      roomCode: string;
    }) => {
      try {
        const { toUserId, fromUserId, roomCode } = data;
        
        // 通知邀请者：好友接受了邀请
        io.to(`user:${fromUserId}`).emit('invite_accepted', {
          friendId: toUserId,
          roomCode,
          timestamp: Date.now()
        });
        
        console.log(`✅ Invite accepted: ${toUserId} joined room ${roomCode}`);
      } catch (error) {
        console.error('Accept invite error:', error);
      }
    });
  });
}

// 获取在线用户数量
export function getOnlineCount(): number {
  return onlineUsers.size;
}

// 检查用户是否在线
export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

// 获取用户 Socket ID
export function getUserSocketId(userId: string): string | undefined {
  return onlineUsers.get(userId);
}

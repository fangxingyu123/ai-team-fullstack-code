//
//  FriendSocketManager.swift
//  CatDogKill
//
//  好友系统 Socket.IO 实时通信管理
//

import Foundation
import SocketIO

/// 好友 Socket 事件代理
protocol FriendSocketDelegate: AnyObject {
    func didReceiveFriendRequest(fromUserId: String, fromUsername: String)
    func friendRequestAccepted(friendId: String, friendUsername: String)
    func friendRemoved(byUserId: String)
    func friendOnline(userId: String)
    func friendOffline(userId: String)
    func friendsOnline(onlineFriends: [String])
    func friendInvited(fromUserId: String, fromUsername: String, roomCode: String)
    func inviteAccepted(friendId: String, roomCode: String)
}

/// 好友 Socket 管理器
class FriendSocketManager {
    static let shared = FriendSocketManager()
    
    private var manager: SocketManager?
    private var socket: SocketIOClient?
    private var currentUserId: String?
    private var currentFriendIds: [String] = []
    
    weak var delegate: FriendSocketDelegate?
    
    private init() {}
    
    /// 连接到好友 Socket 服务器
    func connect(baseURL: String, userId: String, friendIds: [String]) {
        disconnect()
        
        currentUserId = userId
        currentFriendIds = friendIds
        
        // 创建 Socket 管理器
        manager = SocketManager(
            socketURL: URL(string: baseURL)!,
            config: [
                .log(false),
                .compress
            ]
        )
        
        socket = manager?.defaultSocket
        
        setupListeners()
        
        socket?.connect()
        
        // 登录上线
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.login(userId: userId, friendIds: friendIds)
        }
    }
    
    /// 断开连接
    func disconnect() {
        socket?.disconnect()
        socket = nil
        manager = nil
        currentUserId = nil
        currentFriendIds = []
    }
    
    /// 登录上线
    private func login(userId: String, friendIds: [String]) {
        socket?.emit("friend_login", [
            "userId": userId,
            "friendIds": friendIds
        ])
    }
    
    /// 发送好友请求通知
    func sendFriendRequest(toUserId: String, fromUsername: String) {
        guard let userId = currentUserId else { return }
        
        socket?.emit("send_friend_request", [
            "fromUserId": userId,
            "fromUsername": fromUsername,
            "toUserId": toUserId
        ])
    }
    
    /// 通知好友请求被接受
    func notifyRequestAccepted(toUserId: String, toUsername: String) {
        guard let userId = currentUserId else { return }
        
        socket?.emit("friend_request_accepted", [
            "fromUserId": userId,
            "toUserId": toUserId,
            "toUsername": toUsername
        ])
    }
    
    /// 通知移除好友
    func notifyFriendRemoved(friendId: String) {
        guard let userId = currentUserId else { return }
        
        socket?.emit("friend_removed", [
            "userId": userId,
            "friendId": friendId
        ])
    }
    
    /// 邀请好友加入房间
    func inviteFriend(toUserId: String, fromUsername: String, roomCode: String) {
        socket?.emit("invite_friend", [
            "fromUserId": currentUserId ?? "",
            "fromUsername": fromUsername,
            "toUserId": toUserId,
            "roomCode": roomCode
        ])
    }
    
    /// 接受房间邀请
    func acceptInvite(fromUserId: String, roomCode: String) {
        guard let userId = currentUserId else { return }
        
        socket?.emit("accept_invite", [
            "toUserId": userId,
            "fromUserId": fromUserId,
            "roomCode": roomCode
        ])
    }
    
    // MARK: - 事件监听
    
    private func setupListeners() {
        // 好友上线
        socket?.on("friend_online") { [weak self] data, ack in
            guard let data = data.first as? [String: Any],
                  let userId = data["userId"] as? String else { return }
            DispatchQueue.main.async {
                self?.delegate?.friendOnline(userId: userId)
            }
        }
        
        // 好友下线
        socket?.on("friend_offline") { [weak self] data, ack in
            guard let data = data.first as? [String: Any],
                  let userId = data["userId"] as? String else { return }
            DispatchQueue.main.async {
                self?.delegate?.friendOffline(userId: userId)
            }
        }
        
        // 好友在线列表
        socket?.on("friends_online") { [weak self] data, ack in
            guard let data = data.first as? [String: Any],
                  let onlineFriends = data["onlineFriends"] as? [String] else { return }
            DispatchQueue.main.async {
                self?.delegate?.friendsOnline(onlineFriends: onlineFriends)
            }
        }
        
        // 收到好友请求
        socket?.on("friend_request_received") { [weak self] data, ack in
            guard let data = data.first as? [String: Any],
                  let fromUserId = data["fromUserId"] as? String,
                  let fromUsername = data["fromUsername"] as? String else { return }
            DispatchQueue.main.async {
                self?.delegate?.didReceiveFriendRequest(
                    fromUserId: fromUserId,
                    fromUsername: fromUsername
                )
            }
        }
        
        // 好友请求被接受
        socket?.on("friend_request_accepted") { [weak self] data, ack in
            guard let data = data.first as? [String: Any],
                  let friendId = data["friendId"] as? String,
                  let friendUsername = data["friendUsername"] as? String else { return }
            DispatchQueue.main.async {
                self?.delegate?.friendRequestAccepted(
                    friendId: friendId,
                    friendUsername: friendUsername
                )
            }
        }
        
        // 被移除好友
        socket?.on("friend_removed") { [weak self] data, ack in
            guard let data = data.first as? [String: Any],
                  let byUserId = data["byUserId"] as? String else { return }
            DispatchQueue.main.async {
                self?.delegate?.friendRemoved(byUserId: byUserId)
            }
        }
        
        // 收到房间邀请
        socket?.on("friend_invited") { [weak self] data, ack in
            guard let data = data.first as? [String: Any],
                  let fromUserId = data["fromUserId"] as? String,
                  let fromUsername = data["fromUsername"] as? String,
                  let roomCode = data["roomCode"] as? String else { return }
            DispatchQueue.main.async {
                self?.delegate?.friendInvited(
                    fromUserId: fromUserId,
                    fromUsername: fromUsername,
                    roomCode: roomCode
                )
            }
        }
        
        // 邀请被接受
        socket?.on("invite_accepted") { [weak self] data, ack in
            guard let data = data.first as? [String: Any],
                  let friendId = data["friendId"] as? String,
                  let roomCode = data["roomCode"] as? String else { return }
            DispatchQueue.main.async {
                self?.delegate?.inviteAccepted(
                    friendId: friendId,
                    roomCode: roomCode
                )
            }
        }
    }
}

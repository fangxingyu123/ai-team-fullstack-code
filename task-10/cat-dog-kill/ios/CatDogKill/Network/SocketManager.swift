//
//  SocketManager.swift
//  CatDogKill
//
//  Socket.IO 连接管理
//

import Foundation
import Starscream

class SocketManager: NSObject {
    private var socket: WebSocket?
    private let serverURL: String
    
    // Event handlers
    var onConnect: (() -> Void)?
    var onDisconnect: (() -> Void)?
    var onRoomCreated: ((String, String) -> Void)?
    var onRoomJoined: ((GameState, Player) -> Void)?
    var onPlayerJoined: ((Player) -> Void)?
    var onPlayerLeft: ((String) -> Void)?
    var onGameStarted: ((PlayerRole, [Player], String?) -> Void)? // role, players, voiceRoomId
    var onGameStateUpdate: ((GameState) -> Void)?
    var onMeetingStarted: ((Player?) -> Void)?
    var onVotingResult: ((Player?, Bool) -> Void)?
    var onGameEnded: ((String) -> Void)?
    var onError: ((String) -> Void)?
    var onChatMessage: ((String, String, String) -> Void)? // playerId, username, message
    var onInvestigationResult: ((InvestigationResult) -> Void)?
    var onHunterElimination: ((HunterElimination) -> Void)?
    
    init(serverURL: String = "ws://localhost:3000") {
        self.serverURL = serverURL
        super.init()
    }
    
    func connect() {
        var request = URLRequest(url: URL(string: serverURL)!)
        request.timeoutInterval = 5
        request.httpMethod = "GET"
        
        socket = WebSocket(request: request)
        socket?.delegate = self
        socket?.connect()
    }
    
    func disconnect() {
        socket?.disconnect()
        socket = nil
    }
    
    // MARK: - Socket Events
    
    func createRoom(username: String, settings: [String: Any]) {
        sendEvent("create_room", data: [
            "username": username,
            "settings": settings
        ])
    }
    
    func joinRoom(roomCode: String, username: String) {
        sendEvent("join_room", data: [
            "roomCode": roomCode,
            "username": username
        ])
    }
    
    func leaveRoom() {
        sendEvent("leave_room", data: [:])
    }
    
    func startGame() {
        sendEvent("start_game", data: [:])
    }
    
    func movePlayer(x: Double, y: Double) {
        sendEvent("move_player", data: [
            "x": x,
            "y": y
        ])
    }
    
    func completeTask(taskId: String) {
        sendEvent("complete_task", data: [
            "taskId": taskId
        ])
    }
    
    func emergencyMeeting() {
        sendEvent("emergency_meeting", data: [:])
    }
    
    func castVote(targetId: String?) {
        sendEvent("cast_vote", data: [
            "targetId": targetId as Any
        ])
    }
    
    func sendChatMessage(_ message: String) {
        sendEvent("chat_message", data: [
            "message": message
        ])
    }
    
    func performSabotage(type: String) {
        sendEvent("sabotage", data: [
            "type": type
        ])
    }
    
    func investigate(targetId: String) {
        sendEvent("investigate", data: [
            "targetId": targetId
        ])
    }
    
    func hunterEliminate(targetId: String) {
        sendEvent("hunter_eliminate", data: [
            "targetId": targetId
        ])
    }
    
    // MARK: - Private Methods
    
    private func sendEvent(_ event: String, data: [String: Any]) {
        guard let socket = socket, socket.isConnected else {
            print("Socket not connected")
            return
        }
        
        let payload: [String: Any] = [
            "event": event,
            "data": data
        ]
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: payload)
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                socket.write(string: jsonString)
            }
        } catch {
            print("Failed to send event: \(error)")
        }
    }
    
    private func handleEvent(_ event: String, data: [String: Any]) {
        switch event {
        case "room_created":
            if let roomCode = data["roomCode"] as? String,
               let gameId = data["gameId"] as? String {
                onRoomCreated?(roomCode, gameId)
            }
            
        case "room_joined":
            if let gameDict = data["game"] as? [String: Any],
               let playerDict = data["player"] as? [String: Any],
               let game = parseGameState(gameDict),
               let player = parsePlayer(playerDict) {
                onRoomJoined?(game, player)
            }
            
        case "player_joined":
            if let playerDict = data["player"] as? [String: Any],
               let player = parsePlayer(playerDict) {
                onPlayerJoined?(player)
            }
            
        case "player_left":
            if let playerId = data["playerId"] as? String {
                onPlayerLeft?(playerId)
            }
            
        case "game_started":
            if let roleStr = data["role"] as? String,
               let role = PlayerRole(rawValue: roleStr),
               let playersArray = data["players"] as? [[String: Any]] {
                let players = playersArray.compactMap { parsePlayer($0) }
                onGameStarted?(role, players)
            }
            
        case "game_state_update":
            if let gameDict = data["game"] as? [String: Any],
               let game = parseGameState(gameDict) {
                onGameStateUpdate?(game)
            }
            
        case "meeting_started":
            let deadPlayer = data["deadPlayer"] as? [String: Any] != nil ? parsePlayer(data["deadPlayer"] as? [String: Any] ?? [:]) : nil
            onMeetingStarted?(deadPlayer)
            
        case "voting_result":
            let ejectedPlayer = data["ejectedPlayer"] as? [String: Any] != nil ? parsePlayer(data["ejectedPlayer"] as? [String: Any] ?? [:]) : nil
            let skipped = data["skipped"] as? Bool ?? false
            onVotingResult?(ejectedPlayer, skipped)
            
        case "game_ended":
            if let winner = data["winner"] as? String {
                onGameEnded?(winner)
            }
            
        case "error":
            if let message = data["message"] as? String {
                onError?(message)
            }
            
        case "chat_message":
            if let playerId = data["playerId"] as? String,
               let username = data["username"] as? String,
               let message = data["message"] as? String {
                onChatMessage?(playerId, username, message)
            }
            
        case "investigation_result":
            if let targetPlayerId = data["targetPlayerId"] as? String,
               let targetRoleStr = data["targetRole"] as? String,
               let targetRole = PlayerRole(rawValue: targetRoleStr),
               let targetTeamStr = data["targetTeam"] as? String,
               let targetTeam = PlayerTeam(rawValue: targetTeamStr),
               let investigatorId = data["investigatorId"] as? String,
               let timestamp = data["timestamp"] as? TimeInterval {
                let result = InvestigationResult(
                    targetPlayerId: targetPlayerId,
                    targetRole: targetRole,
                    targetTeam: targetTeam,
                    investigatorId: investigatorId,
                    timestamp: timestamp
                )
                onInvestigationResult?(result)
            }
            
        case "hunter_elimination":
            if let hunterId = data["hunterId"] as? String,
               let targetId = data["targetId"] as? String,
               let timestamp = data["timestamp"] as? TimeInterval {
                let elimination = HunterElimination(
                    hunterId: hunterId,
                    targetId: targetId,
                    timestamp: timestamp
                )
                onHunterElimination?(elimination)
            }
            
        default:
            print("Unhandled event: \(event)")
        }
    }
    
    // MARK: - Parsing Helpers
    
    private func parseGameState(_ dict: [String: Any]) -> GameState? {
        guard let id = dict["id"] as? String,
              let code = dict["code"] as? String,
              let phaseStr = dict["phase"] as? String,
              let settingsDict = dict["settings"] as? [String: Any],
              let playersArray = dict["players"] as? [[String: Any]],
              let tasksArray = dict["tasks"] as? [[String: Any]] else {
            return nil
        }
        
        let phase = GamePhase(rawValue: phaseStr) ?? .lobby
        let players = playersArray.compactMap { parsePlayer($0) }
        let tasks = tasksArray.compactMap { parseTask($0) }
        
        let settings = GameState.GameSettings(
            mapId: settingsDict["mapId"] as? String ?? "map1",
            playerCount: settingsDict["playerCount"] as? Int ?? 4,
            dogCount: settingsDict["dogCount"] as? Int ?? 1,
            foxCount: settingsDict["foxCount"] as? Int ?? 0,
            detectiveCount: settingsDict["detectiveCount"] as? Int ?? 0,
            hunterCount: settingsDict["hunterCount"] as? Int ?? 0,
            taskCount: settingsDict["taskCount"] as? Int ?? 10,
            votingTime: settingsDict["votingTime"] as? Int ?? 30000,
            discussionTime: settingsDict["discussionTime"] as? Int ?? 60000
        )
        
        return GameState(id: id, code: code, phase: phase, players: players, tasks: tasks, settings: settings)
    }
    
    private func parsePlayer(_ dict: [String: Any]) -> Player? {
        guard let id = dict["id"] as? String,
              let username = dict["username"] as? String,
              let isAlive = dict["isAlive"] as? Bool,
              let posDict = dict["position"] as? [String: Double],
              let tasksCompleted = dict["tasksCompleted"] as? Int,
              let isHost = dict["isHost"] as? Bool else {
            return nil
        }
        
        let role = (dict["role"] as? String).flatMap { PlayerRole(rawValue: $0) }
        let position = Player.Position(x: posDict["x"] ?? 0, y: posDict["y"] ?? 0)
        let investigationsRemaining = dict["investigationsRemaining"] as? Int
        let hasUsedHunterAbility = dict["hasUsedHunterAbility"] as? Bool
        
        return Player(
            id: id,
            username: username,
            role: role,
            isAlive: isAlive,
            position: position,
            tasksCompleted: tasksCompleted,
            isHost: isHost,
            investigationsRemaining: investigationsRemaining,
            hasUsedHunterAbility: hasUsedHunterAbility
        )
    }
    
    private func parseTask(_ dict: [String: Any]) -> Task? {
        guard let id = dict["id"] as? String,
              let name = dict["name"] as? String,
              let description = dict["description"] as? String,
              let type = dict["type"] as? String,
              let isCompleted = dict["isCompleted"] as? Bool,
              let locDict = dict["location"] as? [String: Double] else {
            return nil
        }
        
        let location = Task.Position(x: locDict["x"] ?? 0, y: locDict["y"] ?? 0)
        return Task(id: id, name: name, description: description, type: type, isCompleted: isCompleted, location: location)
    }
}

// MARK: - WebSocketDelegate

extension SocketManager: WebSocketDelegate {
    func didReceive(event: Starscream.WebSocketEvent, client: Starscream.WebSocketClient) {
        switch event {
        case .connected(_):
            print("WebSocket connected")
            onConnect?()
            
        case .disconnected(_, _):
            print("WebSocket disconnected")
            onDisconnect?()
            
        case .text(let text):
            handleTextMessage(text)
            
        case .binary(_):
            break
            
        case .ping(_):
            break
            
        case .pong(_):
            break
            
        case .viabilityChanged(_):
            break
            
        case .reconnectSuggested(_):
            break
            
        case .cancelled:
            print("WebSocket cancelled")
            
        case .error(let error):
            print("WebSocket error: \(error?.localizedDescription ?? "Unknown")")
            onError?(error?.localizedDescription ?? "Connection error")
            
        @unknown default:
            break
        }
    }
    
    private func handleTextMessage(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }
        
        do {
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let event = json["event"] as? String,
               let eventData = json["data"] as? [String: Any] {
                handleEvent(event, data: eventData)
            }
        } catch {
            print("Failed to parse message: \(error)")
        }
    }
}

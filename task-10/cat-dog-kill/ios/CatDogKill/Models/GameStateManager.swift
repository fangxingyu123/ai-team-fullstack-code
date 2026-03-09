//
//  GameStateManager.swift
//  CatDogKill
//
//  游戏状态管理
//

import Foundation
import Combine

enum GamePhase: String, Codable {
    case lobby = "lobby"
    case starting = "starting"
    case playing = "playing"
    case meeting = "meeting"
    case ended = "ended"
}

enum PlayerRole: String, Codable {
    case cat = "cat"
    case dog = "dog"
    case fox = "fox"
    case detective = "detective"
    case hunter = "hunter"
    
    var displayName: String {
        switch self {
        case .cat: return "猫咪"
        case .dog: return "狗狗"
        case .fox: return "狐狸"
        case .detective: return "侦探"
        case .hunter: return "猎人"
        }
    }
    
    var icon: String {
        switch self {
        case .cat: return "🐱"
        case .dog: return "🐶"
        case .fox: return "🦊"
        case .detective: return "🕵️"
        case .hunter: return "🎯"
        }
    }
    
    var team: PlayerTeam {
        switch self {
        case .cat, .detective, .hunter: return .good
        case .dog: return .bad
        case .fox: return .neutral
        }
    }
    
    var hasAbility: Bool {
        switch self {
        case .dog, .fox, .detective, .hunter: return true
        case .cat: return false
        }
    }
    
    var abilityDescription: String {
        switch self {
        case .cat: return "完成任务，找出卧底"
        case .dog: return "可以发动破坏"
        case .fox: return "存活到最后单独胜利"
        case .detective: return "每轮会议可调查一人身份"
        case .hunter: return "死亡时可淘汰一名玩家"
        }
    }
}

enum PlayerTeam: String, Codable {
    case good = "good"
    case bad = "bad"
    case neutral = "neutral"
    
    var displayName: String {
        switch self {
        case .good: return "好人阵营"
        case .bad: return "坏人阵营"
        case .neutral: return "中立阵营"
        }
    }
    
    var color: String {
        switch self {
        case .good: return "#4A90E2"
        case .bad: return "#E74C3C"
        case .neutral: return "#F39C12"
        }
    }
}

struct Player: Identifiable, Codable {
    let id: String
    let username: String
    var role: PlayerRole?
    var isAlive: Bool
    var position: Position
    var tasksCompleted: Int
    var isHost: Bool
    // Special abilities
    var investigationsRemaining: Int?
    var hasUsedHunterAbility: Bool?
    
    struct Position: Codable {
        let x: Double
        let y: Double
    }
    
    var canUseAbility: Bool {
        guard let role = role else { return false }
        switch role {
        case .detective:
            return (investigationsRemaining ?? 0) > 0
        case .hunter:
            return !(hasUsedHunterAbility ?? false)
        default:
            return false
        }
    }
}

struct Task: Identifiable, Codable {
    let id: String
    let name: String
    let description: String
    let type: String
    var isCompleted: Bool
    let location: Position
    
    struct Position: Codable {
        let x: Double
        let y: Double
    }
}

struct GameState: Codable {
    let id: String
    let code: String
    let phase: GamePhase
    var players: [Player]
    var tasks: [Task]
    let settings: GameSettings
    
    struct GameSettings: Codable {
        let mapId: String
        let playerCount: Int
        let dogCount: Int
        let foxCount: Int
        let detectiveCount: Int
        let hunterCount: Int
        let taskCount: Int
        let votingTime: Int
        let discussionTime: Int
    }
}

struct InvestigationResult: Codable {
    let targetPlayerId: String
    let targetRole: PlayerRole
    let targetTeam: PlayerTeam
    let investigatorId: String
    let timestamp: TimeInterval
}

struct HunterElimination: Codable {
    let hunterId: String
    let targetId: String
    let timestamp: TimeInterval
}

@MainActor
class GameStateManager: ObservableObject {
    @Published var currentGame: GameState?
    @Published var myRole: PlayerRole?
    @Published var myPlayer: Player?
    @Published var roomCode: String = ""
    @Published var errorMessage: String?
    @Published var isConnected: Bool = false
    
    private var socketManager: SocketManager?
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        setupSocket()
    }
    
    private func setupSocket() {
        socketManager = SocketManager()
        
        socketManager?.onConnect { [weak self] in
            self?.isConnected = true
            self?.errorMessage = nil
        }
        
        socketManager?.onDisconnect { [weak self] in
            self?.isConnected = false
        }
        
        socketManager?.onRoomCreated { [weak self] roomCode, gameId in
            self?.roomCode = roomCode
        }
        
        socketManager?.onRoomJoined { [weak self] game, player in
            self?.currentGame = game
            self?.myPlayer = player
        }
        
        socketManager?.onGameStarted { [weak self] role, players in
            self?.myRole = role
            if let game = self?.currentGame {
                self?.currentGame = GameState(
                    id: game.id,
                    code: game.code,
                    phase: .playing,
                    players: players,
                    tasks: game.tasks,
                    settings: game.settings
                )
            }
        }
        
        socketManager?.onGameStateUpdate { [weak self] game in
            self?.currentGame = game
        }
        
        socketManager?.onMeetingStarted { deadPlayer in
            // Handle meeting start
        }
        
        socketManager?.onVotingResult { ejectedPlayer, skipped in
            // Handle voting result
        }
        
        socketManager?.onGameEnded { winner in
            // Handle game end
        }
        
        socketManager?.onInvestigationResult { result in
            // Handle investigation result (detective ability)
            print("🔍 Investigated player \(result.targetPlayerId): \(result.targetRole)")
        }
        
        socketManager?.onHunterElimination { elimination in
            // Handle hunter elimination
            print("🎯 Hunter \(elimination.hunterId) eliminated \(elimination.targetId)")
        }
        
        socketManager?.onError { [weak self] message in
            self?.errorMessage = message
        }
    }
    
    func connect() {
        socketManager?.connect()
    }
    
    func disconnect() {
        socketManager?.disconnect()
    }
    
    func createRoom(username: String, settings: GameSettings) {
        socketManager?.createRoom(username: username, settings: settings)
    }
    
    func joinRoom(roomCode: String, username: String) {
        socketManager?.joinRoom(roomCode: roomCode, username: username)
    }
    
    func leaveRoom() {
        socketManager?.leaveRoom()
        currentGame = nil
        myRole = nil
        myPlayer = nil
        roomCode = ""
    }
    
    func startGame() {
        socketManager?.startGame()
    }
    
    func movePlayer(x: Double, y: Double) {
        socketManager?.movePlayer(x: x, y: y)
    }
    
    func completeTask(taskId: String) {
        socketManager?.completeTask(taskId: taskId)
    }
    
    func emergencyMeeting() {
        socketManager?.emergencyMeeting()
    }
    
    func castVote(targetId: String?) {
        socketManager?.castVote(targetId: targetId)
    }
    
    func sendChatMessage(_ message: String) {
        socketManager?.sendChatMessage(message)
    }
    
    func performSabotage(type: SabotageType) {
        socketManager?.performSabotage(type: type)
    }
    
    func investigate(targetId: String) {
        socketManager?.investigate(targetId: targetId)
    }
    
    func hunterEliminate(targetId: String) {
        socketManager?.hunterEliminate(targetId: targetId)
    }
}

enum SabotageType: String {
    case lockDoors = "lock_doors"
    case disableLights = "disable_lights"
    case disableComms = "disable_comms"
    case speedBoost = "speed_boost"
}

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
}

struct Player: Identifiable, Codable {
    let id: String
    let username: String
    var role: PlayerRole?
    var isAlive: Bool
    var position: Position
    var tasksCompleted: Int
    var isHost: Bool
    
    struct Position: Codable {
        let x: Double
        let y: Double
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
        let taskCount: Int
    }
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
}

enum SabotageType: String {
    case lockDoors = "lock_doors"
    case disableLights = "disable_lights"
    case disableComms = "disable_comms"
    case speedBoost = "speed_boost"
}

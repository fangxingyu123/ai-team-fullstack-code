//
//  LeaderboardViewModel.swift
//  CatDogKill
//
//  排行榜视图模型
//

import Foundation
import Combine

@MainActor
class LeaderboardViewModel: ObservableObject {
    @Published var leaderboard: [LeaderboardPlayer] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var playerRank: PlayerRankResponse?
    
    private let manager: LeaderboardManager
    private var cancellables = Set<AnyCancellable>()
    
    init(manager: LeaderboardManager = .shared) {
        self.manager = manager
    }
    
    // MARK: - Public Methods
    
    /// 加载排行榜数据
    func loadLeaderboard(limit: Int = 100) async {
        isLoading = true
        errorMessage = nil
        
        do {
            leaderboard = try await manager.getLeaderboard(limit: limit)
        } catch {
            errorMessage = error.localizedDescription
            leaderboard = []
        }
        
        isLoading = false
    }
    
    /// 加载玩家自己的排名
    func loadPlayerRank(userId: String) async {
        do {
            playerRank = try await manager.getPlayerRank(userId: userId)
        } catch {
            print("Failed to load player rank: \(error)")
            playerRank = nil
        }
    }
    
    /// 刷新数据
    func refresh() async {
        await loadLeaderboard()
    }
    
    // MARK: - Helper Methods
    
    /// 获取排名对应的颜色
    func rankColor(for rank: Int) -> Color {
        switch rank {
        case 1: return Color.yellow
        case 2: return Color.gray
        case 3: return Color.orange
        default: return Color.blue.opacity(0.3)
        }
    }
    
    /// 获取胜率对应的颜色
    func winRateColor(for winRate: Double) -> Color {
        if winRate >= 0.7 {
            return .green
        } else if winRate >= 0.5 {
            return .blue
        } else if winRate >= 0.3 {
            return .orange
        } else {
            return .red
        }
    }
}

//
//  Achievement.swift
//  CatDogKill
//
// 成就系统模型
//

import Foundation

// 成就类别
enum AchievementCategory: String, Codable, CaseIterable {
    case victory = "victory"      // 胜利
    case tasks = "tasks"          // 任务
    case social = "social"        // 社交
    case role = "role"            // 角色
    case streak = "streak"        // 连胜
    case collection = "collection" // 收集
    case special = "special"      // 特殊
    
    var localizedName: String {
        switch self {
        case .victory: return "胜利"
        case .tasks: return "任务"
        case .social: return "社交"
        case .role: return "角色"
        case .streak: return "连胜"
        case .collection: return "收集"
        case .special: return "特殊"
        }
    }
    
    var icon: String {
        switch self {
        case .victory: return "🏆"
        case .tasks: return "📋"
        case .social: return "💬"
        case .role: return "🎭"
        case .streak: return "🔥"
        case .collection: return "📦"
        case .special: return "⭐"
        }
    }
}

// 成就难度
enum AchievementDifficulty: String, Codable {
    case easy = "easy"           // 简单
    case medium = "medium"       // 中等
    case hard = "hard"           // 困难
    case legendary = "legendary" // 传奇
    
    var localizedName: String {
        switch self {
        case .easy: return "简单"
        case .medium: return "中等"
        case .hard: return "困难"
        case .legendary: return "传奇"
        }
    }
    
    var color: String {
        switch self {
        case .easy: return "34C759"    // 绿色
        case .medium: return "007AFF"  // 蓝色
        case .hard: return "FF9500"    // 橙色
        case .legendary: return "AF52DE" // 紫色
        }
    }
}

// 成就条件类型
enum ConditionType: String, Codable {
    case wins = "wins"
    case losses = "losses"
    case gamesPlayed = "games_played"
    case tasksCompleted = "tasks_completed"
    case correctVotes = "correct_votes"
    case dogWins = "dog_wins"
    case catWins = "cat_wins"
    case foxWins = "fox_wins"
    case winStreak = "win_streak"
    case loseStreak = "lose_streak"
    case meetingsCalled = "meetings_called"
    case sabotages = "sabotages"
    case investigations = "investigations"
    case hunterKills = "hunter_kills"
    case survivals = "survivals"
    case perfectTasks = "perfect_tasks"
    case speedVictory = "speed_victory"
    case comeback = "comeback"
}

// 成就定义
struct Achievement: Codable, Identifiable {
    let achievementId: String
    let name: String
    let description: String
    let icon: String
    let category: AchievementCategory
    let difficulty: AchievementDifficulty
    let conditionType: ConditionType
    let conditionTarget: Int
    let points: Int
    let isHidden: Bool
    
    var id: String { achievementId }
    
    // 难度颜色
    var difficultyColor: String {
        difficulty.color
    }
}

// 成就进度
struct AchievementProgress: Codable, Identifiable {
    let achievementId: String
    let unlocked: Bool
    let progress: Int
    let unlockedAt: Date?
    
    var id: String { achievementId }
}

// 成就类别信息
struct AchievementCategoryInfo: Codable, Identifiable {
    let id: String
    let label: String
    let count: Int
    
    var category: AchievementCategory? {
        AchievementCategory(rawValue: id)
    }
}

// 用户成就数据
struct UserAchievements: Codable {
    let achievements: [Achievement]
    let progress: [AchievementProgress]
    let totalPoints: Int
    let unlockedCount: Int
    let totalCount: Int
    let completionRate: Int
    
    // 计算某个成就的进度
    func getProgress(for achievementId: String) -> AchievementProgress? {
        progress.first { $0.achievementId == achievementId }
    }
    
    // 是否已解锁某个成就
    func isUnlocked(_ achievementId: String) -> Bool {
        progress.first { $0.achievementId == achievementId }?.unlocked ?? false
    }
    
    // 按类别分组成就
    func groupedByCategory() -> [AchievementCategory: [Achievement]] {
        var grouped: [AchievementCategory: [Achievement]] = [:]
        for achievement in achievements {
            if grouped[achievement.category] == nil {
                grouped[achievement.category] = []
            }
            grouped[achievement.category]?.append(achievement)
        }
        return grouped
    }
}

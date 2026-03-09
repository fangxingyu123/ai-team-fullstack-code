//
//  AchievementsView.swift
//  CatDogKill
//
// 成就系统界面
//

import SwiftUI

struct AchievementsView: View {
    @StateObject private var achievementManager = AchievementManager.shared
    @State private var selectedCategory: AchievementCategory? = nil
    @State private var showingUnlockedOnly = false
    
    var body: some View {
        NavigationView {
            Group {
                if achievementManager.isLoading {
                    loadingView
                } else if let userAchievements = achievementManager.userAchievements {
                    achievementList(userAchievements)
                } else {
                    errorView
                }
            }
            .navigationTitle("🏆 成就")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    filterButton
                }
            }
            .onAppear {
                Task {
                    await achievementManager.fetchUserAchievements()
                }
            }
        }
    }
    
    // MARK: - Loading View
    private var loadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
            Text("加载成就中...")
                .foregroundColor(.secondary)
        }
    }
    
    // MARK: - Error View
    private var errorView: some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 50))
                .foregroundColor(.orange)
            
            Text("加载失败")
                .font(.headline)
            
            if let errorMessage = achievementManager.errorMessage {
                Text(errorMessage)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            Button("重试") {
                Task {
                    await achievementManager.fetchUserAchievements()
                }
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
    
    // MARK: - Achievement List
    private func achievementList(_ userAchievements: UserAchievements) -> some View {
        VStack(spacing: 0) {
            // 成就概览卡片
            achievementOverviewCard(userAchievements)
            
            // 类别筛选
            categoryFilter(userAchievements)
            
            // 成就列表
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(filteredAchievements(userAchievements)) { achievement in
                        AchievementRowView(
                            achievement: achievement,
                            progress: userAchievements.getProgress(for: achievement.id),
                            isUnlocked: userAchievements.isUnlocked(achievement.id)
                        )
                    }
                }
                .padding()
            }
        }
    }
    
    // MARK: - Overview Card
    private func achievementOverviewCard(_ userAchievements: UserAchievements) -> some View {
        VStack(spacing: 12) {
            HStack(spacing: 20) {
                // 总点数
                VStack {
                    Text("\(userAchievements.totalPoints)")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.blue, .purple],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    Text("成就点数")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Divider()
                    .frame(height: 40)
                
                // 完成度
                VStack {
                    Text("\(userAchievements.completionRate)%")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.green, .blue],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    Text("完成率")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Divider()
                    .frame(height: 40)
                
                // 解锁数量
                VStack {
                    Text("\(userAchievements.unlockedCount)/\(userAchievements.totalCount)")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundColor(.primary)
                    Text("已解锁")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
            
            // 进度条
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 8)
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(
                            LinearGradient(
                                colors: [.green, .blue],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geometry.size.width * CGFloat(userAchievements.completionRate) / 100, height: 8)
                }
            }
            .frame(height: 8)
            .padding(.horizontal)
        }
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 4)
        )
        .padding()
    }
    
    // MARK: - Category Filter
    private func categoryFilter(_ userAchievements: UserAchievements) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                // 全部
                FilterChip(
                    title: "全部",
                    icon: "📋",
                    count: userAchievements.totalCount,
                    isSelected: selectedCategory == nil
                ) {
                    selectedCategory = nil
                }
                
                // 各个类别
                ForEach(AchievementCategory.allCases) { category in
                    let count = userAchievements.groupedByCategory()[category]?.count ?? 0
                    if count > 0 {
                        FilterChip(
                            title: category.localizedName,
                            icon: category.icon,
                            count: count,
                            isSelected: selectedCategory == category
                        ) {
                            selectedCategory = category
                        }
                    }
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
    }
    
    // MARK: - Filter Button
    private var filterButton: some View {
        Button(action: {
            showingUnlockedOnly.toggle()
        }) {
            Image(systemName: showingUnlockedOnly ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 20))
        }
    }
    
    // MARK: - Filtered Achievements
    private func filteredAchievements(_ userAchievements: UserAchievements) -> [Achievement] {
        var achievements = userAchievements.achievements
        
        // 按解锁状态筛选
        if showingUnlockedOnly {
            achievements = achievements.filter { userAchievements.isUnlocked($0.id) }
        }
        
        // 按类别筛选
        if let selectedCategory = selectedCategory {
            achievements = achievements.filter { $0.category == selectedCategory }
        }
        
        return achievements
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let title: String
    let icon: String
    let count: Int
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Text(icon)
                Text(title)
                Text("(\(count))")
                    .font(.caption)
            }
            .font(.subheadline)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(isSelected ? Color.blue : Color.gray.opacity(0.1))
            )
            .foregroundColor(isSelected ? .white : .primary)
        }
    }
}

// MARK: - Achievement Row View
struct AchievementRowView: View {
    let achievement: Achievement
    let progress: AchievementProgress?
    let isUnlocked: Bool
    
    var body: some View {
        HStack(spacing: 12) {
            // 图标
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: isUnlocked ?
                                [Color(hex: achievement.difficultyColor), Color(hex: achievement.difficultyColor).opacity(0.5)] :
                                [Color.gray.opacity(0.3), Color.gray.opacity(0.1)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 56, height: 56)
                
                Text(achievement.icon)
                    .font(.system(size: 28))
            }
            
            // 信息
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(achievement.name)
                        .font(.headline)
                    
                    if isUnlocked {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.caption)
                    }
                    
                    Spacer()
                    
                    // 点数
                    HStack(spacing: 2) {
                        Image(systemName: "star.fill")
                            .font(.caption)
                        Text("+\(achievement.points)")
                            .font(.caption)
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.orange)
                }
                
                Text(achievement.description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                // 进度条
                if !isUnlocked, let progress = progress {
                    VStack(spacing: 4) {
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(Color.gray.opacity(0.2))
                                    .frame(height: 4)
                                
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(Color.blue)
                                    .frame(
                                        width: geometry.size.width * min(CGFloat(progress.progress) / CGFloat(achievement.conditionTarget), 1),
                                        height: 4
                                    )
                            }
                        }
                        .frame(height: 4)
                        
                        HStack {
                            Text("进度：\(progress.progress)/\(achievement.conditionTarget)")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            
                            Spacer()
                            
                            Text(achievement.difficulty.localizedName)
                                .font(.caption2)
                                .foregroundColor(Color(hex: achievement.difficultyColor))
                        }
                    }
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
        )
        .opacity(isUnlocked ? 1.0 : 0.7)
    }
}

// MARK: - Color Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Preview
struct AchievementsView_Previews: PreviewProvider {
    static var previews: some View {
        AchievementsView()
    }
}

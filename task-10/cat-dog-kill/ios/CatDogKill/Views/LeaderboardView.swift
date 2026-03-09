//
//  LeaderboardView.swift
//  CatDogKill
//
//  排行榜界面
//

import SwiftUI

/// 排行榜主视图
struct LeaderboardView: View {
    @StateObject private var viewModel = LeaderboardViewModel()
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            Group {
                if viewModel.isLoading && viewModel.leaderboard.isEmpty {
                    LoadingView()
                } else if viewModel.leaderboard.isEmpty {
                    EmptyLeaderboardView()
                } else {
                    LeaderboardListView(viewModel: viewModel)
                }
            }
            .navigationTitle("排行榜")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("关闭") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        Task {
                            await viewModel.refresh()
                        }
                    }) {
                        Image(systemName: "arrow.clockwise")
                            .rotationEffect(.degrees(viewModel.isLoading ? 360 : 0))
                            .animation(viewModel.isLoading ? .linear(duration: 1).repeatForever(autoreverses: false) : .default, value: viewModel.isLoading)
                    }
                    .disabled(viewModel.isLoading)
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .task {
                await viewModel.loadLeaderboard()
            }
        }
    }
}

// MARK: - 排行榜列表视图

struct LeaderboardListView: View {
    @ObservedObject var viewModel: LeaderboardViewModel
    
    var body: some View {
        List(viewModel.leaderboard) { player in
            LeaderboardRowView(player: player, winRateColor: viewModel.winRateColor(for: player.winRate))
        }
        .listStyle(.plain)
    }
}

// MARK: - 排行榜行视图

struct LeaderboardRowView: View {
    let player: LeaderboardPlayer
    let winRateColor: Color
    
    var body: some View {
        HStack(spacing: 16) {
            // 排名
            Text(player.rankBadge)
                .font(.title2)
                .fontWeight(.bold)
                .frame(width: 40)
            
            // 玩家头像和信息
            HStack(spacing: 12) {
                // 头像
                Circle()
                    .fill(rankColor(for: player.rank))
                    .frame(width: 44, height: 44)
                    .overlay(
                        Text(player.username.prefix(1).uppercased())
                            .font(.headline)
                            .foregroundColor(.white)
                    )
                
                // 玩家信息
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(player.username)
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        // 等级徽章
                        Text("Lv.\(player.level)")
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(Color.blue.opacity(0.2))
                            .foregroundColor(.blue)
                            .cornerRadius(10)
                    }
                    
                    HStack(spacing: 12) {
                        Label(player.wins.formatted(), systemImage: "trophy.fill")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Label(player.winRatePercent, systemImage: "chart.bar.fill")
                            .font(.caption)
                            .foregroundColor(winRateColor)
                    }
                }
            }
            
            Spacer()
            
            // 游戏场次
            VStack(alignment: .trailing) {
                Text("\(player.gamesPlayed)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("场")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 8)
    }
    
    private func rankColor(for rank: Int) -> Color {
        switch rank {
        case 1: return Color.yellow
        case 2: return Color.gray
        case 3: return Color.orange
        default: return Color.blue.opacity(0.3)
        }
    }
}

// MARK: - 空状态视图

struct EmptyLeaderboardView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "trophy")
                .font(.system(size: 60))
                .foregroundColor(.gray.opacity(0.5))
            
            Text("暂无数据")
                .font(.headline)
                .foregroundColor(.primary)
            
            Text("排行榜数据加载中")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.top, 100)
    }
}

// MARK: - 加载视图

struct LoadingView: View {
    var body: some View {
        VStack {
            ProgressView()
                .scaleEffect(1.5)
            Text("加载中...")
                .foregroundColor(.secondary)
                .padding(.top)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Preview

#Preview {
    LeaderboardView()
}

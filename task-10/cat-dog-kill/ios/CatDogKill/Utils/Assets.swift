//
//  Assets.swift
//  CatDogKill
//
//  资源文件入口
//

import SwiftUI

// MARK: - 颜色资源

extension Color {
    // 主色调
    static let brandPrimary = Color(red: 0/255, green: 122/255, blue: 255/255)
    
    // 阵营颜色
    static let catColor = Color(red: 52/255, green: 199/255, blue: 89/255)
    static let dogColor = Color(red: 255/255, green: 59/255, blue: 48/255)
    static let foxColor = Color(red: 175/255, green: 82/255, blue: 222/255)
    
    // 背景颜色
    static let backgroundDark = Color(red: 28/255, green: 28/255, blue: 30/255)
    static let cardBackground = Color(red: 44/255, green: 44/255, blue: 46/255)
    
    // 文字颜色
    static let textPrimary = Color.white
    static let textSecondary = Color(red: 142/255, green: 142/255, blue: 147/255)
    
    // 功能颜色
    static let successColor = Color.green
    static let warningColor = Color.orange
    static let errorColor = Color.red
}

// MARK: - 图片资源

extension Image {
    // 角色图标
    static let catIcon = Image(systemName: "cat.fill")
    static let dogIcon = Image(systemName: "dog.fill")
    static let foxIcon = Image(systemName: "fox.fill")
    
    // 游戏图标
    static let taskIcon = Image(systemName: "checkmark.circle")
    static let sabotageIcon = Image(systemName: "bolt.fill")
    static let meetingIcon = Image(systemName: "exclamationmark.triangle.fill")
    static let reportIcon = Image(systemName: "megaphone.fill")
    
    // 导航图标
    static let homeIcon = Image(systemName: "house")
    static let roomIcon = Image(systemName: "door.left.hand.open")
    static let profileIcon = Image(systemName: "person")
}

// MARK: - 字体资源

extension Font {
    static let gameTitle = Font.system(size: 34, weight: .bold, design: .rounded)
    static let sectionHeader = Font.system(size: 22, weight: .semibold, design: .rounded)
    static let buttonLabel = Font.system(size: 17, weight: .semibold, design: .rounded)
}

// MARK: - 间距资源

struct Spacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
}

// MARK: - 圆角资源

struct CornerRadius {
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 20
    static let xl: CGFloat = 30
}

//
//  CatDogKillApp.swift
//  猫狗杀 - 多人联机社交推理游戏
//
//  Created on 2026-03-06
//

import SwiftUI

@main
struct CatDogKillApp: App {
    @StateObject private var gameState = GameStateManager()
    @StateObject private var authManager = AuthManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(gameState)
                .environmentObject(authManager)
        }
    }
}

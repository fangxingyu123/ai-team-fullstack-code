//
//  AuthManager.swift
//  CatDogKill
//
//  用户认证管理
//

import Foundation
import Combine

struct User: Codable {
    let id: String
    let username: String
    let email: String
    let avatar: String?
    let level: Int
    let wins: Int
    let losses: Int
    let gamesPlayed: Int
    let achievementPoints: Int?
}

struct AuthResponse: Codable {
    let token: String
    let user: User
}

@MainActor
class AuthManager: ObservableObject {
    @Published var currentUser: User?
    @Published var authToken: String?
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var isAuthenticated: Bool = false
    
    private let baseURL: String
    private let storageKey = "cat_dog_kill_auth_token"
    
    init(baseURL: String = "http://localhost:3000") {
        self.baseURL = baseURL
        loadStoredToken()
    }
    
    // MARK: - Public Methods
    
    func register(username: String, email: String, password: String) async -> Bool {
        isLoading = true
        errorMessage = nil
        
        guard let url = URL(string: "\(baseURL)/api/auth/register") else {
            errorMessage = "Invalid URL"
            isLoading = false
            return false
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: String] = [
            "username": username,
            "email": email,
            "password": password
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                errorMessage = "Invalid response"
                isLoading = false
                return false
            }
            
            if httpResponse.statusCode == 201 {
                let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)
                handleAuthSuccess(authResponse)
                isLoading = false
                return true
            } else {
                let error = try JSONSerialization.jsonObject(with: data) as? [String: String]
                errorMessage = error?["message"] ?? "Registration failed"
                isLoading = false
                return false
            }
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }
    
    func login(email: String, password: String) async -> Bool {
        isLoading = true
        errorMessage = nil
        
        guard let url = URL(string: "\(baseURL)/api/auth/login") else {
            errorMessage = "Invalid URL"
            isLoading = false
            return false
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: String] = [
            "email": email,
            "password": password
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                errorMessage = "Invalid response"
                isLoading = false
                return false
            }
            
            if httpResponse.statusCode == 200 {
                let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)
                handleAuthSuccess(authResponse)
                isLoading = false
                return true
            } else {
                let error = try JSONSerialization.jsonObject(with: data) as? [String: String]
                errorMessage = error?["message"] ?? "Login failed"
                isLoading = false
                return false
            }
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }
    
    func logout() {
        currentUser = nil
        authToken = nil
        isAuthenticated = false
        UserDefaults.standard.removeObject(forKey: storageKey)
        
        // 清除成就管理器的认证令牌
        AchievementManager.shared.clearAuthToken()
    }
    
    func updateStats(won: Bool) async {
        guard let token = authToken else { return }
        
        guard let url = URL(string: "\(baseURL)/api/auth/update-stats") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let body: [String: Bool] = ["won": won]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            let (_, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else { return }
            
            // Update local user stats if needed
        } catch {
            print("Failed to update stats: \(error)")
        }
    }
    
    // MARK: - Private Methods
    
    private func handleAuthSuccess(_ response: AuthResponse) {
        authToken = response.token
        currentUser = response.user
        isAuthenticated = true
        saveToken(response.token)
        
        // 设置成就管理器的认证令牌
        AchievementManager.shared.setAuthToken(response.token)
    }
    
    private func saveToken(_ token: String) {
        UserDefaults.standard.set(token, forKey: storageKey)
    }
    
    private func loadStoredToken() {
        if let token = UserDefaults.standard.string(forKey: storageKey) {
            authToken = token
            // Could validate token here by fetching user profile
        }
    }
    
    private func getAuthHeader() -> [String: String] {
        guard let token = authToken else { return [:] }
        return ["Authorization": "Bearer \(token)"]
    }
}

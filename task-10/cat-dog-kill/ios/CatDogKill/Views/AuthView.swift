//
//  AuthView.swift
//  CatDogKill
//
//  登录注册界面
//

import SwiftUI

struct AuthView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var showingLogin = true
    @State private var email = ""
    @State private var password = ""
    @State private var username = ""
    @State private var confirmPassword = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                // Logo
                VStack(spacing: 10) {
                    Text("🐱🐶")
                        .font(.system(size: 80))
                    Text("猫狗杀")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    Text("多人联机社交推理游戏")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 60)
                
                Spacer()
                
                // Form
                VStack(spacing: 20) {
                    if showingLogin {
                        // Login Form
                        TextField("邮箱", text: $email)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                        
                        SecureField("密码", text: $password)
                            .textFieldStyle(.roundedBorder)
                        
                        if let error = authManager.errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                        
                        Button(action: login) {
                            Text("登录")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(authManager.isLoading ? Color.gray : Color.blue)
                                .cornerRadius(12)
                        }
                        .disabled(authManager.isLoading || email.isEmpty || password.isEmpty)
                        
                        Button(action: { showingLogin = false }) {
                            Text("没有账号？注册")
                                .foregroundColor(.blue)
                        }
                    } else {
                        // Register Form
                        TextField("昵称", text: $username)
                            .textFieldStyle(.roundedBorder)
                        
                        TextField("邮箱", text: $email)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                        
                        SecureField("密码", text: $password)
                            .textFieldStyle(.roundedBorder)
                        
                        SecureField("确认密码", text: $confirmPassword)
                            .textFieldStyle(.roundedBorder)
                        
                        if let error = authManager.errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                        
                        Button(action: register) {
                            Text("注册")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(authManager.isLoading ? Color.gray : Color.blue)
                                .cornerRadius(12)
                        }
                        .disabled(authManager.isLoading || username.isEmpty || email.isEmpty || password.isEmpty)
                        
                        Button(action: { showingLogin = true }) {
                            Text("已有账号？登录")
                                .foregroundColor(.blue)
                        }
                    }
                }
                .padding(.horizontal, 40)
                
                Spacer()
                
                // Guest Play
                Button(action: guestPlay) {
                    Text("游客模式")
                        .foregroundColor(.secondary)
                }
                .padding(.bottom, 40)
            }
            .navigationTitle("")
            .navigationBarHidden(true)
        }
    }
    
    private func login() {
        Task {
            await authManager.login(email: email, password: password)
        }
    }
    
    private func register() {
        guard password == confirmPassword else {
            authManager.errorMessage = "两次输入的密码不一致"
            return
        }
        
        Task {
            await authManager.register(username: username, email: email, password: password)
        }
    }
    
    private func guestPlay() {
        // Guest play - skip authentication
        authManager.isAuthenticated = true
    }
}

#Preview {
    AuthView()
        .environmentObject(AuthManager())
}

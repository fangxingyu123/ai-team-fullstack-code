# 🎮 打地鼠小游戏

经典的打地鼠网页小游戏，纯前端实现，支持桌面端和移动端。

## 🎯 游戏说明

- **目标**：在 30 秒内尽可能多地打中地鼠
- **得分**：每次命中得 10 分，连击可获得倍数奖励
- **连击**：2 秒内连续命中可累积连击，最高 5 倍
- **结束**：时间到后显示最终成绩

## 🚀 快速开始

### 方法 1：直接打开
```bash
# 在浏览器中直接打开 index.html
open index.html  # macOS
start index.html  # Windows
xdg-open index.html  # Linux
```

### 方法 2：本地服务器（推荐）
```bash
# 使用 Python 启动本地服务器
python3 -m http.server 8000

# 或使用 Node.js
npx serve .

# 然后访问 http://localhost:8000
```

## 📱 移动端测试

### 方法 1：局域网访问
1. 确保手机和电脑在同一 WiFi 网络
2. 在电脑上启动本地服务器
3. 查看电脑 IP 地址：
   - macOS/Linux: `ifconfig` 或 `ip addr`
   - Windows: `ipconfig`
4. 在手机浏览器访问：`http://<电脑 IP>:8000`

### 方法 2：Chrome DevTools 模拟
1. 在 Chrome 中打开 `index.html`
2. 按 `F12` 打开开发者工具
3. 按 `Ctrl+Shift+M` 切换设备模拟模式
4. 选择设备型号（如 iPhone 12、Pixel 5）
5. 直接触摸/点击测试

### 方法 3：真实设备测试
- **iOS Safari**：支持触摸事件，测试流畅度
- **Android Chrome**：支持触摸事件，测试响应速度
- **测试要点**：
  - 触摸响应是否及时
  - 地鼠大小是否适合手指点击
  - 布局在小屏幕上是否正常

## 🎨 功能特性

- ✅ 3x3 地鼠洞网格布局
- ✅ 地鼠随机出现/消失动画
- ✅ 锤子光标样式（桌面端）
- ✅ 连击系统和倍数奖励
- ✅ 30 秒倒计时
- ✅ 开始/结束界面
- ✅ 得分飘字动画
- ✅ 击中音效（需添加音频文件）
- ✅ 响应式设计（移动端适配）
- ✅ 触摸优化（移动端）

## 📁 文件结构

```
whack-a-mole/
├── index.html          # HTML 结构
├── styles.css          # CSS 样式与动画
├── script.js           # JavaScript 核心逻辑
├── README.md           # 说明文档
└── sounds/             # 音效文件夹（可选）
    ├── hit.mp3         # 击中音效
    ├── start.mp3       # 开始音效
    └── gameover.mp3    # 结束音效
```

## 🔧 音效文件（可选）

游戏没有音效文件也能正常运行（会静默跳过）。如需添加音效：

1. 准备三个 MP3 文件：
   - `hit.mp3` - 击中地鼠时的音效
   - `start.mp3` - 游戏开始时的音效
   - `gameover.mp3` - 游戏结束时的音效

2. 将文件放入 `sounds/` 文件夹

3. 刷新页面即可听到音效

### 免费音效资源
- [Freesound](https://freesound.org/)
- [ZapSplat](https://www.zapsplat.com/)
- [Mixkit](https://mixkit.co/free-sound-effects/)

## 🎯 性能优化

### 已实现的优化
1. **DOM 缓存**：所有 DOM 元素只查询一次
2. **事件优化**：移动端使用 `touchstart` + `preventDefault` 减少延迟
3. **动画性能**：使用 `transform` 和 `opacity`（GPU 加速）
4. **定时器清理**：游戏结束/重置时清除所有定时器
5. **内存管理**：飘字元素在动画结束后自动移除
6. **配置集中化**：所有参数提取到 `CONFIG` 对象

### 移动端优化
- 禁用双击缩放
- 使用默认触摸光标（更好的触摸体验）
- 增大按钮点击区域
- 响应式布局适配小屏幕

## 🐛 已知问题

无

## 📝 更新日志

### v1.1 (2026-03-05) - Bug 修复
- 🐛 修复计分逻辑问题：添加防御性检查确保游戏状态正确
- 🐛 修复地鼠生成逻辑：添加游戏状态验证防止异常生成
- 🔧 增强调试日志：便于追踪 `currentMoleIndex` 状态变化
- 🔧 添加元素存在性检查：防止地鼠元素缺失导致的问题

### v1.0 (2026-03-04)
- ✅ 完成所有核心功能
- ✅ 添加详细代码注释
- ✅ 性能优化
- ✅ 移动端触摸优化
- ✅ 响应式设计

## 📄 许可证

MIT License

---

**Enjoy the game! 🎮**

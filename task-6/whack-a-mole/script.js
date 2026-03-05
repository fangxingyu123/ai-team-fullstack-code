/* ============================================
   打地鼠小游戏 - JavaScript 核心逻辑
   版本：1.0
   功能：地鼠随机出现、点击事件监听、命中判定、计分系统
   ============================================ */

// ============================================
// 游戏配置常量
// ============================================
const CONFIG = {
    GAME_DURATION: 30,           // 游戏时长（秒）
    BASE_SCORE: 10,              // 基础得分
    MAX_COMBO: 5,                // 最大连击倍数
    COMBO_TIMEOUT: 2000,         // 连击超时时间（毫秒）
    MOLE_SHOW_DURATION: 1500,    // 地鼠停留时间（毫秒）
    HIT_RESPAWN_DELAY: 500,      // 命中后生成新地鼠的延迟（毫秒）
    MISS_RESPAWN_DELAY: 300,     // 地鼠自动缩回后生成新地鼠的延迟（毫秒）
    COMBO_ANIMATION_DURATION: 500 // 连击动画时长（毫秒）
};

// ============================================
// 游戏状态管理
// ============================================
/**
 * 游戏状态对象
 * 存储所有游戏运行时的可变数据
 */
let gameState = {
    score: 0,              // 当前分数
    combo: 1,              // 当前连击倍数
    maxCombo: 1,           // 最高连击记录
    molesHit: 0,           // 命中地鼠总数
    timeLeft: CONFIG.GAME_DURATION,  // 剩余时间（秒）
    isPlaying: false,      // 游戏是否进行中
    moleTimer: null,       // 地鼠出现定时器 ID
    gameTimer: null,       // 游戏倒计时定时器 ID
    currentMoleIndex: -1,  // 当前地鼠位置索引（0-8）
    lastHitTime: 0,        // 上次命中时间戳（用于连击检测）
    comboTimeout: CONFIG.COMBO_TIMEOUT  // 连击超时时间
};

// ============================================
// DOM 元素缓存
// ============================================
/**
 * DOM 元素引用对象
 * 缓存所有需要频繁访问的 DOM 元素，避免重复查询
 * 性能优化：减少 DOM 操作次数
 */
const elements = {
    score: null,
    timer: null,
    combo: null,
    startScreen: null,
    gameOverScreen: null,
    gameGrid: null,
    finalScore: null,
    maxCombo: null,
    molesHit: null,
    startBtn: null,
    restartBtn: null,
    floatingTextContainer: null,
    holes: null,
    hitSound: null,
    startSound: null,
    gameOverSound: null
};

/**
 * 初始化 DOM 元素引用
 * 在 DOM 加载完成后调用，缓存所有元素
 */
function cacheDOMElements() {
    elements.score = document.getElementById('score');
    elements.timer = document.getElementById('timer');
    elements.combo = document.getElementById('combo');
    elements.startScreen = document.getElementById('startScreen');
    elements.gameOverScreen = document.getElementById('gameOverScreen');
    elements.gameGrid = document.getElementById('gameGrid');
    elements.finalScore = document.getElementById('finalScore');
    elements.maxCombo = document.getElementById('maxCombo');
    elements.molesHit = document.getElementById('molesHit');
    elements.startBtn = document.getElementById('startBtn');
    elements.restartBtn = document.getElementById('restartBtn');
    elements.floatingTextContainer = document.getElementById('floatingTextContainer');
    elements.holes = document.querySelectorAll('.hole');
    elements.hitSound = document.getElementById('hitSound');
    elements.startSound = document.getElementById('startSound');
    elements.gameOverSound = document.getElementById('gameOverSound');
}

// ============================================
// 游戏初始化
// ============================================
/**
 * 初始化游戏
 * 绑定所有事件监听器，设置初始状态
 * 在页面加载完成后自动调用
 */
function initGame() {
    // 缓存 DOM 元素
    cacheDOMElements();
    
    // 绑定开始按钮点击事件
    elements.startBtn.addEventListener('click', startGame);
    
    // 绑定重新开始按钮点击事件
    elements.restartBtn.addEventListener('click', startGame);
    
    // 为每个地鼠洞绑定点击事件
    elements.holes.forEach((hole, index) => {
        // 鼠标点击事件（桌面端）
        hole.addEventListener('click', () => handleHoleClick(index));
        
        // 触摸事件（移动端）- 优化触摸响应
        hole.addEventListener('touchstart', (e) => {
            // 阻止默认的触摸行为（防止延迟和滚动）
            e.preventDefault();
            handleHoleClick(index);
        }, { passive: false });
    });
    
    console.log('🎮 打地鼠游戏初始化完成');
}

// ============================================
// 游戏流程控制
// ============================================
/**
 * 开始游戏
 * 重置游戏状态，显示游戏界面，启动所有定时器
 */
function startGame() {
    // 重置游戏状态到初始值
    resetGameState();
    
    // 播放开始音效
    playSound(elements.startSound);
    
    // 切换界面显示：隐藏开始/结束界面，显示游戏网格
    elements.startScreen.style.display = 'none';
    elements.gameOverScreen.style.display = 'none';
    elements.gameGrid.style.display = 'grid';
    
    // 更新 UI 显示（分数、时间、连击）
    updateUI();
    
    // 标记游戏进行中
    gameState.isPlaying = true;
    
    // 启动地鼠随机出现逻辑
    startMoleSpawning();
    
    // 启动游戏倒计时
    startGameTimer();
    
    console.log('🎯 游戏开始！剩余时间：' + gameState.timeLeft + '秒');
}

/**
 * 重置游戏状态
 * 将所有状态变量恢复到初始值
 */
function resetGameState() {
    gameState.score = 0;
    gameState.combo = 1;
    gameState.maxCombo = 1;
    gameState.molesHit = 0;
    gameState.timeLeft = CONFIG.GAME_DURATION;
    gameState.currentMoleIndex = -1;
    gameState.lastHitTime = 0;
    
    // 清除所有定时器（防止多个定时器同时运行）
    if (gameState.moleTimer) {
        clearInterval(gameState.moleTimer);
        gameState.moleTimer = null;
    }
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
        gameState.gameTimer = null;
    }
    
    // 隐藏所有地鼠
    hideAllMoles();
}

/**
 * 结束游戏
 * 停止所有定时器，显示结算界面
 */
function endGame() {
    // 标记游戏结束
    gameState.isPlaying = false;
    
    // 停止所有定时器
    if (gameState.moleTimer) {
        clearInterval(gameState.moleTimer);
        gameState.moleTimer = null;
    }
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
        gameState.gameTimer = null;
    }
    
    // 隐藏所有地鼠
    hideAllMoles();
    
    // 播放结束音效
    playSound(elements.gameOverSound);
    
    // 切换界面显示：隐藏游戏网格，显示结束界面
    elements.gameGrid.style.display = 'none';
    elements.gameOverScreen.style.display = 'flex';
    
    // 更新结算数据
    elements.finalScore.textContent = gameState.score;
    elements.maxCombo.textContent = 'x' + gameState.maxCombo;
    elements.molesHit.textContent = gameState.molesHit;
    
    // 移除倒计时警告样式
    elements.timer.parentElement.classList.remove('timer-warning');
    
    console.log('🏁 游戏结束！最终分数：' + gameState.score + '，命中：' + gameState.molesHit);
}

// ============================================
// 地鼠随机出现逻辑（核心功能）
// ============================================
/**
 * 启动地鼠随机出现逻辑
 * 立即生成第一个地鼠，后续由 handleHit/showMole 中的 setTimeout 链式调用
 * 修复：移除 setInterval，避免定时器冲突导致的状态混乱
 */
function startMoleSpawning() {
    // 立即生成第一个地鼠
    spawnMole();
    
    // 修复：不再使用 setInterval，避免与 handleHit/showMole 中的 setTimeout 冲突
    // 地鼠生成现在完全由以下两个事件驱动：
    // 1. 玩家命中地鼠后 500ms
    // 2. 地鼠自动缩回后 300ms
    console.log('[SPAWN] 地鼠生成系统启动（事件驱动模式）');
}

/**
 * 生成地鼠
 * 随机选择一个位置，让地鼠冒出
 * 避免连续在同一位置出现
 */
function spawnMole() {
    console.log(`[SPAWN] 开始生成地鼠，currentMoleIndex=${gameState.currentMoleIndex}`);
    
    // 先隐藏之前的地鼠
    hideMole(gameState.currentMoleIndex);
    
    // 随机选择一个新的位置（0-8）
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * 9);
    } while (newIndex === gameState.currentMoleIndex && elements.holes.length > 1);
    
    gameState.currentMoleIndex = newIndex;
    console.log(`[SPAWN] 新地鼠位置：${newIndex}`);
    
    // 显示地鼠
    showMole(newIndex);
}

/**
 * 显示地鼠
 * @param {number} index - 地鼠洞索引（0-8）
 */
function showMole(index) {
    if (index < 0 || index >= elements.holes.length) {
        console.log(`[SHOW] 无效索引 ${index}, 跳过`);
        return;
    }
    
    const hole = elements.holes[index];
    const mole = hole.querySelector('.mole');
    
    if (mole) {
        // 添加向上动画类，地鼠冒出
        mole.classList.add('up');
        console.log(`[SHOW] 地鼠 ${index} 冒出 (停留 ${CONFIG.MOLE_SHOW_DURATION}ms)`);
        
        // 设置地鼠在 CONFIG.MOLE_SHOW_DURATION 后自动缩回（如果没被击中）
        setTimeout(() => {
            console.log(`[SHOW] ${CONFIG.MOLE_SHOW_DURATION}ms 定时器触发，检查 currentMoleIndex=${gameState.currentMoleIndex}, index=${index}`);
            if (gameState.currentMoleIndex === index && gameState.isPlaying) {
                console.log(`[SHOW] 地鼠 ${index} 自动缩回`);
                hideMole(index);
                // 自动缩回后，稍后生成新的地鼠
                setTimeout(() => {
                    if (gameState.isPlaying) {
                        console.log('[SHOW] 地鼠缩回后生成新地鼠');
                        spawnMole();
                    }
                }, CONFIG.MISS_RESPAWN_DELAY);
            } else {
                console.log(`[SHOW] 跳过缩回：currentMoleIndex=${gameState.currentMoleIndex}, isPlaying=${gameState.isPlaying}`);
            }
        }, CONFIG.MOLE_SHOW_DURATION);
    }
}

/**
 * 隐藏地鼠
 * @param {number} index - 地鼠洞索引（0-8）
 */
function hideMole(index) {
    if (index < 0 || index >= elements.holes.length) return;
    
    const hole = elements.holes[index];
    const mole = hole.querySelector('.mole');
    
    if (mole) {
        // 移除向上和击中状态类
        mole.classList.remove('up');
        mole.classList.remove('hit');
    }
}

/**
 * 隐藏所有地鼠
 * 用于游戏开始/结束时清理状态
 */
function hideAllMoles() {
    elements.holes.forEach((hole, index) => {
        hideMole(index);
    });
    gameState.currentMoleIndex = -1;
}

/**
 * 获取随机时间间隔
 * @param {number} min - 最小值（毫秒）
 * @param {number} max - 最大值（毫秒）
 * @returns {number} 随机时间间隔
 */
function getRandomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================
// 点击事件监听与命中判定（核心功能）
// ============================================
/**
 * 处理地鼠洞点击事件
 * @param {number} index - 被点击的地鼠洞索引（0-8）
 */
function handleHoleClick(index) {
    // 调试日志：记录每次点击
    console.log(`[CLICK] 点击洞 ${index}, currentMoleIndex=${gameState.currentMoleIndex}, isPlaying=${gameState.isPlaying}, score=${gameState.score}`);
    
    // 游戏未进行时忽略点击
    if (!gameState.isPlaying) {
        console.log('[CLICK] 忽略：游戏未进行');
        return;
    }
    
    // 命中判定：检查点击的是否是当前地鼠位置
    if (index === gameState.currentMoleIndex) {
        console.log(`[CLICK] 命中！洞 ${index}`);
        handleHit(index);
    } else {
        console.log(`[CLICK] 未命中！洞 ${index} (地鼠在 ${gameState.currentMoleIndex})`);
        handleMiss(index);
    }
}

/**
 * 处理命中事件
 * @param {number} index - 命中的地鼠洞索引
 */
function handleHit(index) {
    const now = Date.now();
    
    // 连击检测：如果在上次命中后 COMBO_TIMEOUT 内再次命中，增加连击
    if (gameState.lastHitTime > 0 && (now - gameState.lastHitTime) < gameState.comboTimeout) {
        // 增加连击，最高不超过 MAX_COMBO
        gameState.combo = Math.min(gameState.combo + 1, CONFIG.MAX_COMBO);
        // 更新最高连击记录
        if (gameState.combo > gameState.maxCombo) {
            gameState.maxCombo = gameState.combo;
        }
        console.log(`[HIT] 连击！combo: ${gameState.combo - 1} → ${gameState.combo}`);
    } else {
        // 重置连击
        gameState.combo = 1;
        console.log(`[HIT] 连击中断，重置为 x1 (上次命中：${gameState.lastHitTime > 0 ? now - gameState.lastHitTime + 'ms 前' : '无'})`);
    }
    
    gameState.lastHitTime = now;
    
    // 计算得分：基础分 × 连击倍数
    const points = CONFIG.BASE_SCORE * gameState.combo;
    const oldScore = gameState.score;
    gameState.score += points;
    gameState.molesHit++;
    
    console.log(`[HIT] 得分计算：${CONFIG.BASE_SCORE} × ${gameState.combo} = ${points}, 分数：${oldScore} → ${gameState.score}`);
    
    // 播放击中音效
    playSound(elements.hitSound);
    
    // 显示击中效果（地鼠表情变化）
    showHitEffect(index);
    
    // 显示得分飘字动画
    showFloatingText(points, index, gameState.combo > 1);
    
    // 更新 UI 显示
    updateUI();
    
    // 隐藏当前地鼠，准备生成新的
    hideMole(index);
    gameState.currentMoleIndex = -1;
    console.log(`[HIT] 隐藏地鼠 ${index}, currentMoleIndex = -1, ${CONFIG.HIT_RESPAWN_DELAY}ms 后生成新地鼠`);
    
    // 稍后生成新的地鼠
    setTimeout(() => {
        if (gameState.isPlaying) {
            console.log('[HIT] 命中后定时器触发，生成新地鼠');
            spawnMole();
        } else {
            console.log('[HIT] 命中后定时器触发，但游戏已结束');
        }
    }, CONFIG.HIT_RESPAWN_DELAY);
    
    console.log(`🎯 命中！+${points}分，连击 x${gameState.combo}，总分：${gameState.score}`);
}

/**
 * 处理未命中事件（点击空地）
 * @param {number} index - 被点击的地鼠洞索引
 */
function handleMiss(index) {
    // 未命中时重置连击（不扣分，只中断连击）
    gameState.combo = 1;
    gameState.lastHitTime = 0;
    
    updateUI();
    
    console.log('❌ 未命中');
}

// ============================================
// 视觉效果系统
// ============================================
/**
 * 显示击中效果
 * @param {number} index - 地鼠洞索引
 */
function showHitEffect(index) {
    const hole = elements.holes[index];
    const mole = hole.querySelector('.mole');
    
    if (mole) {
        // 添加击中动画类
        mole.classList.add('hit');
        
        // 动画结束后移除类（等待下次击中）
        setTimeout(() => {
            mole.classList.remove('hit');
        }, 300);
    }
}

/**
 * 显示得分飘字
 * @param {number} points - 得分
 * @param {number} index - 地鼠洞索引
 * @param {boolean} isCombo - 是否是连击
 */
function showFloatingText(points, index, isCombo) {
    const hole = elements.holes[index];
    const rect = hole.getBoundingClientRect();
    
    // 创建飘字元素
    const text = document.createElement('div');
    text.className = 'floating-text' + (isCombo ? ' combo' : '');
    text.textContent = '+' + points + (isCombo ? ' 连击!' : '');
    
    // 设置位置（地鼠洞上方，居中）
    // 减去 30px 是为了让文字中心对齐
    text.style.left = (rect.left + rect.width / 2 - 30) + 'px';
    text.style.top = (rect.top - 20) + 'px';
    
    // 添加到容器
    elements.floatingTextContainer.appendChild(text);
    
    // 动画结束后移除元素（避免 DOM 堆积）
    setTimeout(() => {
        text.remove();
    }, 1000);
}

// ============================================
// 游戏倒计时系统
// ============================================
/**
 * 启动游戏倒计时
 * 每秒减少时间，最后 5 秒添加警告动画
 */
function startGameTimer() {
    gameState.gameTimer = setInterval(() => {
        gameState.timeLeft--;
        updateUI();
        
        // 倒计时警告：最后 5 秒添加脉冲动画
        if (gameState.timeLeft <= 5) {
            elements.timer.parentElement.classList.add('timer-warning');
        } else {
            elements.timer.parentElement.classList.remove('timer-warning');
        }
        
        // 游戏结束判定
        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

// ============================================
// UI 更新系统
// ============================================
/**
 * 更新 UI 显示
 * 同步游戏状态到界面元素
 */
function updateUI() {
    elements.score.textContent = gameState.score;
    elements.timer.textContent = gameState.timeLeft;
    elements.combo.textContent = 'x' + gameState.combo;
    
    // 连击指示器动画：当连击大于 1 时触发脉冲效果
    if (gameState.combo > 1) {
        elements.combo.parentElement.classList.add('combo-boost');
        // 动画结束后移除类
        setTimeout(() => {
            elements.combo.parentElement.classList.remove('combo-boost');
        }, CONFIG.COMBO_ANIMATION_DURATION);
    }
}

// ============================================
// 音效控制系统
// ============================================
/**
 * 播放音效
 * @param {HTMLAudioElement} audio - 音频元素
 * 注意：如果音效文件不存在，会静默失败，不影响游戏
 */
function playSound(audio) {
    if (audio) {
        // 重置播放位置（允许快速重复播放）
        audio.currentTime = 0;
        // 播放音效（如果音频文件存在）
        audio.play().catch(e => {
            // 如果音频文件不存在或加载失败，静默处理
            // 这样可以确保游戏在没有音效的情况下也能正常运行
            console.log('🔇 音效文件未找到:', audio.src);
        });
    }
}

// ============================================
// 页面生命周期
// ============================================
/**
 * 页面加载完成后初始化游戏
 * 使用 DOMContentLoaded 确保 DOM 元素已就绪
 */
document.addEventListener('DOMContentLoaded', initGame);

// 如果 DOM 已经加载完成（例如脚本延迟加载），直接初始化
if (document.readyState !== 'loading') {
    initGame();
}

// ============================================
// 性能优化说明
// ============================================
/*
   1. DOM 元素缓存：避免重复查询 DOM
   2. 事件委托：可以考虑将 9 个点击事件合并为 1 个（未实现，保持代码清晰）
   3. 定时器清理：确保游戏结束/重置时清除所有定时器
   4. 触摸优化：使用 touchstart 和 preventDefault 减少触摸延迟
   5. 动画性能：CSS 动画使用 transform 和 opacity（GPU 加速）
   6. 内存管理：飘字元素在动画结束后自动移除
   7. 配置集中化：所有魔术数字提取到 CONFIG 对象
*/

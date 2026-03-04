/* ============================================
   打地鼠小游戏 - JavaScript 核心逻辑
   功能：地鼠随机出现、点击事件监听、命中判定
   ============================================ */

// ==================== 游戏状态变量 ====================
let gameState = {
    score: 0,              // 当前分数
    combo: 1,              // 当前连击倍数
    maxCombo: 1,           // 最高连击
    molesHit: 0,           // 命中地鼠总数
    timeLeft: 30,          // 剩余时间（秒）
    isPlaying: false,      // 游戏是否进行中
    moleTimer: null,       // 地鼠出现定时器
    gameTimer: null,       // 游戏倒计时定时器
    currentMoleIndex: -1,  // 当前地鼠位置索引
    lastHitTime: 0,        // 上次命中时间（用于连击检测）
    comboTimeout: 2000     // 连击超时时间（毫秒）
};

// ==================== DOM 元素引用 ====================
const elements = {
    score: document.getElementById('score'),
    timer: document.getElementById('timer'),
    combo: document.getElementById('combo'),
    startScreen: document.getElementById('startScreen'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    gameGrid: document.getElementById('gameGrid'),
    finalScore: document.getElementById('finalScore'),
    maxCombo: document.getElementById('maxCombo'),
    molesHit: document.getElementById('molesHit'),
    startBtn: document.getElementById('startBtn'),
    restartBtn: document.getElementById('restartBtn'),
    floatingTextContainer: document.getElementById('floatingTextContainer'),
    holes: document.querySelectorAll('.hole'),
    hitSound: document.getElementById('hitSound'),
    startSound: document.getElementById('startSound'),
    gameOverSound: document.getElementById('gameOverSound')
};

// ==================== 初始化 ====================
/**
 * 初始化游戏
 * 绑定事件监听器，设置初始状态
 */
function initGame() {
    // 绑定开始按钮事件
    elements.startBtn.addEventListener('click', startGame);
    
    // 绑定重新开始按钮事件
    elements.restartBtn.addEventListener('click', startGame);
    
    // 为每个地鼠洞绑定点击事件
    elements.holes.forEach((hole, index) => {
        hole.addEventListener('click', () => handleHoleClick(index));
        // 支持移动端触摸
        hole.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 防止触摸延迟
            handleHoleClick(index);
        });
    });
    
    console.log('🎮 打地鼠游戏初始化完成');
}

// ==================== 游戏流程控制 ====================
/**
 * 开始游戏
 * 重置状态，显示游戏网格，启动定时器
 */
function startGame() {
    // 重置游戏状态
    resetGameState();
    
    // 播放开始音效
    playSound(elements.startSound);
    
    // 切换界面显示
    elements.startScreen.style.display = 'none';
    elements.gameOverScreen.style.display = 'none';
    elements.gameGrid.style.display = 'grid';
    
    // 更新 UI 显示
    updateUI();
    
    // 标记游戏进行中
    gameState.isPlaying = true;
    
    // 启动地鼠随机出现逻辑
    startMoleSpawning();
    
    // 启动游戏倒计时
    startGameTimer();
    
    console.log('🎯 游戏开始！');
}

/**
 * 重置游戏状态
 */
function resetGameState() {
    gameState.score = 0;
    gameState.combo = 1;
    gameState.maxCombo = 1;
    gameState.molesHit = 0;
    gameState.timeLeft = 30;
    gameState.currentMoleIndex = -1;
    gameState.lastHitTime = 0;
    
    // 清除所有定时器
    if (gameState.moleTimer) clearInterval(gameState.moleTimer);
    if (gameState.gameTimer) clearInterval(gameState.gameTimer);
    
    // 隐藏所有地鼠
    hideAllMoles();
}

/**
 * 结束游戏
 */
function endGame() {
    gameState.isPlaying = false;
    
    // 停止所有定时器
    if (gameState.moleTimer) clearInterval(gameState.moleTimer);
    if (gameState.gameTimer) clearInterval(gameState.gameTimer);
    
    // 隐藏所有地鼠
    hideAllMoles();
    
    // 播放结束音效
    playSound(elements.gameOverSound);
    
    // 显示结算界面
    elements.gameGrid.style.display = 'none';
    elements.gameOverScreen.style.display = 'flex';
    
    // 更新结算数据
    elements.finalScore.textContent = gameState.score;
    elements.maxCombo.textContent = 'x' + gameState.maxCombo;
    elements.molesHit.textContent = gameState.molesHit;
    
    console.log('🏁 游戏结束！最终分数：' + gameState.score);
}

// ==================== 地鼠随机出现逻辑（核心功能） ====================
/**
 * 启动地鼠随机出现逻辑
 * 使用 setInterval 定时生成地鼠
 */
function startMoleSpawning() {
    // 立即生成第一个地鼠
    spawnMole();
    
    // 设置定时器，每 800-1500ms 随机生成一个地鼠
    gameState.moleTimer = setInterval(() => {
        if (gameState.isPlaying) {
            spawnMole();
        }
    }, getRandomInterval(800, 1500));
}

/**
 * 生成地鼠
 * 随机选择一个位置，让地鼠冒出
 */
function spawnMole() {
    // 先隐藏之前的地鼠
    hideMole(gameState.currentMoleIndex);
    
    // 随机选择一个新的位置（0-8）
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * 9);
    } while (newIndex === gameState.currentMoleIndex && elements.holes.length > 1);
    
    gameState.currentMoleIndex = newIndex;
    
    // 显示地鼠
    showMole(newIndex);
}

/**
 * 显示地鼠
 * @param {number} index - 地鼠洞索引
 */
function showMole(index) {
    if (index < 0 || index >= elements.holes.length) return;
    
    const hole = elements.holes[index];
    const mole = hole.querySelector('.mole');
    
    if (mole) {
        // 添加向上动画类
        mole.classList.add('up');
        
        // 设置地鼠在 1.5 秒后自动缩回（如果没被击中）
        setTimeout(() => {
            if (gameState.currentMoleIndex === index && gameState.isPlaying) {
                hideMole(index);
                // 自动缩回后，稍后生成新的地鼠
                setTimeout(() => {
                    if (gameState.isPlaying) {
                        spawnMole();
                    }
                }, 300);
            }
        }, 1500);
    }
}

/**
 * 隐藏地鼠
 * @param {number} index - 地鼠洞索引
 */
function hideMole(index) {
    if (index < 0 || index >= elements.holes.length) return;
    
    const hole = elements.holes[index];
    const mole = hole.querySelector('.mole');
    
    if (mole) {
        mole.classList.remove('up');
        mole.classList.remove('hit');
    }
}

/**
 * 隐藏所有地鼠
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

// ==================== 点击事件监听与命中判定（核心功能） ====================
/**
 * 处理地鼠洞点击事件
 * @param {number} index - 被点击的地鼠洞索引
 */
function handleHoleClick(index) {
    if (!gameState.isPlaying) return;
    
    // 命中判定：检查点击的是否是当前地鼠位置
    if (index === gameState.currentMoleIndex) {
        handleHit(index);
    } else {
        handleMiss(index);
    }
}

/**
 * 处理命中事件
 * @param {number} index - 命中的地鼠洞索引
 */
function handleHit(index) {
    const now = Date.now();
    
    // 连击检测：如果在上次命中后 2 秒内再次命中，增加连击
    if (gameState.lastHitTime > 0 && (now - gameState.lastHitTime) < gameState.comboTimeout) {
        gameState.combo = Math.min(gameState.combo + 1, 5); // 最高 5 连击
        if (gameState.combo > gameState.maxCombo) {
            gameState.maxCombo = gameState.combo;
        }
    } else {
        // 重置连击
        gameState.combo = 1;
    }
    
    gameState.lastHitTime = now;
    
    // 计算得分：基础分 10 分 × 连击倍数
    const points = 10 * gameState.combo;
    gameState.score += points;
    gameState.molesHit++;
    
    // 播放击中音效
    playSound(elements.hitSound);
    
    // 显示击中效果
    showHitEffect(index);
    
    // 显示得分飘字
    showFloatingText(points, index, gameState.combo > 1);
    
    // 更新 UI
    updateUI();
    
    // 隐藏当前地鼠，准备生成新的
    hideMole(index);
    gameState.currentMoleIndex = -1;
    
    // 稍后生成新的地鼠
    setTimeout(() => {
        if (gameState.isPlaying) {
            spawnMole();
        }
    }, 500);
    
    console.log(`🎯 命中！+${points}分，连击 x${gameState.combo}`);
}

/**
 * 处理未命中事件（点击空地）
 * @param {number} index - 被点击的地鼠洞索引
 */
function handleMiss(index) {
    // 可选：扣除分数或中断连击
    // 这里选择不惩罚，只中断连击
    gameState.combo = 1;
    gameState.lastHitTime = 0;
    
    updateUI();
    
    console.log('❌ 未命中');
}

// ==================== 视觉效果 ====================
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
        
        // 动画结束后移除类
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
    
    // 设置位置（地鼠洞上方）
    text.style.left = (rect.left + rect.width / 2 - 30) + 'px';
    text.style.top = (rect.top - 20) + 'px';
    
    // 添加到容器
    elements.floatingTextContainer.appendChild(text);
    
    // 动画结束后移除元素
    setTimeout(() => {
        text.remove();
    }, 1000);
}

// ==================== 游戏倒计时 ====================
/**
 * 启动游戏倒计时
 */
function startGameTimer() {
    gameState.gameTimer = setInterval(() => {
        gameState.timeLeft--;
        updateUI();
        
        // 倒计时警告：最后 5 秒添加警告动画
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

// ==================== UI 更新 ====================
/**
 * 更新 UI 显示
 */
function updateUI() {
    elements.score.textContent = gameState.score;
    elements.timer.textContent = gameState.timeLeft;
    elements.combo.textContent = 'x' + gameState.combo;
    
    // 连击指示器动画
    if (gameState.combo > 1) {
        elements.combo.parentElement.classList.add('combo-boost');
        setTimeout(() => {
            elements.combo.parentElement.classList.remove('combo-boost');
        }, 500);
    }
}

// ==================== 音效控制 ====================
/**
 * 播放音效
 * @param {HTMLAudioElement} audio - 音频元素
 */
function playSound(audio) {
    if (audio) {
        // 重置播放位置
        audio.currentTime = 0;
        // 播放音效（如果音频文件存在）
        audio.play().catch(e => {
            // 如果音频文件不存在，静默失败
            console.log('🔇 音效文件未找到:', audio.src);
        });
    }
}

// ==================== 页面加载完成后初始化 ====================
document.addEventListener('DOMContentLoaded', initGame);

// 如果 DOM 已经加载完成，直接初始化
if (document.readyState !== 'loading') {
    initGame();
}

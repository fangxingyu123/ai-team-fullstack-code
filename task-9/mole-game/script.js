/**
 * ============================================
 * 打地鼠游戏 - JavaScript 核心逻辑
 * ============================================
 * 功能模块：
 * 1. 游戏流程控制（开始、倒计时、结束、结算）
 * 2. 地鼠随机出现逻辑
 * 3. 点击判定与计分系统
 * 4. 连击检测与奖励
 * 5. 音效系统（Web Audio API）
 * 6. 动效
 */

// ============================================
// 游戏配置
// ============================================
const GAME_CONFIG = {
    GAME_DURATION: 30,        // 游戏时长（秒）
    MOLE_APPEAR_INTERVAL: 800, // 地鼠出现间隔（毫秒）
    MOLE_STAY_DURATION: 1000,  // 地鼠停留时间（毫秒）
    BASE_SCORE: 10,           // 基础得分
    COMBO_BONUS: 5,           // 连击奖励分数
    COMBO_THRESHOLD: 3,       // 触发连击的最小连续击中数
    AUDIO_ENABLED: true       // 音效开关
};

// ============================================
// 音频系统
// ============================================
let audioContext = null;

/**
 * 初始化音频上下文
 * 由于浏览器自动播放策略，需要在用户交互后初始化
 */
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

/**
 * 生成音效 - 使用 Web Audio API 合成声音
 * @param {string} type - 音效类型：'hit', 'start', 'end', 'combo'
 */
function playSound(type) {
    if (!GAME_CONFIG.AUDIO_ENABLED || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const now = audioContext.currentTime;
    
    switch (type) {
        case 'hit':
            // 击中音效：短促的高频音
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, now);
            oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.start(now);
            oscillator.stop(now + 0.1);
            break;
            
        case 'hitCombo':
            // 连击击中音效：更欢快的双音
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(600, now);
            oscillator.frequency.setValueAtTime(900, now + 0.08);
            gainNode.gain.setValueAtTime(0.25, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            break;
            
        case 'start':
            // 开始音效：上升的琶音
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.linearRampToValueAtTime(800, now + 0.15);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
            
            // 添加第二个音符
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(600, now + 0.1);
            osc2.frequency.linearRampToValueAtTime(1000, now + 0.25);
            gain2.gain.setValueAtTime(0.2, now + 0.1);
            gain2.gain.linearRampToValueAtTime(0, now + 0.35);
            osc2.start(now + 0.1);
            osc2.stop(now + 0.35);
            break;
            
        case 'end':
            // 结束音效：下降的音调
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, now);
            oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.5);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            oscillator.start(now);
            oscillator.stop(now + 0.5);
            break;
            
        case 'excellent':
            // 优秀成绩音效：欢快的和弦
            playChord([523.25, 659.25, 783.99], 'sine', 0.4); // C 大调和弦
            break;
    }
}

/**
 * 播放和弦音效
 * @param {number[]} frequencies - 频率数组
 * @param {string} type - 波形类型
 * @param {number} duration - 持续时间（秒）
 */
function playChord(frequencies, type, duration) {
    if (!audioContext) return;
    
    const now = audioContext.currentTime;
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    frequencies.forEach(freq => {
        const osc = audioContext.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + duration);
    });
}

// ============================================
// 游戏状态
// ============================================
let gameState = {
    score: 0,              // 当前分数
    hits: 0,               // 击中次数
    combo: 0,              // 当前连击数
    maxCombo: 0,           // 最大连击数
    timeLeft: 30,          // 剩余时间
    isPlaying: false,      // 游戏是否进行中
    moleTimer: null,       // 地鼠出现定时器
    gameTimer: null,       // 游戏倒计时定时器
    lastHitTime: 0,        // 上次击中时间（用于连击检测）
    currentMoleIndex: -1   // 当前地鼠位置索引
};

// ============================================
// DOM 元素
// ============================================
const elements = {
    moleGrid: document.getElementById('moleGrid'),
    score: document.getElementById('score'),
    timer: document.getElementById('timer'),
    startOverlay: document.getElementById('startOverlay'),
    gameOverOverlay: document.getElementById('gameOverOverlay'),
    startBtn: document.getElementById('startBtn'),
    restartBtn: document.getElementById('restartBtn'),
    finalScore: document.getElementById('finalScore'),
    hitCount: document.getElementById('hitCount'),
    maxCombo: document.getElementById('maxCombo'),
    endMessage: document.getElementById('endMessage')
};

// ============================================
// 初始化：创建 3x3 地鼠洞网格
// ============================================
function initGrid() {
    elements.moleGrid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const hole = document.createElement('div');
        hole.className = 'mole-hole';
        hole.dataset.index = i;
        
        // 创建地鼠元素
        const mole = document.createElement('div');
        mole.className = 'mole';
        mole.textContent = '🐹';
        mole.style.display = 'none';
        hole.appendChild(mole);
        
        // 绑定点击事件
        hole.addEventListener('click', () => handleMoleClick(i));
        // 移动端触摸支持
        hole.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 防止双击缩放
            handleMoleClick(i);
        });
        
        elements.moleGrid.appendChild(hole);
    }
}

// ============================================
// 游戏流程控制
// ============================================

/**
 * 开始游戏
 */
function startGame() {
    // 初始化音频（必须在用户交互后调用）
    initAudio();
    
    // 重置游戏状态
    gameState = {
        score: 0,
        hits: 0,
        combo: 0,
        maxCombo: 0,
        timeLeft: GAME_CONFIG.GAME_DURATION,
        isPlaying: true,
        moleTimer: null,
        gameTimer: null,
        lastHitTime: 0,
        currentMoleIndex: -1
    };
    
    // 更新 UI
    updateScoreDisplay();
    elements.timer.textContent = gameState.timeLeft;
    
    // 隐藏开始界面
    elements.startOverlay.classList.add('hidden');
    elements.gameOverOverlay.classList.add('hidden');
    
    // 播放开始音效
    playSound('start');
    
    // 启动游戏倒计时
    startGameTimer();
    
    // 启动地鼠出现逻辑
    startMoleLogic();
    
    console.log('🎮 游戏开始！');
}

/**
 * 游戏倒计时
 */
function startGameTimer() {
    gameState.gameTimer = setInterval(() => {
        gameState.timeLeft--;
        elements.timer.textContent = gameState.timeLeft;
        
        // 最后 5 秒添加紧张效果
        if (gameState.timeLeft <= 5) {
            elements.timer.style.animation = 'pulse 0.5s infinite';
        }
        
        // 时间到，结束游戏
        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

/**
 * 地鼠随机出现逻辑
 */
function startMoleLogic() {
    // 立即出现第一个地鼠
    showMole();
    
    // 定时出现新地鼠
    gameState.moleTimer = setInterval(() => {
        if (gameState.isPlaying) {
            showMole();
        }
    }, GAME_CONFIG.MOLE_APPEAR_INTERVAL);
}

/**
 * 显示地鼠
 */
function showMole() {
    // 隐藏之前的地鼠
    hideCurrentMole();
    
    // 随机选择一个新位置（不能和上一个相同）
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * 9);
    } while (newIndex === gameState.currentMoleIndex);
    
    gameState.currentMoleIndex = newIndex;
    
    // 获取地鼠元素并显示
    const holes = elements.moleGrid.querySelectorAll('.mole-hole');
    const mole = holes[newIndex].querySelector('.mole');
    mole.style.display = 'block';
    
    // 触发动画
    setTimeout(() => {
        mole.classList.add('up');
    }, 50);
    
    // 自动缩回地鼠
    setTimeout(() => {
        if (gameState.isPlaying && gameState.currentMoleIndex === newIndex) {
            hideMole(newIndex);
        }
    }, GAME_CONFIG.MOLE_STAY_DURATION);
}

/**
 * 隐藏当前地鼠
 */
function hideCurrentMole() {
    if (gameState.currentMoleIndex >= 0) {
        hideMole(gameState.currentMoleIndex);
    }
}

/**
 * 隐藏指定位置的地鼠
 */
function hideMole(index) {
    const holes = elements.moleGrid.querySelectorAll('.mole-hole');
    const mole = holes[index].querySelector('.mole');
    mole.classList.remove('up');
    
    setTimeout(() => {
        mole.style.display = 'none';
        mole.classList.remove('hit');
    }, 300);
}

/**
 * 处理地鼠点击
 */
function handleMoleClick(index) {
    if (!gameState.isPlaying) return;
    if (index !== gameState.currentMoleIndex) return; // 点击了错误的位置
    
    const holes = elements.moleGrid.querySelectorAll('.mole-hole');
    const mole = holes[index].querySelector('.mole');
    
    // 检查地鼠是否正在显示中
    if (!mole.classList.contains('up')) return;
    
    // 击中地鼠
    mole.classList.add('hit');
    
    // 计算得分（会更新连击数）
    calculateScore();
    
    // 更新击中次数
    gameState.hits++;
    
    // 播放击中音效（根据连击数选择不同音效）
    if (gameState.combo >= GAME_CONFIG.COMBO_THRESHOLD) {
        playSound('hitCombo');
    } else {
        playSound('hit');
    }
    
    // 显示得分飘字
    showScorePopup(index);
    
    // 立即隐藏地鼠
    hideMole(index);
    gameState.currentMoleIndex = -1;
    
    console.log(`🎯 击中！分数：${gameState.score}, 连击：${gameState.combo}`);
}

/**
 * 计算得分（包含连击奖励）
 */
function calculateScore() {
    const now = Date.now();
    
    // 检测连击（2 秒内连续击中）
    if (now - gameState.lastHitTime < 2000) {
        gameState.combo++;
    } else {
        gameState.combo = 1;
    }
    
    gameState.lastHitTime = now;
    
    // 更新最大连击
    if (gameState.combo > gameState.maxCombo) {
        gameState.maxCombo = gameState.combo;
    }
    
    // 计算总分
    let points = GAME_CONFIG.BASE_SCORE;
    if (gameState.combo >= GAME_CONFIG.COMBO_THRESHOLD) {
        points += GAME_CONFIG.COMBO_BONUS * (gameState.combo - GAME_CONFIG.COMBO_THRESHOLD + 1);
    }
    
    gameState.score += points;
    updateScoreDisplay();
}

/**
 * 更新分数显示
 */
function updateScoreDisplay() {
    elements.score.textContent = gameState.score;
}

/**
 * 显示得分飘字效果
 */
function showScorePopup(index) {
    const holes = elements.moleGrid.querySelectorAll('.mole-hole');
    const hole = holes[index];
    
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${GAME_CONFIG.BASE_SCORE}`;
    
    // 添加连击提示
    if (gameState.combo >= GAME_CONFIG.COMBO_THRESHOLD) {
        popup.textContent += ` 🔥${gameState.combo}连击!`;
    }
    
    hole.appendChild(popup);
    
    // 动画结束后移除
    setTimeout(() => {
        popup.remove();
    }, 1000);
}

/**
 * 结束游戏
 */
function endGame() {
    gameState.isPlaying = false;
    
    // 清除定时器
    clearInterval(gameState.moleTimer);
    clearInterval(gameState.gameTimer);
    
    // 隐藏所有地鼠
    hideCurrentMole();
    
    // 更新结算界面
    elements.finalScore.textContent = gameState.score;
    elements.hitCount.textContent = gameState.hits;
    elements.maxCombo.textContent = gameState.maxCombo;
    
    // 根据分数显示不同的评价
    const message = getEndMessage(gameState.score);
    elements.endMessage.textContent = message.text;
    elements.endMessage.className = `message ${message.class}`;
    
    // 播放结束音效
    playSound('end');
    
    // 如果成绩优秀，播放特殊音效
    if (gameState.score >= 300) {
        setTimeout(() => playSound('excellent'), 300);
    }
    
    // 显示结算界面
    elements.gameOverOverlay.classList.remove('hidden');
    
    console.log(`🏁 游戏结束！最终得分：${gameState.score}`);
}

/**
 * 根据分数返回评价信息
 */
function getEndMessage(score) {
    if (score >= 300) {
        return { text: '🏆 太厉害了！你是打地鼠大师！', class: 'excellent' };
    } else if (score >= 200) {
        return { text: '👏 干得漂亮！继续保持！', class: 'good' };
    } else if (score >= 100) {
        return { text: '😊 还不错，再接再厉！', class: 'normal' };
    } else {
        return { text: '💪 多练习就会更好！', class: 'normal' };
    }
}

// ============================================
// 事件监听
// ============================================
elements.startBtn.addEventListener('click', startGame);
elements.restartBtn.addEventListener('click', startGame);

// ============================================
// 初始化
// ============================================
initGrid();
console.log('🎮 打地鼠游戏已加载，准备就绪！');

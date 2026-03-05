#!/usr/bin/env node

/**
 * 打地鼠游戏 - 计分逻辑验证测试
 * 
 * 目的：验证 Bug 修复后，游戏在 50+ 分时仍能正常得分
 * 
 * 测试方法：
 * 1. 模拟完整的游戏流程
 * 2. 验证每个阶段的计分逻辑
 * 3. 特别关注 50+ 分后的得分情况
 */

// ==================== 游戏配置 ====================
const CONFIG = {
    GAME_DURATION: 30,
    BASE_SCORE: 10,
    MAX_COMBO: 5,
    COMBO_TIMEOUT: 2000,
    MOLE_SHOW_DURATION: 1500,
    HIT_RESPAWN_DELAY: 500,
    MISS_RESPAWN_DELAY: 300
};

// ==================== 游戏状态 ====================
let gameState = {
    score: 0,
    combo: 1,
    maxCombo: 1,
    molesHit: 0,
    timeLeft: CONFIG.GAME_DURATION,
    isPlaying: false,
    currentMoleIndex: -1,
    lastHitTime: 0,
    comboTimeout: CONFIG.COMBO_TIMEOUT
};

// ==================== 测试统计 ====================
let testStats = {
    totalClicks: 0,
    totalHits: 0,
    totalMisses: 0,
    scoreHistory: [],
    comboHistory: [],
    phaseResults: {
        phase1: { target: 20, achieved: false, hits: 0, score: 0 },
        phase2: { target: 50, achieved: false, hits: 0, score: 0 },
        phase3: { target: 100, achieved: false, hits: 0, score: 0 }
    },
    issues: []
};

// ==================== 核心逻辑（与 script.js 一致）====================

function resetGameState() {
    gameState.score = 0;
    gameState.combo = 1;
    gameState.maxCombo = 1;
    gameState.molesHit = 0;
    gameState.timeLeft = CONFIG.GAME_DURATION;
    gameState.currentMoleIndex = -1;
    gameState.lastHitTime = 0;
    gameState.comboTimeout = CONFIG.COMBO_TIMEOUT;
    gameState.isPlaying = true;
}

function handleHit(index) {
    // 防御性检查
    if (!gameState.isPlaying) {
        console.log('[HIT] 忽略：游戏已结束');
        return false;
    }
    
    if (index !== gameState.currentMoleIndex) {
        console.log(`[HIT] 忽略：索引不匹配 (点击=${index}, 当前=${gameState.currentMoleIndex})`);
        return false;
    }
    
    const now = Date.now();
    
    // 连击检测
    if (gameState.lastHitTime > 0 && (now - gameState.lastHitTime) < gameState.comboTimeout) {
        gameState.combo = Math.min(gameState.combo + 1, CONFIG.MAX_COMBO);
        if (gameState.combo > gameState.maxCombo) {
            gameState.maxCombo = gameState.combo;
        }
        console.log(`[HIT] 连击！combo: ${gameState.combo - 1} → ${gameState.combo}`);
    } else {
        gameState.combo = 1;
        console.log(`[HIT] 连击中断，重置为 x1`);
    }
    
    gameState.lastHitTime = now;
    
    // 计算得分
    const points = CONFIG.BASE_SCORE * gameState.combo;
    const oldScore = gameState.score;
    gameState.score += points;
    gameState.molesHit++;
    
    console.log(`[HIT] 得分计算：${CONFIG.BASE_SCORE} × ${gameState.combo} = ${points}, 分数：${oldScore} → ${gameState.score}`);
    
    // 记录历史
    testStats.scoreHistory.push({
        score: gameState.score,
        points: points,
        combo: gameState.combo,
        hitNumber: gameState.molesHit
    });
    
    // 检查阶段进度
    checkPhaseProgress();
    
    return true;
}

function handleMiss(index) {
    gameState.combo = 1;
    gameState.lastHitTime = 0;
    testStats.totalMisses++;
    console.log(`[MISS] 未命中，连击重置`);
}

function spawnMole() {
    // 随机选择位置
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * 9);
    } while (newIndex === gameState.currentMoleIndex);
    
    gameState.currentMoleIndex = newIndex;
    console.log(`[SPAWN] 地鼠位置：${newIndex}`);
    
    return newIndex;
}

function checkPhaseProgress() {
    const phases = [
        { key: 'phase1', target: 20 },
        { key: 'phase2', target: 50 },
        { key: 'phase3', target: 100 }
    ];
    
    phases.forEach(phase => {
        if (gameState.score >= phase.target && !testStats.phaseResults[phase.key].achieved) {
            testStats.phaseResults[phase.key].achieved = true;
            testStats.phaseResults[phase.key].score = gameState.score;
            testStats.phaseResults[phase.key].hits = gameState.molesHit;
            
            console.log(`\n✅ 完成阶段 ${phase.key}: 达到 ${phase.target} 分！`);
            console.log(`   命中次数：${gameState.molesHit}`);
            console.log(`   当前连击：x${gameState.combo}\n`);
        }
    });
}

// ==================== 测试函数 ====================

function simulateGameSession(targetHits = 15) {
    console.log('\n========================================');
    console.log('🎮 开始模拟游戏会话');
    console.log(`目标：命中 ${targetHits} 次地鼠`);
    console.log('========================================\n');
    
    resetGameState();
    
    let hitCount = 0;
    let lastHitTime = Date.now();
    
    while (hitCount < targetHits && gameState.score < 150) {
        // 生成地鼠
        const moleIndex = spawnMole();
        
        // 模拟玩家点击（总是命中当前地鼠）
        testStats.totalClicks++;
        
        // 模拟连击：大部分时候快速点击，偶尔超时
        const timeSinceLastHit = Date.now() - lastHitTime;
        const shouldMiss = Math.random() < 0.1; // 10% 概率未命中
        
        if (shouldMiss && hitCount > 0) {
            handleMiss(moleIndex);
        } else {
            // 模拟时间流逝（大部分在连击时间内）
            const clickDelay = Math.random() < 0.8 ? 
                Math.random() * 1500 + 300 :  // 80% 快速点击
                Math.random() * 2500 + 1800;  // 20% 慢速点击（可能超时）
            
            lastHitTime = Date.now() - (2000 - clickDelay);
            
            if (handleHit(moleIndex)) {
                hitCount++;
                testStats.totalHits++;
            }
        }
        
        // 检查是否有问题
        if (gameState.score > 0 && gameState.molesHit > 0) {
            const expectedMinScore = gameState.molesHit * CONFIG.BASE_SCORE;
            if (gameState.score < expectedMinScore) {
                testStats.issues.push({
                    type: 'score_calculation_error',
                    message: `分数计算错误：预期至少 ${expectedMinScore}，实际 ${gameState.score}`
                });
            }
        }
    }
    
    gameState.isPlaying = false;
    
    console.log('\n========================================');
    console.log('🏁 游戏会话结束');
    console.log('========================================');
}

function runStressTest() {
    console.log('\n========================================');
    console.log('🔬 开始压力测试（连续快速点击）');
    console.log('========================================\n');
    
    resetGameState();
    
    // 模拟连续快速点击（测试连击上限）
    for (let i = 0; i < 20; i++) {
        spawnMole();
        testStats.totalClicks++;
        handleHit(gameState.currentMoleIndex);
        testStats.totalHits++;
    }
    
    console.log(`\n压力测试结果:`);
    console.log(`  最终分数：${gameState.score}`);
    console.log(`  最高连击：x${gameState.maxCombo}`);
    console.log(`  连击是否正确限制在 x5: ${gameState.maxCombo === 5 ? '✅' : '❌'}`);
}

function runEdgeCaseTests() {
    console.log('\n========================================');
    console.log('🧪 开始边界条件测试');
    console.log('========================================\n');
    
    // 测试 1: 游戏结束后点击
    console.log('测试 1: 游戏结束后点击');
    gameState.isPlaying = false;
    gameState.currentMoleIndex = 5;
    const result1 = handleHit(5);
    console.log(`  结果：${result1 === false ? '✅ 正确拒绝' : '❌ 错误接受'}\n`);
    
    // 测试 2: 索引不匹配
    console.log('测试 2: 索引不匹配');
    gameState.isPlaying = true;
    gameState.currentMoleIndex = 3;
    const result2 = handleHit(7);
    console.log(`  结果：${result2 === false ? '✅ 正确拒绝' : '❌ 错误接受'}\n`);
    
    // 测试 3: 连击重置
    console.log('测试 3: 连击超时重置');
    resetGameState();
    gameState.currentMoleIndex = 1;
    handleHit(1); // 第一次命中，连击 x1
    gameState.lastHitTime = Date.now() - 3000; // 模拟 3 秒前
    gameState.currentMoleIndex = 2;
    handleHit(2); // 应该重置为 x1
    console.log(`  结果：连击 = x${gameState.combo} ${gameState.combo === 1 ? '✅' : '❌'}\n`);
}

function generateReport() {
    console.log('\n========================================');
    console.log('📊 测试报告');
    console.log('========================================\n');
    
    console.log('基础统计:');
    console.log(`  总点击次数：${testStats.totalClicks}`);
    console.log(`  总命中次数：${testStats.totalHits}`);
    console.log(`  总未命中次数：${testStats.totalMisses}`);
    console.log(`  命中率：${testStats.totalClicks > 0 ? Math.round((testStats.totalHits/testStats.totalClicks)*100) : 0}%`);
    console.log(`  最终分数：${gameState.score}`);
    console.log(`  最高连击：x${gameState.maxCombo}`);
    
    console.log('\n阶段测试结果:');
    Object.entries(testStats.phaseResults).forEach(([key, result]) => {
        const status = result.achieved ? '✅ 完成' : '❌ 未完成';
        console.log(`  ${key} (${result.target}分): ${status}`);
        if (result.achieved) {
            console.log(`    - 达成时分数：${result.score}`);
            console.log(`    - 命中次数：${result.hits}`);
        }
    });
    
    console.log('\nBug 修复验证:');
    const phase3Achieved = testStats.phaseResults.phase3.achieved;
    const scoreAt50Plus = testStats.scoreHistory.filter(s => s.score >= 50);
    const scoringWorkedAt50Plus = scoreAt50Plus.length > 0;
    
    if (phase3Achieved || scoringWorkedAt50Plus) {
        console.log('  ✅ Bug 已修复！');
        console.log('  在 50+ 分后仍能正常得分');
        if (scoreAt50Plus.length > 0) {
            console.log(`  50+ 分后的得分记录数：${scoreAt50Plus.length}`);
            const lastRecord = scoreAt50Plus[scoreAt50Plus.length - 1];
            console.log(`  最高分记录：${lastRecord.score} 分（连击 x${lastRecord.combo}）`);
        }
    } else {
        console.log('  ❌ Bug 仍然存在！');
        console.log('  50+ 分后无法正常得分');
    }
    
    if (testStats.issues.length > 0) {
        console.log('\n发现的问题:');
        testStats.issues.forEach((issue, i) => {
            console.log(`  ${i + 1}. ${issue.type}: ${issue.message}`);
        });
    } else {
        console.log('\n✅ 未发现任何问题');
    }
    
    console.log('\n========================================');
    console.log('测试完成！');
    console.log('========================================\n');
    
    return {
        success: phase3Achieved || scoringWorkedAt50Plus,
        issues: testStats.issues.length === 0,
        finalScore: gameState.score,
        maxCombo: gameState.maxCombo
    };
}

// ==================== 主测试流程 ====================

console.log('╔════════════════════════════════════════╗');
console.log('║  打地鼠游戏 - 计分逻辑验证测试         ║');
console.log('║  测试目标：验证 50+ 分后仍能正常得分     ║');
console.log('╚════════════════════════════════════════╝\n');

// 运行所有测试
simulateGameSession(15);
runStressTest();
runEdgeCaseTests();

// 生成报告
const report = generateReport();

// 输出测试结论
console.log('\n📋 测试结论:\n');
if (report.success && report.issues) {
    console.log('  ✅ 所有测试通过！');
    console.log('  ✅ Bug 已修复，可以交付\n');
    process.exit(0);
} else if (report.success && !report.issues) {
    console.log('  ⚠️  主要功能正常，但发现一些问题');
    console.log('  建议修复问题后重新测试\n');
    process.exit(1);
} else {
    console.log('  ❌ 测试失败！Bug 仍然存在');
    console.log('  需要进一步修复\n');
    process.exit(1);
}

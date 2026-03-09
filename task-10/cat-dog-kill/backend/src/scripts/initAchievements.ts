/**
 * 初始化成就系统脚本
 * 用于在数据库中创建默认成就
 * 
 * 使用方法:
 * npx ts-node src/scripts/initAchievements.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { achievementService } from '../services/achievementService';

dotenv.config();

async function initAchievements() {
  try {
    // 连接 MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cat-dog-kill';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 初始化默认成就
    await achievementService.initializeDefaultAchievements();
    console.log('✅ Achievements initialized successfully');

    // 获取所有成就并显示
    const achievements = await achievementService.getAllAchievements();
    console.log(`\n📊 Total achievements: ${achievements.length}`);
    
    // 按类别统计
    const byCategory = achievements.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📋 Achievements by category:');
    for (const [category, count] of Object.entries(byCategory)) {
      console.log(`   ${category}: ${count}`);
    }

    // 按难度统计
    const byDifficulty = achievements.reduce((acc, a) => {
      acc[a.difficulty] = (acc[a.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n🎯 Achievements by difficulty:');
    for (const [difficulty, count] of Object.entries(byDifficulty)) {
      console.log(`   ${difficulty}: ${count}`);
    }

    // 总点数
    const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
    console.log(`\n⭐ Total achievement points: ${totalPoints}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

initAchievements();

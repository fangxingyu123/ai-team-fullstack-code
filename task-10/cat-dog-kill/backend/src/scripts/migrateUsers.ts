/**
 * 用户数据迁移脚本
 * 为现有用户添加成就相关字段
 * 
 * 使用方法:
 * npx ts-node src/scripts/migrateUsers.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

async function migrateUsers() {
  try {
    // 连接 MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cat-dog-kill';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 获取所有用户
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      let needsUpdate = false;

      // 初始化成就点数字段
      if (user.achievementPoints === undefined) {
        user.achievementPoints = 0;
        needsUpdate = true;
      }

      // 初始化成就数组
      if (!user.achievements || user.achievements.length === 0) {
        user.achievements = [];
        needsUpdate = true;
      }

      // 初始化统计字段
      if (!user.stats) {
        user.stats = {
          tasksCompleted: 0,
          correctVotes: 0,
          dogWins: 0,
          catWins: 0,
          foxWins: 0,
          winStreak: 0,
          loseStreak: 0,
          meetingsCalled: 0,
          sabotages: 0,
          investigations: 0,
          hunterKills: 0,
          survivals: 0,
          perfectTasks: 0,
          speedVictories: 0,
          comebacks: 0
        };
        needsUpdate = true;
      } else {
        // 补充缺失的统计字段
        const statFields = [
          'tasksCompleted', 'correctVotes', 'dogWins', 'catWins', 'foxWins',
          'winStreak', 'loseStreak', 'meetingsCalled', 'sabotages',
          'investigations', 'hunterKills', 'survivals', 'perfectTasks',
          'speedVictories', 'comebacks'
        ];
        
        for (const field of statFields) {
          if ((user.stats as any)[field] === undefined) {
            (user.stats as any)[field] = 0;
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        await user.save();
        migratedCount++;
        console.log(`✅ Migrated user: ${user.username}`);
      } else {
        skippedCount++;
      }
    }

    console.log(`\n📊 Migration complete:`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Skipped: ${skippedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

migrateUsers();

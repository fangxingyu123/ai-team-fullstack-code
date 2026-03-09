import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAchievementProgress {
  achievementId: string;
  unlocked: boolean;
  progress: number;
  unlockedAt?: Date;
}

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  level: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  achievementPoints: number;
  achievements: IAchievementProgress[];
  // 统计数据
  stats: {
    tasksCompleted: number;
    correctVotes: number;
    dogWins: number;
    catWins: number;
    foxWins: number;
    winStreak: number;
    loseStreak: number;
    meetingsCalled: number;
    sabotages: number;
    investigations: number;
    hunterKills: number;
    survivals: number;
    perfectTasks: number;
    speedVictories: number;
    comebacks: number;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  level: {
    type: Number,
    default: 1
  },
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  gamesPlayed: {
    type: Number,
    default: 0
  },
  achievementPoints: {
    type: Number,
    default: 0
  },
  achievements: {
    type: [{
      achievementId: String,
      unlocked: Boolean,
      progress: Number,
      unlockedAt: Date
    }],
    default: []
  },
  stats: {
    tasksCompleted: { type: Number, default: 0 },
    correctVotes: { type: Number, default: 0 },
    dogWins: { type: Number, default: 0 },
    catWins: { type: Number, default: 0 },
    foxWins: { type: Number, default: 0 },
    winStreak: { type: Number, default: 0 },
    loseStreak: { type: Number, default: 0 },
    meetingsCalled: { type: Number, default: 0 },
    sabotages: { type: Number, default: 0 },
    investigations: { type: Number, default: 0 },
    hunterKills: { type: Number, default: 0 },
    survivals: { type: Number, default: 0 },
    perfectTasks: { type: Number, default: 0 },
    speedVictories: { type: Number, default: 0 },
    comebacks: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);

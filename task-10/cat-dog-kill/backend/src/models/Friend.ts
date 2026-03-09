import mongoose, { Document, Schema } from 'mongoose';

export interface IFriend extends Document {
  userId: mongoose.Types.ObjectId;
  friendId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

const FriendSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  friendId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Prevent duplicate friendships
FriendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

// Prevent self-friending
FriendSchema.pre('save', function(next) {
  if (this.userId.toString() === this.friendId.toString()) {
    throw new Error('Cannot add yourself as a friend');
  }
  next();
});

export default mongoose.model<IFriend>('Friend', FriendSchema);

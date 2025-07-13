import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  designation: { type: String, required: true, enum: ['superadmin', 'admin', 'mentor', 'user'] }, // Added 'mentor' role
  parentId: { type: String },
  adminId: { type: String, unique: true, sparse: true }, // Only for admins
  avatar: String,
  points: { type: Number, default: 0 },
  restricted: { type: Boolean, default: false },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
  emailNotifications: { type: Boolean, default: true },
  inAppNotifications: { type: Boolean, default: true },
  completedTasks: [
    {
      task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
      completedAt: Date,
    },
  ],
  inProgressTasks: [
    {
      task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
      startedAt: Date,
    },
  ],
});

// 🔐 Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

const User = mongoose.model('User', userSchema);
export default User;

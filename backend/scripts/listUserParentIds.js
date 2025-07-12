import mongoose from 'mongoose';
import User from '../models/User.js';
import config from '../config.js';

async function listUserParentIds() {
  await mongoose.connect(config.mongodbUri);
  const users = await User.find({ designation: 'user' });
  for (const user of users) {
    console.log({ username: user.username, email: user.email, parentId: user.parentId, _id: user._id });
  }
  mongoose.disconnect();
}

listUserParentIds().catch(err => {
  console.error('Failed to list users:', err);
  mongoose.disconnect();
}); 
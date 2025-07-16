import mongoose from 'mongoose';
import User from '../models/User.js';
import config from '../config.js';

async function listAndFixUserParentIds() {
  await mongoose.connect(config.mongodbUri);

  const admins = await User.find({ designation: 'admin' });
  const adminIds = admins.map(a => String(a._id));
  const adminIdMap = {};
  admins.forEach(a => { if (a.adminId) adminIdMap[a.adminId] = a._id; });

  const users = await User.find({ designation: 'user' });
  let mismatched = [];
  let fixed = 0;

  for (const user of users) {
    // If parentId is not a valid ObjectId or does not match any admin _id
    if (!mongoose.Types.ObjectId.isValid(user.parentId) || !adminIds.includes(String(user.parentId))) {
      mismatched.push({
        userId: user._id,
        username: user.username,
        parentId: user.parentId,
      });
      // Try to fix: if parentId matches an admin's adminId, update to admin's _id
      if (adminIdMap[user.parentId]) {
        user.parentId = adminIdMap[user.parentId];
        await user.save();
        fixed++;
        console.log(`Fixed user ${user.username} (${user._id}): parentId set to admin _id ${adminIdMap[user.parentId]}`);
      } else {
        console.warn(`User ${user.username} (${user._id}) has parentId ${user.parentId} which does not match any admin _id or adminId.`);
      }
    }
  }

  if (mismatched.length > 0) {
    console.log('\nUsers with mismatched parentId:');
    mismatched.forEach(u => {
      console.log(`User: ${u.username} (${u.userId}), parentId: ${u.parentId}`);
    });
  } else {
    console.log('All users have valid parentId fields.');
  }
  console.log(`\nTotal users fixed: ${fixed}`);
  mongoose.disconnect();
}

listAndFixUserParentIds().catch(err => {
  console.error('Script failed:', err);
  mongoose.disconnect();
}); 
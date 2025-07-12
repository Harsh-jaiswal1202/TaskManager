import mongoose from 'mongoose';
import User from '../models/User.js';
import config from '../config.js';

async function migrateAdminIds() {
  await mongoose.connect(config.mongodbUri);
  const admins = await User.find({ designation: 'admin', $or: [{ adminId: { $exists: false } }, { adminId: null }, { adminId: '' }] });
  for (const admin of admins) {
    let unique = false;
    let adminId = '';
    while (!unique) {
      const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit number
      adminId = `ADM${randomNum}`;
      const exists = await User.findOne({ adminId });
      if (!exists) unique = true;
    }
    admin.adminId = adminId;
    await admin.save();
    console.log(`Updated admin ${admin.username} (${admin._id}) with adminId: ${adminId}`);
  }
  console.log('Migration complete.');
  mongoose.disconnect();
}

migrateAdminIds().catch(err => {
  console.error('Migration failed:', err);
  mongoose.disconnect();
}); 
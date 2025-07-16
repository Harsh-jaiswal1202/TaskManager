import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config.js';

const registerUser = async (req, res) => {
  const { name, email, password, designation, parentId } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const userData = {
      username: name,
      email,
      password,
      designation,
    };
    if (designation === 'user') {
      userData.parentId = parentId;
    }
    if (designation === 'admin') {
      // Generate a unique short adminId like ADM123
      let unique = false;
      let adminId = '';
      while (!unique) {
        const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit number
        adminId = `ADM${randomNum}`;
        const exists = await User.findOne({ adminId });
        if (!exists) unique = true;
      }
      userData.adminId = adminId;
    }
    const user = await User.create(userData);

    res.status(201).json({
      message: 'User registered successfully',
      userId: user._id,
      adminId: user.adminId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password, designation, adminId } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'user does not exist' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid  password' });
    }
    if (designation !== user.designation) {
      return res.status(400).json({ message: 'Invalid designation' });
    }
    // Additional check for user designation: validate adminId and parentId
    if (designation === 'user') {
      if (!adminId) {
        return res.status(400).json({ message: 'Admin ID is required.' });
      }
      const admin = await User.findOne({ adminId, designation: 'admin' });
      if (!admin) {
        return res.status(400).json({ message: 'Invalid Admin ID.' });
      }
      // Log for debugging
      console.log(`User login attempt: user.email=${user.email}, user.parentId=${user.parentId}, provided adminId=${adminId}, admin._id=${admin._id}`);
      if (String(user.parentId) !== String(admin._id)) {
        return res.status(400).json({ message: 'You are not assigned to this Admin ID.' });
      }
    }
    // Generate JWT token
    const token = jwt.sign({ id: user._id, designation: user.designation }, config.jwtSecret, { expiresIn: '1d' });
    res.status(200).json({
      message: 'Login successful',
      userId: user._id,
      token,
      designation: user.designation,
      // Add more fields as needed
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users, separated by designation
const getAllUsers = async (req, res) => {
  console.log("getAllUsers");
  try {
    const superadmins = await User.find({ designation: 'superadmin' }, 'username email designation restricted');
    const admins = await User.find({ designation: 'admin' }, 'username email designation restricted adminId');
    const mentors = await User.find({ designation: 'mentor' }, 'username email designation restricted');
    let users;
    if (req.user && req.user.designation === 'admin') {
      // Only return users assigned to this admin (parentId matches admin's _id)
      users = await User.find({ designation: 'user', parentId: req.user.id }, 'username email designation restricted parentId adminId');
    } else {
      users = await User.find({ designation: 'user' }, 'username email designation restricted parentId adminId');
    }
    res.status(200).json({ superadmins, admins, mentors, users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle restrict/unrestrict for an admin
const toggleAdminRestriction = async (req, res) => {
  // Only superadmin can restrict/unrestrict admins
  if (!req.user || req.user.designation !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can perform this action' });
  }
  const { id } = req.params;
  try {
    const admin = await User.findOne({ _id: id, designation: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    admin.restricted = !admin.restricted;
    await admin.save();
    res.status(200).json({ message: `Admin ${admin.restricted ? 'restricted' : 'unrestricted'} successfully`, restricted: admin.restricted });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle restrict/unrestrict for a user (only by superadmin)
const toggleUserRestriction = async (req, res) => {
  console.log('toggleUserRestriction called by:', req.user); // Debug log
  if (!req.user || (req.user.designation !== 'superadmin' && req.user.designation !== 'admin')) {
    console.log('403 triggered: req.user =', req.user);
    return res.status(403).json({ message: 'Only admin or superadmin can perform this action' });
  }
  console.log('Passed admin/superadmin check:', req.user.designation);
  const { id } = req.params;
  try {
    const user = await User.findOne({_id: id, designation: 'user' });
    let admin = null;
    if (req.user.designation === 'admin') {
      admin = await User.findOne({_id: req.user.id, designation: 'admin'});
      if(!admin){
        return res.status(403).json({ message: 'Only admin or superadmin can perform this action' });
      }
    }
    if (!user ) {
      return res.status(404).json({ message: 'User not found' });
    }
    // If admin, only allow restricting their own users
    if (
      req.user.designation === 'admin' &&
      String(user.parentId) !== String(admin.adminId)
    ) {
      return res.status(403).json({ message: 'Admins can only restrict their own users' });
    }
    user.restricted = !user.restricted;
    await user.save();
    res.status(200).json({ message: `User ${user.restricted ? 'restricted' : 'unrestricted'} successfully`, restricted: user.restricted });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle restrict/unrestrict for a mentor (only by superadmin)
const toggleMentorRestriction = async (req, res) => {
  if (!req.user || req.user.designation === 'user') {
    return res.status(403).json({ message: 'Only superadmin can perform this action' });
  }
  const { id } = req.params;
  try {
    const mentor = await User.findOne({ _id: id, designation: 'mentor' });
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    mentor.restricted = !mentor.restricted;
    await mentor.save();
    res.status(200).json({ message: `Mentor ${mentor.restricted ? 'restricted' : 'unrestricted'} successfully`, restricted: mentor.restricted });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add this function for updating user profile
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    // Optionally, prevent updating restricted fields like password here
    const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: false });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// JWT auth middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update password
const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Verify the user is updating their own password
    if (req.user.id !== id) {
      return res.status(403).json({ message: 'You can only update your own password' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update email
const updateEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { newEmail } = req.body;
    
    // Verify the user is updating their own email
    if (req.user.id !== id) {
      return res.status(403).json({ message: 'You can only update your own email' });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== id) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    const user = await User.findByIdAndUpdate(id, { email: newEmail }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Email updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete account
const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    // Verify the user is deleting their own account
    if (req.user.id !== id) {
      return res.status(403).json({ message: 'You can only delete your own account' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }
    
    // Delete the user
    await User.findByIdAndDelete(id);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export  { registerUser, loginUser, getAllUsers, toggleAdminRestriction, authenticateJWT, toggleUserRestriction, toggleMentorRestriction, getUserById, updateUser, updatePassword, updateEmail, deleteAccount };

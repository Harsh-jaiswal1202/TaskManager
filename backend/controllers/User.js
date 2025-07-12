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
      if (user.parentId !== adminId) {
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
    const users = await User.find({ designation: 'user' }, 'username email designation restricted');
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
  if (!req.user || req.user.designation !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can perform this action' });
  }
  const { id } = req.params;
  try {
    const user = await User.findOne({ _id: id, designation: 'user' });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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
  if (!req.user || req.user.designation !== 'superadmin') {
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

export  { registerUser, loginUser, getAllUsers, toggleAdminRestriction, authenticateJWT, toggleUserRestriction, toggleMentorRestriction, getUserById };

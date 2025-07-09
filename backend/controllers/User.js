import User from '../models/User.js';
import bcrypt from 'bcryptjs';

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
    const user = await User.create(userData);

    res.status(201).json({
      message: 'User registered successfully',
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password, designation } = req.body;
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
    res.status(200).json({
      message: 'Login successful',
      userId: user._id,
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
    const admins = await User.find({ designation: 'admin' }, 'username email designation restricted');
    console.log(admins);
    const users = await User.find({ designation: 'user' }, 'username email designation restricted');
    res.status(200).json({ admins, users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle restrict/unrestrict for an admin
const toggleAdminRestriction = async (req, res) => {
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

export  { registerUser, loginUser, getAllUsers, toggleAdminRestriction };

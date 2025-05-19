const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
require('dotenv').config();
const connectDB = require('../config/db');

async function Populate() {
  try {
    await connectDB();
    console.log('Database connected successfully.');

    // Clear existing users
    await User.deleteMany();
    console.log('Existing users cleared.');

    // Create initial users with normal Indian names (no underscores)
    const users = [
      { username: 'admin', role: 'Admin', password: bcrypt.hashSync('admin123', 8) },
      { username: 'arjunkumar', role: 'User', password: bcrypt.hashSync('user123', 8) },
      { username: 'nehasharma', role: 'User', password: bcrypt.hashSync('user123', 8) },
      { username: 'rahulgupta', role: 'User', password: bcrypt.hashSync('user123', 8) },
    ];

    await User.insertMany(users);
    console.log('Admin and users populated successfully.');
  } catch (error) {
    console.error('Error populating users:', error);
  } finally {
    process.exit();
  }
}

Populate();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const envFile = process.env.ENV_FILE || '.env';
require('dotenv').config({ path: envFile });
const connectDB = require('../config/db');

const getMongoTarget = (mongoUri) => {
  try {
    const parsedUri = new URL(mongoUri);
    const database = parsedUri.pathname && parsedUri.pathname !== '/' ? parsedUri.pathname.slice(1) : 'test';
    return `${parsedUri.hostname}/${database}`;
  } catch (error) {
    return 'Unable to parse MONGO_URI target';
  }
};

async function Populate() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(`MONGO_URI is not defined. Checked ${envFile}.`);
    }

    console.log(`Using env file: ${envFile}`);
    console.log(`Mongo target: ${getMongoTarget(process.env.MONGO_URI)}`);

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

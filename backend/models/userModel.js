const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  role: { type: String, enum: ['Admin', 'User'], required: true },
  password: String,
});

module.exports = mongoose.model('User', userSchema);

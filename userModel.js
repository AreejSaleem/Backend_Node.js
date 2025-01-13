const mongoose = require('mongoose');

// Define the schema for the User model
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  profilePic: {
    type: String, // URL to profile image
    default: '',  // Optional default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  attendance: [
    {
      date: {
        type: Date,
        default: Date.now,
        unique: true, // Prevent marking attendance multiple times per day
      },
      status: {
        type: String,
        enum: ['Present', 'Absent', 'On Leave'],
        default: 'Present',
      },
    },
  ],
  leaveRequests: [
    {
      requestDate: {
        type: Date,
        default: Date.now,
      },
      leaveDate: {
        type: Date,
        required: true,
      },
      reason: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
      },
    },
  ],
  grades: {
    type: String,
    default: 'N/A', // To store the grade based on attendance
  },
});

// Create a model based on the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
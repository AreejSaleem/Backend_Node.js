const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./db/connection'); // Import the connection file
const userRoutes = require('./routes/userroutes');
const adminRoutes = require('./routes/adminroutes');
const User = require('./models/userModel'); // Assuming you have a User model for database operations
//including cors

const cors = require('cors');
// Initialize dotenv for environment variables
dotenv.config();

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Connect to the database using connectDB
connectDB();
//CORS AUTHENTICATION 
// Enable CORS for frontend running on localhost:5500
const corsOptions = {
  origin: 'http://localhost:5500', // Allow frontend running on localhost:5500
  methods: 'GET, POST, PUT, DELETE', // Allow specific HTTP methods
  allowedHeaders: 'Content-Type, Authorization', // Allow specific headers
  origin:'*'
};

app.use(cors(corsOptions)); 
// ==================== Root Route ====================
app.get('/', (req, res) => {
  res.send('Server is running');
});

// ==================== User Routes ====================
// Register Route
app.post('/api/users/register', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Create new user
    const newUser = new User({ username, password });
    await newUser.save();
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error, please try again' });
  }
});

// Login Route
app.post('/api/users/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Validate password (consider using bcrypt for hashing in production)
    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    res.json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error, please try again' });
  }
});

// ==================== Admin Routes ====================
// Get all users (admin only)
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error, please try again' });
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Find and delete the user by ID
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error, please try again' });
  }
});

// ==================== Starting the server ====================
app.listen(5000, () => {
  //console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:5000`);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/error');

// Import routes
const authRoutes = require('./routes/authRoutes');
const issueRoutes = require('./routes/issueRoutes');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: "https://civicissues.vercel.app"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Civic Issue Reporting API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      issues: '/api/issues'
    }
  });
});

// Error handler middleware (should be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

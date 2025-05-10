const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// Update CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'https://parcial2front-omega.vercel.app'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// MongoDB connection with retry logic
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return false;
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'ok',
    database: dbStatus
  });
});

// Initialize DB connection
let retries = 0;
const maxRetries = 5;

const initializeDB = async () => {
  while (retries < maxRetries) {
    const connected = await connectDB();
    if (connected) break;
    
    retries++;
    console.log(`Retry attempt ${retries}/${maxRetries}`);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
};

initializeDB();

const questionRoutes = require('./routes/questionRoutes');
app.use('/api/questions', questionRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
});

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const connectWithRetry = async () => {
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority',
    // Allow connections from anywhere (required for Vercel)
    directConnection: true,
  };

  try {
    await mongoose.connect(process.env.MONGO_URI, options);
    console.log('MongoDB conectado');
  } catch (err) {
    console.error('Error de conexión MongoDB:', err);
    // Retry connection after 5 seconds
    setTimeout(connectWithRetry, 5000);
  }
};

// Initial connection
connectWithRetry();

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB desconectado - intentando reconectar...');
  connectWithRetry();
});

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

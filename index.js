const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const questionRoutes = require('./routes/questionRoutes');
app.use('/api/questions', questionRoutes);

const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority'
};

mongoose.connect(process.env.MONGO_URI, mongoOptions)
  .then(() => console.log('MongoDB conectado'))
  .catch(err => {
    console.error('Error de conexión MongoDB:', err);
    process.exit(1);
  });

mongoose.connection.on('error', err => {
  console.error('Error en la conexión MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB desconectado - intentando reconectar...');
});

app.listen(process.env.PORT, () => {
    console.log(`Servidor corriendo en puerto ${process.env.PORT}`);
});

// backend/server.js
import crypto from 'crypto';       // <-- 1. Agregado
global.crypto = crypto;            // <-- 2. Agregado

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'; // <-- 1. IMPORTAMOS DOTENV
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';

// 2. Ejecutamos dotenv para que Node lea tu archivo .env antes de hacer cualquier cosa
dotenv.config();

// 3. Conectamos a tu base de datos real (MongoDB Compass)
connectDB();

// 4. Inicializamos la aplicación de Express
const app = express();

// 5. Habilitamos los Middlewares Globales obligatorios
app.use(cors());          // Permite que React se comunique con Node sin bloqueos de seguridad
app.use(express.json());  // Permite al servidor leer el formato JSON que mandará el frontend

// 6. Declaramos los prefijos de las rutas de nuestra API REST
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Ruta de cortesía
app.get('/', (req, res) => {
  res.send('🚀 El Servidor de Boutique Chakon está activo, respaldado por MongoDB...');
});

// 7. Encendemos el servidor tomando el puerto del archivo .env (o 5000 por defecto)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo con éxito en http://localhost:${PORT}`);
});
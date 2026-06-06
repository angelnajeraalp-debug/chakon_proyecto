// backend/server.js
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';

// 1. Intentamos conectar de forma lógica a la base de datos simulada
connectDB();

// 2. Inicializamos la aplicación de Express
const app = express();

// 3. Habilitamos los Middlewares Globales obligatorios
app.use(cors());          // Permite que React se comunique con Node sin bloqueos de seguridad
app.use(express.json());  // Permite al servidor leer el formato JSON que mandará el frontend

// 4. Declaramos los prefijos de las rutas de nuestra API REST
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Ruta de cortesía por si entras a revisar directo desde el navegador
app.get('/', (req, res) => {
  res.send('🚀 El Servidor de la Boutique de Ropa está activo y respondiendo JSON...');
});

// 5. Encendemos el servidor en el puerto 5000
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo con éxito en http://localhost:${PORT}`);
});
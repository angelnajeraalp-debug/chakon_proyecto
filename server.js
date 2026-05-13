const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Mensaje de diagnóstico inicial
console.log("🚀 Iniciando el servidor del proyecto...");

// Conexión a MongoDB (Asegúrate de que tu .env tenga la variable MONGO_URI)
const mongoURI = process.env.MONGO_URI || 'tu_mongodb_uri_aqui';

mongoose.connect(mongoURI)
    .then(() => console.log("✅ Conexión exitosa a MongoDB Atlas"))
    .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));

// Rutas de prueba
app.get('/', (req, res) => {
    res.send('El Backend está funcionando correctamente para el Profe Sergio');
});

// Importar tus rutas (Ajusta los nombres según tus carpetas rescatadas)
// const authRoutes = require('./routes/auth');
// app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`📡 Servidor corriendo en el puerto ${PORT}`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
});
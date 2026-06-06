// backend/config/db.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Intenta conectarse usando la variable de entorno
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log("==================================================");
    console.log(`📡 MongoDB Conectado Oficialmente: ${conn.connection.host}`);
    console.log("==================================================");
  } catch (error) {
    console.error("==================================================");
    console.error(`❌ Error de conexión: ${error.message}`);
    console.error("==================================================");
    process.exit(1); // Detiene el servidor porque sin BD no podemos trabajar
  }
};

export default connectDB;
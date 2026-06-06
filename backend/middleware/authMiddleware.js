// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { mockUsers } from '../controllers/userController.js';

const protect = async (req, res, next) => {
  let token;

  // Verificamos si la petición incluye el token en los encabezados (Headers)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extraemos el token del string 'Bearer TOKEN_AQUÍ'
      token = req.headers.authorization.split(' ')[1];

      // Desciframos y validamos el token con la llave secreta
      const decoded = jwt.verify(token, "LlaveSecretaSuperSegura123");

      // Buscamos si el usuario de ese token realmente existe en la base de datos
      const userFound = mockUsers.find(u => u._id === decoded.id);
      
      if (!userFound) {
        return res.status(401).json({ message: 'No autorizado, usuario no encontrado' });
      }

      // Guardamos los datos del usuario en la petición para usarlo más adelante
      req.user = userFound;
      
      // 'next()' le dice al servidor que todo está en orden y puede continuar al controlador
      next();
    } catch (error) {
      return res.status(401).json({ message: 'No autorizado, token inválido o expirado' });
    }
  }

  // Si no se envió ningún token
  if (!token) {
    return res.status(401).json({ message: 'No hay token de seguridad, acceso denegado' });
  }
};

export default protect;
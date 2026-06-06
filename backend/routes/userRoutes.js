// backend/routes/userRoutes.js
import express from 'express';
import User from '../models/userModel.js';

const router = express.Router();

// LOGIN DE USUARIO (POST /api/users/login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Busca al usuario en la BD
    const user = await User.findOne({ email });

    // Para un proyecto real, la contraseña debe estar encriptada con bcrypt. 
    // Por ahora, validamos texto plano para pruebas rápidas.
    if (user && user.password === password) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        chakonPoints: user.chakonPoints,
        token: 'token-simulado-jwt-123' // Luego metemos JWT real si quieres
      });
    } else {
      res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor al intentar iniciar sesión' });
  }
});

// REGISTRO DE USUARIO (POST /api/users)
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Este correo ya está registrado' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'client',
      chakonPoints: 350 // Regalo de bienvenida
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        chakonPoints: user.chakonPoints,
        token: 'token-simulado-jwt-123'
      });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error al crear la cuenta' });
  }
});

export default router;
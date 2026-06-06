// backend/routes/userRoutes.js
import express from 'express';
import { registerUser, authUser } from '../controllers/userController.js';

const router = express.Router();

// Ruta para registrarse (POST /api/users)
router.post('/', registerUser);

// Ruta para iniciar sesión (POST /api/users/login)
router.post('/login', authUser);

export default router;
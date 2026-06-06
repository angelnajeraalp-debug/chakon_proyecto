// backend/controllers/userController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Base de datos simulada en la memoria del servidor para almacenar usuarios
export const mockUsers = [
  {
    _id: "usr_profe",
    name: "Profesor Evaluador",
    email: "profe@correo.com",
    // Esta es la contraseña "123456" encriptada de forma segura
    password: "$2a$10$X7mR9n7Lghg8yZ4uKvA7OOZfH8oVExvREkK9gK9pD3b7QZk7YbeZ." 
  }
];

// Función para generar un token JWT de acceso seguro
const generateToken = (id) => {
  return jwt.sign({ id }, "LlaveSecretaSuperSegura123", { expiresIn: '30d' });
};

// 1. REGISTRAR UN NUEVO USUARIO
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  
  const userExists = mockUsers.find(u => u.email === email);
  if (userExists) {
    return res.status(400).json({ message: 'El usuario ya existe' });
  }

  // Encriptamos la contraseña antes de guardarla
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = {
    _id: 'usr_' + Math.random().toString(36).substr(2, 9),
    name,
    email,
    password: hashedPassword
  };

  mockUsers.push(newUser);

  res.status(201).json({
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    token: generateToken(newUser._id)
  });
};

// 2. INICIAR SESIÓN (AUTENTICAR USUARIO)
export const authUser = async (req, res) => {
  const { email, password } = req.body;
  
  const user = mockUsers.find(u => u.email === email);
  
  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });
  } else {
    res.status(401).json({ message: 'Correo o contraseña incorrectos' });
  }
};
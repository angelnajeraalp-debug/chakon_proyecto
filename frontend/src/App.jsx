import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Inventario from './pages/Inventario';
import Catalogo from './pages/Catalogo';

// El "Guardián": Solo deja pasar al Inventario si hay token
const RutaPrivada = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* 1. Ruta Pública: Lo que ven tus clientes de Escobedo/Monterrey */}
                <Route path="/" element={<Catalogo />} />
                
                {/* 2. Autenticación */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* 3. Ruta de Dueño: Protegida para gestión de stock */}
                <Route 
                    path="/inventario" 
                    element={
                        <RutaPrivada>
                            <Inventario />
                        </RutaPrivada>
                    } 
                />
                
                {/* 4. Comodín: Si la ruta no existe, vuelve al inicio */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;
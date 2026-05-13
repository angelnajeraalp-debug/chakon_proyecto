import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './Login.jsx';

// Un componente rápido para que no marque error si no tienes el archivo de Inventario
const InventarioDummy = () => (
  <div style={{color: 'white', padding: '50px'}}>
    <h1>Panel de Inventario</h1>
    <p>¡Si ves esto, la redirección funcionó!</p>
    <button onClick={() => window.location.href = '/'}>Cerrar Sesión</button>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/inventario" element={<InventarioDummy />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
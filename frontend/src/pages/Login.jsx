import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const manejarLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            navigate('/inventario');
        } catch (error) {
            alert("Acceso denegado");
        }
    };

    return (
        <div style={styles.fondo}>
            <div style={styles.card}>
                <h2 style={styles.titulo}>SISTEMA DE GESTIÓN</h2>
                <div style={styles.divider}></div>
                <form onSubmit={manejarLogin}>
                    <input type="email" placeholder="Usuario" onChange={e => setEmail(e.target.value)} required style={styles.input} />
                    <input type="password" placeholder="Contraseña" onChange={e => setPassword(e.target.value)} required style={styles.input} />
                    <button type="submit" style={styles.boton}>ACCEDER</button>
                </form>
                <div style={styles.footer}>
                    <Link to="/register" style={styles.link}>Crear nueva cuenta de gestión</Link>
                </div>
            </div>
        </div>
    );
};

const styles = {
    fondo: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f4', fontFamily: 'Inter, sans-serif' },
    card: { background: '#fff', padding: '50px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', width: '320px', borderRadius: '8px' },
    titulo: { fontSize: '1rem', letterSpacing: '3px', textAlign: 'center', color: '#333', margin: '0' },
    divider: { height: '1px', width: '40px', background: '#000', margin: '20px auto 30px' },
    input: { width: '100%', padding: '15px', marginBottom: '15px', border: '1px solid #e0e0e0', borderRadius: '4px', boxSizing: 'border-box', outline: 'none', background: '#fcfcfc' },
    boton: { width: '100%', padding: '15px', background: '#222', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', letterSpacing: '2px', fontWeight: '600' },
    footer: { marginTop: '25px', textAlign: 'center' },
    link: { color: '#888', fontSize: '0.8rem', textDecoration: 'none' }
};

export default Login;
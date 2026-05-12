import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [claveSeguridad, setClaveSeguridad] = useState('');
    const [esAdmin, setEsAdmin] = useState(false);
    const navigate = useNavigate();

    const manejarRegistro = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/auth/register', { 
                nombre, email, password, claveSeguridad, esAdmin 
            });
            alert("¡Cuenta creada con éxito! Ya puedes iniciar sesión."); 
            navigate('/login');
        } catch (error) {
            alert("Error: " + (error.response?.data?.msg || "No se pudo completar el registro"));
        }
    };

    return (
        <div style={styles.fondo}>
            <div style={styles.card}>
                <h2 style={styles.titulo}>REGISTRO</h2>
                <form onSubmit={manejarRegistro}>
                    <input type="text" placeholder="Nombre completo" onChange={e => setNombre(e.target.value)} required style={styles.input} />
                    <input type="email" placeholder="Correo electrónico" onChange={e => setEmail(e.target.value)} required style={styles.input} />
                    <input type="password" placeholder="Contraseña" onChange={e => setPassword(e.target.value)} required style={styles.input} />
                    
                    <div style={styles.checkGroup}>
                        <input type="checkbox" id="admin" onChange={() => setEsAdmin(!esAdmin)} />
                        <label htmlFor="admin" style={styles.labelCheck}>¿Registrar como administrador?</label>
                    </div>

                    {esAdmin && (
                        <div style={styles.fade}>
                            <input 
                                type="text" 
                                placeholder="Clave de Acceso Administrativo" 
                                onChange={e => setClaveSeguridad(e.target.value)} 
                                required 
                                style={styles.inputAdmin} 
                            />
                            <p style={styles.info}>Introduce la clave maestra para activar permisos de inventario.</p>
                        </div>
                    )}

                    <button type="submit" style={styles.boton}>CREAR CUENTA</button>
                </form>
                <Link to="/login" style={styles.link}>Volver al inicio de sesión</Link>
            </div>
        </div>
    );
};

const styles = {
    fondo: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f4', fontFamily: 'sans-serif' },
    card: { background: '#fff', padding: '40px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '350px', borderRadius: '12px' },
    titulo: { letterSpacing: '2px', textAlign: 'center', fontSize: '1.2rem', marginBottom: '20px', color: '#333' },
    input: { width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' },
    checkGroup: { display: 'flex', alignItems: 'center', margin: '15px 0', gap: '10px' },
    labelCheck: { fontSize: '0.85rem', color: '#555' },
    inputAdmin: { width: '100%', padding: '12px', border: '2px solid #000', borderRadius: '6px', boxSizing: 'border-box', background: '#fff9c4' },
    info: { fontSize: '0.7rem', color: '#888', marginTop: '5px' },
    boton: { width: '100%', padding: '12px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' },
    link: { display: 'block', textAlign: 'center', marginTop: '20px', fontSize: '0.8rem', color: '#888', textDecoration: 'none' },
    fade: { animation: 'fadeIn 0.5s' }
};

export default Register;
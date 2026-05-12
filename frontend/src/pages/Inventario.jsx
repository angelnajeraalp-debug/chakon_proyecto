import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Instalación recomendada: npm install jwt-decode
import { jwtDecode } from "jwt-decode"; 

const Inventario = () => {
    const [productos, setProductos] = useState([]);
    const [nuevoProd, setNuevoProd] = useState({ nombre: '', precio: '', stock: '', categoria: '' });
    const [esAdmin, setEsAdmin] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Decodificamos el token para saber el rol
        try {
            const decoded = jwtDecode(token);
            if (decoded.user.rol === 'admin') {
                setEsAdmin(true);
            }
        } catch (error) {
            navigate('/login');
        }

        cargar();
    }, []);

    const cargar = async () => {
        const res = await axios.get('http://localhost:5000/api/products');
        setProductos(res.data);
    };

    const guardar = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        await axios.post('http://localhost:5000/api/products', nuevoProd, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setNuevoProd({ nombre: '', precio: '', stock: '', categoria: '' });
        cargar();
    };

    return (
        <div style={styles.container}>
            <nav style={styles.nav}>
                <h2>{esAdmin ? "Panel de Administración" : "Catálogo de Productos"}</h2>
                <div>
                    <button onClick={() => navigate('/')} style={styles.btnNav}>Ir a Tienda</button>
                    <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} style={styles.btnOut}>Cerrar Sesión</button>
                </div>
            </nav>

            {/* SOLO SE MUESTRA SI ES ADMIN */}
            {esAdmin && (
                <form onSubmit={guardar} style={styles.form}>
                    <h3 style={{color: '#fff'}}>Añadir Nuevo Artículo</h3>
                    <div style={styles.inputGroup}>
                        <input style={styles.input} type="text" placeholder="Producto" onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})} value={nuevoProd.nombre} required />
                        <input style={styles.input} type="number" placeholder="Precio" onChange={e => setNuevoProd({...nuevoProd, precio: e.target.value})} value={nuevoProd.precio} required />
                        <input style={styles.input} type="number" placeholder="Stock" onChange={e => setNuevoProd({...nuevoProd, stock: e.target.value})} value={nuevoProd.stock} required />
                        <input style={styles.input} type="text" placeholder="Categoría" onChange={e => setNuevoProd({...nuevoProd, categoria: e.target.value})} value={nuevoProd.categoria} required />
                        <button type="submit" style={styles.btnSave}>Guardar en Inventario</button>
                    </div>
                </form>
            )}

            <div style={styles.tableCard}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.headerRow}>
                            <th>Nombre</th><th>Precio</th>{esAdmin && <th>Stock</th>}<th>Categoría</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map(p => (
                            <tr key={p._id} style={styles.row}>
                                <td>{p.nombre}</td>
                                <td>${p.precio}</td>
                                {esAdmin && <td>{p.stock} pz</td>}
                                <td>{p.categoria}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ... los estilos se mantienen igual

const styles = {
    container: { padding: '30px', backgroundColor: '#121212', minHeight: '100vh', color: '#e0e0e0', fontFamily: 'Arial' },
    nav: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '15px' },
    form: { background: '#1e1e1e', padding: '25px', borderRadius: '12px', marginBottom: '40px' },
    inputGroup: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    input: { background: '#2c2c2c', border: '1px solid #444', color: '#fff', padding: '12px', borderRadius: '6px', flex: '1' },
    btnSave: { background: '#bb86fc', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    btnNav: { marginRight: '10px', background: 'transparent', border: '1px solid #bb86fc', color: '#bb86fc', padding: '8px 15px', borderRadius: '5px' },
    btnOut: { background: '#cf6679', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px' },
    tableCard: { background: '#1e1e1e', borderRadius: '12px', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    headerRow: { background: '#2c2c2c', textAlign: 'left' },
    row: { borderBottom: '1px solid #333' }
};

export default Inventario;
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Catalogo = () => {
    const [productos, setProductos] = useState([]);

    useEffect(() => {
        const cargar = async () => {
            const res = await axios.get('http://localhost:5000/api/products');
            setProductos(res.data);
        };
        cargar();
    }, []);

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.logo}>ESTUDIO DE MODA</h1>
                <p style={styles.subtitle}>Colección Exclusiva</p>
            </header>
            
            <div style={styles.grid}>
                {productos.map(p => (
                    <div key={p._id} style={styles.card}>
                        <div style={styles.imagePlaceholder}>👗</div>
                        <div style={styles.info}>
                            <span style={styles.category}>{p.categoria.toUpperCase()}</span>
                            <h3 style={styles.prodName}>{p.nombre}</h3>
                            <p style={styles.price}>${p.precio}</p>
                            <button style={styles.btnVer}>Explorar</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '40px', backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: "'Helvetica Neue', Arial, sans-serif" },
    header: { textAlign: 'center', marginBottom: '60px' },
    logo: { letterSpacing: '10px', fontSize: '2.2rem', fontWeight: '200', color: '#000', margin: '0' },
    subtitle: { color: '#999', fontSize: '0.9rem', marginTop: '10px', letterSpacing: '2px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '40px', maxWidth: '1200px', margin: '0 auto' },
    card: { background: '#fff', borderRadius: '4px', overflow: 'hidden', border: '1px solid #f0f0f0', transition: 'all 0.3s ease' },
    imagePlaceholder: { height: '300px', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px' },
    info: { padding: '25px', textAlign: 'left' },
    category: { fontSize: '9px', color: '#888', letterSpacing: '1.5px', fontWeight: 'bold' },
    prodName: { margin: '8px 0', fontSize: '1.1rem', color: '#222', fontWeight: '400' },
    price: { fontSize: '1.2rem', color: '#000', marginBottom: '20px' },
    btnVer: { width: '100%', padding: '12px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '1px' }
};

export default Catalogo;
// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Dirección de la API en el Backend que encendimos en el puerto 5000
const API_URL = 'http://localhost:5000/api';

export default function App() {
  // 1. Estados Globales de la Aplicación
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')) || null);
  const [isLogin, setIsLogin] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');

  // 2. Estados para los Formularios de Captura
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [productForm, setProductForm] = useState({ id: null, name: '', description: '', price: '', stock: '', category: '', imageUrl: '' });

  // Cargar las prendas automáticamente cuando entramos a la app
  useEffect(() => {
    fetchProducts();
  }, []);

  // Función asíncrona usando Axios para leer los productos del backend
  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/products`);
      setProducts(data);
    } catch (error) {
      alert('Error al conectar con el servidor para cargar el catálogo.');
    }
  };

  // CONTROLADOR: Manejar el envío de Login o Registro
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // Petición POST para Autenticar
        const { data } = await axios.post(`${API_URL}/users/login`, { email: authForm.email, password: authForm.password });
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
      } else {
        // Petición POST para Registrar un nuevo usuario
        const { data } = await axios.post(`${API_URL}/users`, authForm);
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error en las credenciales proporcionadas.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  // CRUD: Crear o Actualizar Producto
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    // Adjuntamos el token JWT en las cabeceras por seguridad tal como lo pide el middleware
    const config = { headers: { Authorization: `Bearer ${user.token}` } };

    try {
      if (productForm.id) {
        // [U] - UPDATE: Petición PUT para editar la prenda existente
        const { data } = await axios.put(`${API_URL}/products/${productForm.id}`, productForm, config);
        setProducts(products.map(p => p._id === productForm.id ? data : p));
        alert('Prenda modificada con éxito.');
      } else {
        // [C] - CREATE: Petición POST para registrar nueva prenda
        const { data } = await axios.post(`${API_URL}/products`, productForm, config);
        setProducts([...products, data]);
        alert('Nueva prenda añadida al catálogo.');
      }
      resetProductForm();
    } catch (error) {
      alert(error.response?.data?.message || 'Sesión inválida, por favor vuelve a ingresar.');
    }
  };

  // CRUD: [D] - DELETE: Eliminar una prenda
  const handleDeleteProduct = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta prenda del inventario?')) {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      try {
        await axios.delete(`${API_URL}/products/${id}`, config);
        setProducts(products.filter(p => p._id !== id));
      } catch (error) {
        alert('No se pudo eliminar el producto.');
      }
    }
  };

  // Cargar datos en el formulario para proceder a editar
  const handleEditSelect = (prod) => {
    setProductForm({
      id: prod._id,
      name: prod.name,
      description: prod.description,
      price: prod.price,
      stock: prod.stock,
      category: prod.category,
      imageUrl: prod.imageUrl
    });
  };

  const resetProductForm = () => {
    setProductForm({ id: null, name: '', description: '', price: '', stock: '', category: '', imageUrl: '' });
  };

  // MANIPULACIÓN REACTIVA: Filtramos en tiempo real sin recargar la página ni pedir datos extras al servidor
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  // VISTA 1: INTERFAZ DE ACCESO (Si el usuario no está logueado)
  if (!user) {
    return (
      <div className="auth-container">
        <h2>{isLogin ? 'Boutique Login' : 'Crear Cuenta'}</h2>
        <form onSubmit={handleAuthSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Nombre:</label>
              <input type="text" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
            </div>
          )}
          <div className="form-group">
            <label>Correo Electrónico:</label>
            <input type="email" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Contraseña:</label>
            <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
          </div>
          <button type="submit">{isLogin ? 'Entrar' : 'Registrarme'}</button>
        </form>
        <span className="toggle-link" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia Sesión'}
        </span>
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', background: '#eee', padding: '10px', borderRadius: '4px' }}>
          <strong>Credenciales Profe:</strong> profe@correo.com <br/> <strong>Pass:</strong> 123456
        </div>
      </div>
    );
  }

  // VISTA 2: PANEL PRINCIPAL DE ADMINISTRACIÓN (DASHBOARD)
  return (
    <div className="dashboard">
      <div className="header">
        <div>
          <h1>BOUTIQUE CHAKON</h1>
          <p>Operador/a: <strong>{user.name}</strong></p>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Cerrar Sesión</button>
      </div>

      <div className="main-content">
        {/* Formulario del CRUD para Capturar o Editar */}
        <div className="form-card">
          <h2>{productForm.id ? '🛠️ Modificar Prenda' : '➕ Registrar Prenda'}</h2>
          <form onSubmit={handleProductSubmit}>
            <div className="form-group">
              <label>Nombre de la Prenda:</label>
              <input type="text" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Descripción:</label>
              <textarea required value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Precio ($):</label>
              <input type="number" step="0.01" required value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Cantidad en Almacén:</label>
              <input type="number" required value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Categoría:</label>
              <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} required>
                <option value="">Seleccione una opción...</option>
                <option value="Vestidos">Vestidos</option>
                <option value="Chaquetas">Chaquetas</option>
                <option value="Blusas">Blusas</option>
                <option value="Pantalones">Pantalones</option>
              </select>
            </div>
            <div className="form-group">
              <label>Enlace de Imagen (Opcional):</label>
              <input type="text" value={productForm.imageUrl} onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} placeholder="https://ejemplo.com/foto.jpg" />
            </div>
            <button type="submit">{productForm.id ? 'Guardar Cambios' : 'Dar de Alta Prenda'}</button>
            {productForm.id && <button type="button" style={{backgroundColor: '#777', marginTop: '10px'}} onClick={resetProductForm}>Cancelar Edición</button>}
          </form>
        </div>

        {/* Listado del Inventario y Buscador interactivo */}
        <div className="products-box">
          <h2>Inventario General de Moda</h2>
          <input 
            type="text" 
            className="search-bar" 
            placeholder="🔍 Filtrar por nombre de prenda o categoría al instante..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div className="products-grid">
            {filteredProducts.map(prod => (
              <div key={prod._id} className="product-card">
                <img src={prod.imageUrl} alt={prod.name} />
                <div className="product-info">
                  <h3>{prod.name}</h3>
                  <p style={{fontSize: '13px', color: '#666'}}>{prod.description}</p>
                  <p>Categoría: <strong>{prod.category}</strong></p>
                  <p>Stock: <strong>{prod.stock} unidades</strong></p>
                  <p className="price">${Number(prod.price).toFixed(2)} MXN</p>
                </div>
                <div className="actions">
                  <button className="btn-edit" onClick={() => handleEditSelect(prod)}>Editar</button>
                  <button className="btn-delete" onClick={() => handleDeleteProduct(prod._id)}>Eliminar</button>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && <p style={{color: '#999'}}>No hay ninguna prenda que coincida con tu búsqueda.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
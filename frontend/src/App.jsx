// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const SECRET_ADMIN_KEY = 'CHAKON_STAFF_2026';

export default function App() {
  // --- ESTADOS GLOBAL SISTEMA ---
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')) || null);
  const [isLogin, setIsLogin] = useState(true);
  const [products, setProducts] = useState([]);
  
  // --- ESTADOS FILTROS AVANZADOS ---
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [maxPrice, setMaxPrice] = useState(2500);

  // --- ESTADO PUNTO DE VENTA (BOLSA DE COMPRA) ---
  const [cart, setCart] = useState([]);

  // --- ESTADOS FORMULARIOS ---
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [productForm, setProductForm] = useState({ id: null, name: '', description: '', price: '', stock: '', category: '', imageUrl: '' });
  
  // --- ESTADOS DE SEGURIDAD INTERNA ---
  const [isStaffRegister, setIsStaffRegister] = useState(false);
  const [staffKey, setStaffKey] = useState('');

  // --- NUEVOS ESTADOS: CUPONES, TOASTS Y TICKET ---
  const [toasts, setToasts] = useState([]);
  const [coupon, setCoupon] = useState('');
  const [discountRate, setDiscountRate] = useState(0); 
  const [showTicket, setShowTicket] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  // --- CONTROLADOR DE NOTIFICACIONES TOAST ---
  const triggerToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/products`);
      setProducts(data);
    } catch (error) {
      triggerToast('Error en conexión activa con el servidor API.', 'error');
    }
  };

  // --- CONTROL ACCESOS BLINDADO ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const { data } = await axios.post(`${API_URL}/users/login`, { email: authForm.email, password: authForm.password });
        let assignedRole = data.role || 'client';
        
        if (isStaffRegister && staffKey === SECRET_ADMIN_KEY) {
          assignedRole = 'admin';
        }

        const userSession = { ...data, role: assignedRole };
        setUser(userSession);
        localStorage.setItem('userInfo', JSON.stringify(userSession));
        
        triggerToast(`Bienvenido, ${data.name || 'Usuario'}. Rol: ${assignedRole.toUpperCase()}`, 'success');
      } else {
        let finalRole = 'client';
        if (isStaffRegister) {
          if (staffKey === SECRET_ADMIN_KEY) {
            finalRole = 'admin';
            triggerToast('Código de Staff verificado.', 'success');
          } else {
            triggerToast('Código incorrecto. Cuenta creada como Cliente.', 'error');
          }
        }
        
        const payload = { ...authForm, role: finalRole };
        const { data } = await axios.post(`${API_URL}/users`, payload);
        
        const userWithRole = { ...data, role: finalRole };
        setUser(userWithRole);
        localStorage.setItem('userInfo', JSON.stringify(userWithRole));
      }
    } catch (error) {
      triggerToast(error.response?.data?.message || 'Error de autenticación.', 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setDiscountRate(0);
    setCoupon('');
    localStorage.removeItem('userInfo');
    triggerToast('Sesión finalizada con éxito.', 'info');
  };

  // --- OPERACIONES CRUD PROTEGIDAS ---
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (user.role !== 'admin') return triggerToast('Acción denegada.', 'error');
    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    try {
      if (productForm.id) {
        const { data } = await axios.put(`${API_URL}/products/${productForm.id}`, productForm, config);
        setProducts(products.map(p => p._id === productForm.id ? data : p));
        triggerToast('Producto actualizado correctamente.', 'success');
      } else {
        const { data } = await axios.post(`${API_URL}/products`, productForm, config);
        setProducts([...products, data]);
        triggerToast('Nuevo producto ingresado al almacén.', 'success');
      }
      resetProductForm();
    } catch (error) {
      triggerToast('Error de privilegios JWT.', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (user.role !== 'admin') return triggerToast('Acción denegada.', 'error');
    if (window.confirm('¿Confirmar baja definitiva del artículo?')) {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      try {
        await axios.delete(`${API_URL}/products/${id}`, config);
        setProducts(products.filter(p => p._id !== id));
        setCart(cart.filter(item => item._id !== id));
        triggerToast('Artículo purgado del inventario.', 'info');
      } catch (error) {
        triggerToast('Error al eliminar.', 'error');
      }
    }
  };

  // --- LÓGICA BOLSA DE COMPRA ---
  const addToCart = (product) => {
    if (product.stock <= 0) return triggerToast('Artículo agotado en inventario.', 'error');
    const exist = cart.find(item => item._id === product._id);
    if (exist && exist.qty >= product.stock) return triggerToast(`Límite de stock real alcanzado (${product.stock} u.)`, 'error');
    
    if (exist) {
      setCart(cart.map(item => item._id === product._id ? { ...exist, qty: exist.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    triggerToast(`"${product.name}" añadido a la bolsa 🛍️`, 'success');
  };

  const removeFromCart = (id) => {
    const exist = cart.find(item => item._id === id);
    if (exist.qty === 1) {
      setCart(cart.filter(item => item._id !== id));
    } else {
      setCart(cart.map(item => item._id === id ? { ...exist, qty: exist.qty - 1 } : item));
    }
    triggerToast('Cantidad reducida de la bolsa.', 'info');
  };

  // --- LÓGICA SISTEMA DE CUPONES ---
  const handleApplyCoupon = () => {
    if (coupon.toUpperCase() === 'CHAKON10') {
      setDiscountRate(0.10);
      triggerToast('¡Cupón CHAKON10 aplicado! 10% de descuento concedido.', 'success');
    } else if (coupon.trim() === '') {
      setDiscountRate(0);
    } else {
      triggerToast('Cupón no válido o caducado.', 'error');
      setDiscountRate(0);
    }
  };

  const checkoutSales = async () => {
    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    try {
      for (const item of cart) {
        await axios.put(`${API_URL}/products/${item._id}`, { ...item, stock: item.stock - item.qty }, config);
      }
      
      // Guardar la información para renderizar el ticket físico/digital
      setCompletedSale({
        ticketId: `CK-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toLocaleString('es-MX'),
        items: [...cart],
        subtotal: subtotalCart,
        discount: discountAmount,
        iva: ivaCart,
        total: totalCart,
        operator: user.name
      });
      
      setCart([]);
      setCoupon('');
      setDiscountRate(0);
      setShowTicket(true); // Desplegar modal de boleto
      fetchProducts();
    } catch (error) {
      triggerToast('Error al procesar la venta.', 'error');
    }
  };

  // --- OPERACIONES MATEMÁTICAS INTERNAS ---
  const subtotalCart = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const discountAmount = subtotalCart * discountRate;
  const subtotalConDescuento = subtotalCart - discountAmount;
  const ivaCart = subtotalConDescuento * 0.16;
  const totalCart = subtotalConDescuento + ivaCart;

  const totalInversion = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
  const totalPrendas = products.reduce((acc, p) => acc + Number(p.stock), 0);
  const stockCritico = products.filter(p => p.stock < 10).length;

  const filteredProducts = products.filter(p => {
    return (p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())) &&
           (selectedCategory === 'Todas' || p.category === selectedCategory) &&
           (Number(p.price) <= maxPrice);
  });

  const handleEditSelect = (prod) => {
    if (user.role !== 'admin') return;
    setProductForm({ id: prod._id, name: prod.name, description: prod.description, price: prod.price, stock: prod.stock, category: prod.category, imageUrl: prod.imageUrl });
  };

  const resetProductForm = () => {
    setProductForm({ id: null, name: '', description: '', price: '', stock: '', category: '', imageUrl: '' });
  };

  const getCategoryColor = (cat) => {
    const colors = { Vestidos: '#e83e8c', Chaquetas: '#fd7e14', Blusas: '#20c997', Pantalones: '#007bff' };
    return colors[cat] || '#6c757d';
  };

  return (
    <>
      {/* SECCIÓN HOVER, ACTIVE Y KEYFRAMES PREMIUM */}
      <style>{`
        /* ANIMACIONES TOASTS */
        .toast-container { position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px; }
        .toast-item { 
          padding: 14px 24px; min-width: 280px; border-radius: 8px; color: #fff; font-family: sans-serif; font-size: 13px; font-weight: 600;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25); animation: toastIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          display: flex; align-items: center; justify-content: space-between;
        }
        @keyframes toastIn { from { transform: translateX(120%) scale(0.9); opacity: 0; } to { transform: translateX(0) scale(1); opacity: 1; } }
        
        /* BOTONES INTERACTIVOS */
        .btn-premium-auth {
          width: 100%; padding: 14px; background: #d4af37; border: none; border-radius: 8px;
          color: #111; fontSize: 14px; fontWeight: bold; text-transform: uppercase; cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); box-shadow: 0 4px 15px rgba(212,175,55,0.2);
        }
        .btn-premium-auth:hover { background: #f1c40f; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(212,175,55,0.4); }
        .btn-premium-auth:active { transform: translateY(1px); box-shadow: 0 2px 10px rgba(212,175,55,0.2); }
        
        .link-toggle-auth { color: #aaa; cursor: pointer; transition: color 0.2s ease, text-shadow 0.2s ease; }
        .link-toggle-auth:hover { color: #fff; text-shadow: 0 0 8px rgba(255,255,255,0.4); }
        
        .btn-add-cart {
          width: auto; padding: 6px 14px; background: #111; color: #fff; fontSize: 12px; 
          border: 1px solid #111; cursor: pointer; transition: all 0.25s ease; border-radius: 4px; fontWeight: 600;
        }
        .btn-add-cart:hover { background: #d4af37; color: #111; border-color: #d4af37; transform: scale(1.05); }
        .btn-add-cart:active { transform: scale(0.95); }
        
        .btn-action-edit {
          flex: 1; padding: 6px; font-size: 11px; background: #e3f2fd; color: #0d47a1; 
          border: 1px solid #bbdefb; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; fontWeight: bold;
        }
        .btn-action-edit:hover { background: #0d47a1; color: #fff; transform: translateY(-1px); }
        
        .btn-action-delete {
          flex: 1; padding: 6px; font-size: 11px; background: #ffebee; color: #c62828; 
          border: 1px solid #ffcdd2; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; fontWeight: bold;
        }
        .btn-action-delete:hover { background: #c62828; color: #fff; transform: translateY(-1px); }

        .btn-cart-qty {
          padding: 2px 10px; width: auto; color: #fff; border: none; cursor: pointer; 
          transition: transform 0.1s ease, filter 0.2s ease; font-weight: bold; border-radius: 3px;
        }
        .btn-cart-qty:hover { filter: brightness(1.2); transform: scale(1.1); }
        
        /* OVERLAY MODAL TICKET */
        .modal-overlay {
          position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px); display:flex; justify-content:center; align-items:center; z-index:9999;
        }
        .ticket-paper {
          background: #fff; color:#000; font-family: 'Courier New', Courier, monospace;
          padding: 30px; width: 100%; maxWidth: 380px; box-shadow: 0 15px 40px rgba(0,0,0,0.5);
          border-top: 8px dashed #d4af37; animation: ticketRoll 0.5s ease-out forwards;
        }
        @keyframes ticketRoll { from { transform: translateY(-30px); opacity:0; } to { transform: translateY(0); opacity:1; } }
      `}</style>

      {/* CONTENEDOR DE NOTIFICACIONES TOAST */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast-item" style={{ 
            background: t.type === 'success' ? '#111' : t.type === 'error' ? '#c62828' : '#0d47a1',
            borderLeft: t.type === 'success' ? '5px solid #d4af37' : 'none'
          }}>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* MODAL: TICKET DIGITAL ESTILO BOUTIQUE LUXURY */}
      {showTicket && completedSale && (
        <div className="modal-overlay">
          <div className="ticket-paper">
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0, fontSize: '22px', letterSpacing: '4px'}}>CHAKON</h2>
              <p style={{margin: '2px 0', fontSize: '11px', textTransform: 'uppercase'}}>Haute Couture POS Terminal</p>
              <p style={{margin: '5px 0', fontSize: '12px', color: '#555'}}>-------------------------</p>
            </div>
            <div style={{fontSize: '12px', marginBottom: '15px'}}>
              <div><strong>TICKET:</strong> {completedSale.ticketId}</div>
              <div><strong>FECHA:</strong> {completedSale.date}</div>
              <div><strong>ATENDIÓ:</strong> {completedSale.operator}</div>
            </div>
            <p style={{margin: '5px 0', fontSize: '12px', color: '#555'}}>-------------------------</p>
            <div style={{maxHeight: '150px', overflowY: 'auto', fontSize: '12px'}}>
              {completedSale.items.map((item, index) => (
                <div key={index} style={{display: 'flex', justifyContent: 'space-between', margin: '5px 0'}}>
                  <span>{item.qty}x {item.name.substring(0, 18)}</span>
                  <span>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <p style={{margin: '5px 0', fontSize: '12px', color: '#555'}}>-------------------------</p>
            <div style={{fontSize: '13px', textAlign: 'right', lineHeight: '1.6'}}>
              <div>Subtotal: ${completedSale.subtotal.toFixed(2)}</div>
              {completedSale.discount > 0 && <div style={{color: '#c62828'}}>Desc. Cupón: -${completedSale.discount.toFixed(2)}</div>}
              <div>IVA (16%): ${completedSale.iva.toFixed(2)}</div>
              <div style={{fontSize: '16px', fontWeight: 'bold', marginTop: '5px'}}>TOTAL: ${completedSale.total.toFixed(2)} MXN</div>
            </div>
            <div style={{marginTop: '25px', display: 'flex', gap: '10px'}}>
              <button onClick={() => window.print()} style={{flex: 1, padding: '10px', background: '#111', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold'}}>Imprimir</button>
              <button onClick={() => setShowTicket(false)} style={{flex: 1, padding: '10px', background: '#ccc', color: '#000', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold'}}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          VIEW 1: VISTA DE AUTENTICACIÓN
          ========================================== */}
      {!user ? (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
          background: 'linear-gradient(135deg, #1e1e1e 0%, #111111 100%)', fontFamily: '"Montserrat", "Segoe UI", sans-serif', padding: '20px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '40px 50px',
            width: '100%', maxWidth: '440px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)', textAlign: 'center'
          }}>
            
            <div style={{ marginBottom: '30px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '6px', color: '#ffffff', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Chakon</h1>
              <p style={{ color: '#d4af37', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '3px', margin: 0 }}>
                Haute Couture • Control System
              </p>
            </div>

            <h2 style={{ fontSize: '17px', color: '#eee', marginBottom: '25px', fontWeight: '400', letterSpacing: '1px' }}>
              {isLogin ? 'Acceso Seguro al Sistema' : 'Crear Cuenta de Cliente'}
            </h2>

            <form onSubmit={handleAuthSubmit} style={{ textAlign: 'left' }}>
              {!isLogin && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase' }}>Nombre Completo</label>
                  <input type="text" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} placeholder="Angel Nájera" />
                </div>
              )}

              <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                <span onClick={() => { setIsStaffRegister(!isStaffRegister); setStaffKey(''); }} className="link-toggle-auth" style={{ fontSize: '12px', color: isStaffRegister ? '#d4af37' : '#aaa', textDecoration: 'underline' }}>
                  {isStaffRegister ? '✓ Modo Cliente Normal' : '¿Ingresar como Personal / Staff?'}
                </span>
              </div>

              {isStaffRegister && (
                <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(212,175,55,0.05)', border: '1px dashed #d4af37', borderRadius: '8px' }}>
                  <label style={{ display: 'block', color: '#d4af37', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 'bold' }}>Clave de Verificación Interna</label>
                  <input type="password" value={staffKey} onChange={e => setStaffKey(e.target.value)} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #d4af37', borderRadius: '6px', color: '#fff', outline: 'none' }} placeholder="Introduce el Token de Administrador" required />
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase' }}>Correo Electrónico</label>
                <input type="email" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} placeholder="usuario@correo.com" />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase' }}>Contraseña</label>
                <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} placeholder="••••••••" />
              </div>

              <button type="submit" className="btn-premium-auth">
                {isLogin ? 'Ingresar a la Terminal' : 'Registrar Perfil Seguro'}
              </button>
            </form>

            <div style={{ marginTop: '25px', fontSize: '13px' }}>
              <span onClick={() => { setIsLogin(!isLogin); setIsStaffRegister(false); setStaffKey(''); setAuthForm({ name: '', email: '', password: '' }); }} className="link-toggle-auth" style={{ textDecoration: 'underline' }}>
                {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia Sesión'}
              </span>
            </div>

          </div>
        </div>
      ) : (
        /* ==========================================
           VIEW 2: DASHBOARD
           ========================================== */
        <div className="dashboard">
          <div className="header" style={{borderBottom: '3px solid #111'}}>
            <div>
              <h1 style={{fontSize: '32px', fontWeight: '900', letterSpacing: '4px', margin: 0}}>BOUTIQUE CHAKON</h1>
              <p style={{margin: '5px 0 0 0', color: '#555', fontSize: '14px'}}>
                {user.role === 'admin' ? '🔒 Panel Ejecutivo Administrativo' : '🛍️ Catálogo de Exclusividades'} • Cuenta: <span style={{color: '#d4af37', fontWeight: 'bold'}}>{user.name} ({user.role === 'admin' ? 'Staff' : 'Cliente'})</span>
              </p>
            </div>
            <div style={{display: 'flex', gap: '10px'}}>
              <button className="btn-logout" style={{borderRadius: '4px', padding: '8px 15px'}} onClick={handleLogout}>Cerrar Sesión</button>
            </div>
          </div>

          {user.role === 'admin' && (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px'}}>
              <div style={{background: '#111', color: '#fff', padding: '20px', borderRadius: '4px'}}>
                <p style={{margin: '0 0 5px 0', fontSize: '11px', textTransform: 'uppercase', color: '#aaa'}}>Capital Activos</p>
                <h3 style={{margin: 0, fontSize: '26px', color: '#d4af37'}}>${totalInversion.toLocaleString('es-MX', {minimumFractionDigits:2})} MXN</h3>
              </div>
              <div style={{background: '#fff', padding: '20px', borderRadius: '4px', border: '1px solid #e0e0e0'}}>
                <p style={{margin: '0 0 5px 0', fontSize: '11px', textTransform: 'uppercase', color: '#777'}}>Stock Global</p>
                <h3 style={{margin: 0, fontSize: '26px', color: '#111'}}>{totalPrendas} U.</h3>
              </div>
              <div style={{background: stockCritico > 0 ? '#fff3cd' : '#fff', padding: '20px', borderRadius: '4px', border: '1px solid #e0e0e0'}}>
                <p style={{margin: '0 0 5px 0', fontSize: '11px', textTransform: 'uppercase', color: '#856404'}}>Rupturas Stock</p>
                <h3 style={{margin: 0, fontSize: '26px', color: stockCritico > 0 ? '#dc3545' : '#28a745'}}>{stockCritico} Modelos</h3>
              </div>
            </div>
          )}

          <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '30px'}} className="main-content-layout">
            <div style={{display: 'grid', gridTemplateColumns: user.role === 'admin' ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', gap: '30px'}}>
              
              {user.role === 'admin' && (
                <div className="form-card" style={{height: 'fit-content'}}>
                  <h2 style={{fontSize: '18px', textTransform: 'uppercase', paddingBottom: '10px', borderBottom: '2px solid #eee'}}>{productForm.id ? '🛠️ Re-evaluar Producto' : '➕ Adición Almacén'}</h2>
                  <form onSubmit={handleProductSubmit}>
                    <div className="form-group"><label>Línea/Modelo:</label><input type="text" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} /></div>
                    <div className="form-group"><label>Descripción:</label><textarea rows="2" required value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                      <div className="form-group"><label>Precio:</label><input type="number" step="0.01" required value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} /></div>
                      <div className="form-group"><label>Stock:</label><input type="number" required value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} /></div>
                    </div>
                    <div className="form-group">
                      <label>Familia Ropa:</label>
                      <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} required>
                        <option value="">Seleccione...</option><option value="Vestidos">Vestidos</option><option value="Chaquetas">Chaquetas</option><option value="Blusas">Blusas</option><option value="Pantalones">Pantalones</option>
                      </select>
                    </div>
                    <div className="form-group"><label>URL Imagen:</label><input type="text" value={productForm.imageUrl} onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} /></div>
                    <button type="submit" style={{marginTop: '10px'}}>{productForm.id ? 'Salvar Ajustes' : 'Consolidar Producto'}</button>
                    {productForm.id && <button type="button" style={{backgroundColor: '#6c757d', marginTop: '5px'} } onClick={resetProductForm}>Abortar</button>}
                  </form>
                </div>
              )}

              {/* INTEGRACIÓN BOLSA DE COMPRAS + SISTEMA DE CUPÓN */}
              <div style={{background: '#fff', padding: '20px', borderRadius: '4px', border: '1px solid #e0e0e0', height: 'fit-content'}}>
                <h2 style={{fontSize: '18px', textTransform: 'uppercase', paddingBottom: '10px', borderBottom: '2px solid #eee'}}>
                  {user.role === 'admin' ? '🛒 Terminal POS' : '🛍️ Mi Bolsa'}
                </h2>
                {cart.length === 0 ? (
                  <p style={{color: '#999', textAlign: 'center', padding: '40px 0'}}>Bolsa vacía.</p>
                ) : (
                  <div>
                    <div style={{maxHeight: '220px', overflowY: 'auto', marginBottom: '15px'}}>
                      {cart.map(item => (
                        <div key={item._id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed #eee'}}>
                          <div>
                            <strong style={{fontSize: '14px'}}>{item.name}</strong>
                            <p style={{margin: 0, fontSize: '12px', color: '#666'}}>{item.qty}u x ${item.price}</p>
                          </div>
                          <div style={{display: 'flex', gap: '5px'}}>
                            <button onClick={() => addToCart(item)} className="btn-cart-qty" style={{backgroundColor: '#28a745'}}>+</button>
                            <button onClick={() => removeFromCart(item._id)} className="btn-cart-qty" style={{backgroundColor: '#dc3545'}}>-</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* INTERFAZ DEL CUPÓN */}
                    <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                      <input type="text" placeholder="¿Tienes un cupón? (Ej: CHAKON10)" value={coupon} onChange={e => setCoupon(e.target.value)} style={{padding: '8px', fontSize: '12px', flex: 1, border: '1px solid #ccc', borderRadius: '4px'}} />
                      <button onClick={handleApplyCoupon} style={{width: 'auto', background: '#111', color: '#fff', fontSize: '11px', padding: '0 15px', borderRadius: '4px'}}>Aplicar</button>
                    </div>

                    <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '4px', fontSize: '14px', border: '1px solid #eee', marginBottom: '15px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Subtotal:</span><span>${subtotalCart.toFixed(2)}</span></div>
                      {discountAmount > 0 && <div style={{display: 'flex', justifyContent: 'space-between', color: '#c62828'}}><span>Descuento:</span><span>-${discountAmount.toFixed(2)}</span></div>}
                      <div style={{display: 'flex', justifyContent: 'space-between', color: '#666'}}><span>IVA (16%):</span><span>${ivaCart.toFixed(2)}</span></div>
                      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', paddingTop: '5px', borderTop: '1px solid #ccc', marginTop: '5px'}}>
                        <span>TOTAL:</span><span style={{color: '#28a745'}}>${totalCart.toFixed(2)} MXN</span>
                      </div>
                    </div>
                    <button onClick={checkoutSales} style={{backgroundColor: '#28a745'}}>Procesar Operación</button>
                  </div>
                )}
              </div>
            </div>

            <div className="products-box">
              <h2 style={{fontSize: '18px', textTransform: 'uppercase', marginBottom: '15px'}}>Colección Disponible</h2>
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px', background: '#f8f9fa', padding: '15px', borderRadius: '4px', border: '1px solid #eee'}}>
                <div>
                  <label style={{fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Búsqueda:</label>
                  <input type="text" placeholder="Buscar prenda..." value={search} onChange={e => setSearch(e.target.value)} style={{padding: '8px'}} />
                </div>
                <div>
                  <label style={{fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Categoría:</label>
                  <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{padding: '8px'}}>
                    <option value="Todas">Todas</option><option value="Vestidos">Vestidos</option><option value="Chaquetas">Chaquetas</option><option value="Blusas">Blusas</option><option value="Pantalones">Pantalones</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Precio Máx: (${maxPrice} MXN)</label>
                  <input type="range" min="0" max="2500" step="50" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} style={{marginTop: '10px'}} />
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px'}} className="products-grid">
                {filteredProducts.map(prod => (
                  <div key={prod._id} className="product-card" style={{borderRadius: '4px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #eee', overflow: 'hidden'}}>
                    <div>
                      <div style={{position: 'relative'}}>
                        <img src={prod.imageUrl} alt={prod.name} style={{height: '180px', width: '100%', objectFit: 'cover'}} />
                        <span style={{position: 'absolute', top: '8px', left: '8px', backgroundColor: getCategoryColor(prod.category), color: '#fff', padding: '3px 8px', fontSize: '10px', fontWeight: 'bold', borderRadius: '10px', textTransform: 'uppercase'}}>{prod.category}</span>
                      </div>
                      <div className="product-info" style={{padding: '12px'}}>
                        <h3 style={{fontSize: '15px', margin: '0 0 5px 0'}}>{prod.name}</h3>
                        <p style={{fontSize: '12px', color: '#666', height: '32px', overflow: 'hidden', margin: '0 0 10px 0'}}>{prod.description}</p>
                        
                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px'}}>
                          <span>Stock:</span>
                          <strong style={{color: prod.stock < 5 ? '#dc3545' : '#28a745'}}>{prod.stock} pzas</strong>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div style={{padding: '0 12px 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{fontSize: '16px', fontWeight: 'bold', color: '#111'}}>${Number(prod.price).toFixed(2)}</span>
                        <button onClick={() => addToCart(prod)} className="btn-add-cart">+ Añadir</button>
                      </div>
                      
                      {user.role === 'admin' && (
                        <div className="actions" style={{padding: '8px 12px', background: '#f8f9fa', display: 'flex', gap: '8px', borderTop: '1px solid #eee'}}>
                          <button className="btn-action-edit" onClick={() => handleEditSelect(prod)}>Editar</button>
                          <button className="btn-action-delete" onClick={() => handleDeleteProduct(prod._id)}>Baja</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
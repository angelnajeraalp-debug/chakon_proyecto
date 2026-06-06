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
  const [productForm, setProductForm] = useState({ id: null, name: '', description: '', price: '', stock: '', category: '', imageUrl: '' });
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  
  // --- ESTADOS DE SEGURIDAD INTERNA ---
  const [isStaffRegister, setIsStaffRegister] = useState(false);
  const [staffKey, setStaffKey] = useState('');

  // --- MODULOS PREMIUM: CUPONES, TOASTS, TICKET ---
  const [toasts, setToasts] = useState([]);
  const [coupon, setCoupon] = useState('');
  const [discountRate, setDiscountRate] = useState(0); 
  const [showTicket, setShowTicket] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  // --- MODAL Y CONFIGURACIONES ---
  const [darkMode, setDarkMode] = useState(true);
  const [walletPoints, setWalletPoints] = useState(Number(localStorage.getItem('chakonPoints')) || 350); 
  const [applyPoints, setApplyPoints] = useState(false);
  const [quickScanId, setQuickScanId] = useState('');
  
  // --- SISTEMA DE AUDIO Y CONFIGURACIÓN ---
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundType, setSoundType] = useState('moderno'); // moderno, retro, click
  const [terminalLogs, setTerminalLogs] = useState([`[${new Date().toLocaleTimeString()}] Sistema de control inicializado.`]);

  // --- ESTADOS NUEVOS PARA DROPDOWNS CUSTOM ---
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [formDropdownOpen, setFormDropdownOpen] = useState(false);

  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('chakonPoints', walletPoints);
  }, [walletPoints]);

  // --- SINTETIZADOR DE AUDIO NATIVO ---
  const playTerminalSound = (actionType = 'click') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (soundType === 'moderno') {
        if (actionType === 'click') {
          osc.frequency.setValueAtTime(500, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
          osc.start(); osc.stop(ctx.currentTime + 0.08);
        } else if (actionType === 'success') {
          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
          osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
          gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc.start(); osc.stop(ctx.currentTime + 0.25);
        } else if (actionType === 'error') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220, ctx.currentTime);
          osc.frequency.setValueAtTime(180, ctx.currentTime + 0.08);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.start(); osc.stop(ctx.currentTime + 0.2);
        }
      } else if (soundType === 'retro') {
        osc.type = 'square';
        if (actionType === 'click') {
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
          osc.start(); osc.stop(ctx.currentTime + 0.05);
        } else if (actionType === 'success') {
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.setValueAtTime(900, ctx.currentTime + 0.06);
          osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.12);
          gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
          osc.start(); osc.stop(ctx.currentTime + 0.25);
        } else if (actionType === 'error') {
          osc.frequency.setValueAtTime(150, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
          osc.start(); osc.stop(ctx.currentTime + 0.25);
        }
      } else if (soundType === 'click') {
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
        osc.start(); osc.stop(ctx.currentTime + 0.02);
      }
    } catch (e) {
      console.warn("Audio Context bloqueado o no soportado.");
    }
  };

  const triggerToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [`[${timestamp}] (${type.toUpperCase()}) ${msg}`, ...prev].slice(0, 30));

    if (type === 'success') playTerminalSound('success');
    else if (type === 'error') playTerminalSound('error');
    else playTerminalSound('click');

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
        triggerToast(`Acceso Concedido: ${assignedRole.toUpperCase()}`, 'success');
      } else {
        let finalRole = 'client';
        if (isStaffRegister) {
          if (staffKey === SECRET_ADMIN_KEY) {
            finalRole = 'admin';
            triggerToast('Código de Staff verificado.', 'success');
          } else {
            triggerToast('Código incorrecto. Modo Cliente.', 'error');
          }
        }
        const payload = { ...authForm, role: finalRole };
        const { data } = await axios.post(`${API_URL}/users`, payload);
        const userWithRole = { ...data, role: finalRole };
        setUser(userWithRole);
        localStorage.setItem('userInfo', JSON.stringify(userWithRole));
      }
    } catch (error) {
      triggerToast('Error de credenciales.', 'error');
    }
  };

  const handleLogout = () => {
    playTerminalSound('error');
    setUser(null);
    setCart([]);
    setDiscountRate(0);
    setCoupon('');
    setApplyPoints(false);
    localStorage.removeItem('userInfo');
    triggerToast('Sesión cerrada de forma segura.', 'info');
  };

  const handleQuickScan = (e) => {
    e.preventDefault();
    if (!quickScanId.trim()) return;
    const found = products.find(p => p._id.endsWith(quickScanId) || p._id === quickScanId);
    if (found) {
      addToCart(found);
      setQuickScanId('');
      triggerToast('Código detectado por terminal.', 'success');
    } else {
      triggerToast('No se encontró coincidencia de código.', 'error');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.category) return triggerToast('Por favor selecciona una línea de diseño.', 'error');
    if (user.role !== 'admin') return triggerToast('Acción denegada.', 'error');
    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    try {
      if (productForm.id) {
        const { data } = await axios.put(`${API_URL}/products/${productForm.id}`, productForm, config);
        setProducts(products.map(p => p._id === productForm.id ? data : p));
        triggerToast('Modelo actualizado con éxito.', 'success');
      } else {
        const { data } = await axios.post(`${API_URL}/products`, productForm, config);
        setProducts([...products, data]);
        triggerToast('Modelo guardado en colección.', 'success');
      }
      resetProductForm();
    } catch (error) {
      triggerToast('Error de privilegios JWT.', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    playTerminalSound('click');
    if (user.role !== 'admin') return triggerToast('Acción denegada.', 'error');
    if (window.confirm('¿Dar de baja este diseño permanentemente?')) {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      try {
        await axios.delete(`${API_URL}/products/${id}`, config);
        setProducts(products.filter(p => p._id !== id));
        setCart(cart.filter(item => item._id !== id));
        triggerToast('Diseño eliminado de la red.', 'info');
      } catch (error) {
        triggerToast('Error al procesar baja.', 'error');
      }
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) return triggerToast('Modelo sin existencias.', 'error');
    const exist = cart.find(item => item._id === product._id);
    if (exist && exist.qty >= product.stock) return triggerToast('Alcanzaste el tope de piezas en inventario.', 'error');
    
    if (exist) {
      setCart(cart.map(item => item._id === product._id ? { ...exist, qty: exist.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    triggerToast(`+1 ${product.name} en la bolsa.`, 'success');
  };

  const removeFromCart = (id) => {
    const exist = cart.find(item => item._id === id);
    if (exist.qty === 1) {
      setCart(cart.filter(item => item._id !== id));
    } else {
      setCart(cart.map(item => item._id === id ? { ...exist, qty: exist.qty - 1 } : item));
    }
    triggerToast('Cantidad reducida.', 'info');
  };

  const handleApplyCoupon = () => {
    if (coupon.toUpperCase() === 'CHAKON10') {
      setDiscountRate(0.10);
      triggerToast('Cupón VIP: 10% de descuento.', 'success');
    } else if (coupon.trim() === '') {
      setDiscountRate(0);
    } else {
      triggerToast('Este cupón no existe.', 'error');
      setDiscountRate(0);
    }
  };

  const checkoutSales = async () => {
    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    try {
      for (const item of cart) {
        await axios.put(`${API_URL}/products/${item._id}`, { ...item, stock: item.stock - item.qty }, config);
      }
      
      let pointsDeducted = 0;
      let pointsGenerated = 0;

      if (applyPoints) {
        pointsDeducted = Math.min(walletPoints, totalCart);
        setWalletPoints(prev => prev - pointsDeducted);
      } else {
        pointsGenerated = Math.floor(totalCart * 0.05);
        setWalletPoints(prev => prev + pointsGenerated);
      }

      setCompletedSale({
        ticketId: `CK-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toLocaleString('es-MX'),
        items: [...cart],
        subtotal: subtotalCart,
        discount: discountAmount,
        pointsUsed: pointsDeducted,
        pointsEarned: pointsGenerated,
        iva: ivaCart,
        total: Math.max(0, totalCart - pointsDeducted),
        operator: user.name
      });
      
      setCart([]);
      setCoupon('');
      setDiscountRate(0);
      setApplyPoints(false);
      setShowTicket(true);
      fetchProducts();
    } catch (error) {
      triggerToast('Fallo crítico al procesar la orden.', 'error');
    }
  };

  const resetLocalStorageData = () => {
    if(window.confirm('¿Deseas restablecer las configuraciones de la terminal a ceros?')) {
      localStorage.clear();
      setWalletPoints(350);
      setSoundEnabled(true);
      setSoundType('moderno');
      triggerToast('Caché y memoria de terminal limpiados.', 'info');
    }
  };

  const subtotalCart = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const discountAmount = subtotalCart * discountRate;
  const subtotalConDescuento = subtotalCart - discountAmount;
  const ivaCart = subtotalConDescuento * 0.16;
  const totalCart = subtotalConDescuento + ivaCart;
  const finalPayablePrice = applyPoints ? Math.max(0, totalCart - walletPoints) : totalCart;

  const totalInversion = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
  const totalPrendas = products.reduce((acc, p) => acc + Number(p.stock), 0);

  const getCategoryStats = (cat) => {
    const totalCat = products.filter(p => p.category === cat).reduce((acc, p) => acc + Number(p.stock), 0);
    return totalPrendas > 0 ? Math.round((totalCat / totalPrendas) * 100) : 0;
  };

  const filteredProducts = products.filter(p => {
    return (p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())) &&
           (selectedCategory === 'Todas' || p.category === selectedCategory) &&
           (Number(p.price) <= maxPrice);
  });

  const handleEditSelect = (prod) => {
    playTerminalSound('click');
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

  const styles = {
    bg: darkMode ? '#111111' : '#fcfbf7',
    cardBg: darkMode ? '#1e1e1e' : '#ffffff',
    text: darkMode ? '#ffffff' : '#111111',
    textMuted: darkMode ? '#aaaaaa' : '#666666',
    border: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    inputBg: darkMode ? 'rgba(255,255,255,0.04)' : '#f8f8f8'
  };

  return (
    <div style={{ background: styles.bg, color: styles.text, minHeight: '100vh', transition: 'all 0.4s ease', fontFamily: '"Montserrat", sans-serif' }}>
      
      <style>{`
        .toast-container { position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px; }
        .toast-item { padding: 14px 24px; min-width: 280px; border-radius: 8px; color: #fff; font-size: 13px; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,0.3); animation: toastIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes toastIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        
        .btn-theme-toggle { background: none; border: 1px solid ${styles.border}; color: ${styles.text}; padding: 8px 14px; border-radius: 20px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 5px; font-weight: bold; transition: all 0.2s; }
        .btn-theme-toggle:hover { background: #d4af37; color: #111; border-color: #d4af37; }

        .btn-premium-auth { width: 100%; padding: 14px; background: #d4af37; border: none; border-radius: 8px; color: #111; fontSize: 14px; fontWeight: bold; text-transform: uppercase; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(212,175,55,0.2); }
        .btn-premium-auth:hover { background: #f1c40f; transform: translateY(-2px); }
        
        .product-card { background: ${styles.cardBg}; border: 1px solid ${styles.border}; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .product-card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.15); }

        .btn-add-cart { width: auto; padding: 6px 14px; background: ${styles.text}; color: ${styles.bg}; border: none; cursor: pointer; transition: all 0.25s ease; border-radius: 4px; fontWeight: 600; }
        .btn-add-cart:hover { background: #d4af37; color: #111; }

        .chart-bar-bg { background: ${darkMode ? 'rgba(255,255,255,0.05)' : '#eee'}; height: 8px; border-radius: 4px; overflow: hidden; margin-top: 5px; }
        .chart-bar-fill { height: 100%; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }

        .switch-luxury { position: relative; display: inline-block; width: 44px; height: 22px; }
        .switch-luxury input { opacity: 0; width: 0; height: 0; }
        .slider-luxury { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 22px; }
        .slider-luxury:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider-luxury { background-color: #d4af37; }
        input:checked + .slider-luxury:before { transform: translateX(22px); }

        .modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); display:flex; justify-content:center; align-items:center; z-index:9999; }
        .ticket-paper { background: #fff; color:#000; font-family: 'Courier New', monospace; padding: 30px; width: 100%; maxWidth: 380px; box-shadow: 0 15px 40px rgba(0,0,0,0.5); border-top: 8px dashed #d4af37; }
        
        .log-box { font-family: 'Courier New', monospace; background: rgba(0,0,0,0.2); border: 1px solid ${styles.border}; padding: 10px; border-radius: 6px; height: 140px; overflow-y: auto; font-size: 11px; color: #00ff00; list-style: none; margin: 0; }
      
        /* ESTILOS PREMIUM PARA LAS NUEVAS OPCIONES DE DROPDOWN */
        .premium-dropdown-item {
          padding: 12px 16px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .premium-dropdown-item:hover {
          background: #d4af37 !important;
          color: #111111 !important;
          padding-left: 22px;
        }
      `}</style>

      {/* MODAL TICKET */}
      {showTicket && completedSale && (
        <div className="modal-overlay">
          <div className="ticket-paper">
            <div style={{textAlign: 'center', marginBottom: '15px'}}>
              <h2 style={{margin: 0, fontSize: '22px', letterSpacing: '4px'}}>CHAKON</h2>
              <p style={{margin: '2px 0', fontSize: '10px', textTransform: 'uppercase'}}>Luxury Control System</p>
              <p style={{margin: '2px 0', fontSize: '11px'}}>-------------------------</p>
            </div>
            <div style={{fontSize: '12px', marginBottom: '10px'}}>
              <div><strong>Nº ORDEN:</strong> {completedSale.ticketId}</div>
              <div><strong>FECHA:</strong> {completedSale.date}</div>
              <div><strong>CAJERO:</strong> {completedSale.operator}</div>
            </div>
            <p style={{margin: '2px 0', fontSize: '11px'}}>-------------------------</p>
            <div style={{fontSize: '12px'}}>
              {completedSale.items.map((item, idx) => (
                <div key={idx} style={{display: 'flex', justifyContent: 'space-between', margin: '4px 0'}}>
                  <span>{item.qty}x {item.name.substring(0, 16)}</span>
                  <span>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <p style={{margin: '2px 0', fontSize: '11px'}}>-------------------------</p>
            <div style={{fontSize: '12px', textAlign: 'right', lineHeight: '1.5'}}>
              <div>Subtotal: ${completedSale.subtotal.toFixed(2)}</div>
              {completedSale.discount > 0 && <div style={{color: '#c62828'}}>Desc. Cupón: -${completedSale.discount.toFixed(2)}</div>}
              {completedSale.pointsUsed > 0 && <div style={{color: '#b8860b'}}>Monedero: -${completedSale.pointsUsed.toFixed(2)}</div>}
              <div>IVA (16%): ${completedSale.iva.toFixed(2)}</div>
              <div style={{fontSize: '15px', fontWeight: 'bold', marginTop: '4px'}}>TOTAL NETO: ${completedSale.total.toFixed(2)} MXN</div>
              <p style={{margin: '5px 0', fontSize: '11px'}}>-------------------------</p>
              {completedSale.pointsEarned > 0 && <div style={{textAlign:'center', color:'#d4af37', fontWeight:'bold'}}>¡Ganaste +{completedSale.pointsEarned} Chakon Points! 👑</div>}
            </div>
            <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
              <button onClick={() => window.print()} style={{flex: 1, padding: '10px', background: '#111', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>Imprimir</button>
              <button onClick={() => { playTerminalSound('click'); setShowTicket(false); }} style={{flex: 1, padding: '10px', background: '#ccc', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PANEL DE CONFIGURACIÓN AVANZADA */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => { playTerminalSound('click'); setShowSettings(false); }}>
          <div style={{ background: styles.cardBg, border: `2px solid #d4af37`, borderRadius: '12px', padding: '30px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${styles.border}`, paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#d4af37', fontWeight: 'bold', letterSpacing: '1px' }}>⚙️ CONFIGURACIÓN DE TERMINAL</h3>
              <button onClick={() => { playTerminalSound('click'); setShowSettings(false); }} style={{ background: 'none', border: 'none', color: styles.text, fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>🔊 Efectos de Audio de Interfaz</span>
                <label className="switch-luxury">
                  <input type="checkbox" checked={soundEnabled} onChange={() => { setSoundEnabled(!soundEnabled); setTimeout(() => playTerminalSound('success'), 50); }} />
                  <span className="slider-luxury"></span>
                </label>
              </div>

              {soundEnabled && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: styles.inputBg, padding: '6px', borderRadius: '8px' }}>
                  {['moderno', 'retro', 'click'].map(t => (
                    <button 
                      key={t}
                      onClick={() => { setSoundType(t); setTimeout(() => playTerminalSound('success'), 50); }}
                      style={{ padding: '8px', background: soundType === t ? '#d4af37' : 'transparent', color: soundType === t ? '#111' : styles.text, border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: styles.textMuted, display: 'block', marginBottom: '6px' }}>AUDITORÍA DE EVENTOS EN TIEMPO REAL</label>
              <div className="log-box">
                {terminalLogs.map((log, index) => (
                  <div key={index} style={{ marginBottom: '3px', whiteSpace: 'nowrap' }}>{log}</div>
                ))}
              </div>
            </div>

            <div style={{ background: styles.inputBg, padding: '12px', borderRadius: '8px', fontSize: '12px', marginBottom: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>• Estatus Servidor: <span style={{color:'#28a745', fontWeight:'bold'}}>ONLINE</span></div>
              <div>• Privilegios JWT: <span style={{color:'#d4af37', fontWeight:'bold'}}>{user?.role?.toUpperCase()}</span></div>
              <div>• Modelos Cargados: <b>{products.length} ítems</b></div>
              <div>• Moneda Base: <b>MXN ($)</b></div>
            </div>

            <button 
              onClick={resetLocalStorageData} 
              style={{ width: '100%', padding: '12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
            >
              ⚠️ Restablecer Valores de Fábrica
            </button>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast-item" style={{ background: t.type === 'success' ? '#d4af37' : t.type === 'error' ? '#c62828' : '#0d47a1', color: t.type === 'success' ? '#111' : '#fff' }}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* LOGIN / SIGNUP */}
      {!user ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
          <div style={{ background: styles.cardBg, border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '40px 50px', width: '100%', maxWidth: '440px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '6px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Chakon</h1>
            <p style={{ color: '#d4af37', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '3px', margin: '0 0 30px 0' }}>Control System</p>
            
            <form onSubmit={handleAuthSubmit} style={{ textAlign: 'left' }}>
              {!isLogin && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: styles.textMuted, fontSize: '12px', marginBottom: '6px' }}>NOMBRE</label>
                  <input type="text" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} style={{ width: '100%', padding: '12px', background: styles.inputBg, border: `1px solid ${styles.border}`, borderRadius: '8px', color: styles.text }} />
                </div>
              )}

              <div style={{ marginBottom: '15px', textAlign: 'right' }}>
                <span onClick={() => { playTerminalSound('click'); setIsStaffRegister(!isStaffRegister); setStaffKey(''); }} style={{ fontSize: '12px', color: '#d4af37', textDecoration: 'underline', cursor:'pointer' }}>
                  {isStaffRegister ? '✓ Perfil Cliente' : '¿Ingresar como Staff/Personal?'}
                </span>
              </div>

              {isStaffRegister && (
                <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(212,175,55,0.05)', border: '1px dashed #d4af37', borderRadius: '8px' }}>
                  <label style={{ display: 'block', color: '#d4af37', fontSize: '11px', marginBottom: '6px', fontWeight: 'bold' }}>TOKEN DE OPERADORA</label>
                  <input type="password" value={staffKey} onChange={e => setStaffKey(e.target.value)} style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #d4af37', borderRadius: '6px', color: '#fff' }} placeholder="Clave de seguridad" required />
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: styles.textMuted, fontSize: '12px', marginBottom: '6px' }}>CORREO ELECTRONICO</label>
                <input type="email" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} style={{ width: '100%', padding: '12px', background: styles.inputBg, border: `1px solid ${styles.border}`, borderRadius: '8px', color: styles.text }} />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', color: styles.textMuted, fontSize: '12px', marginBottom: '6px' }}>CONTRASEÑA</label>
                <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} style={{ width: '100%', padding: '12px', background: styles.inputBg, border: `1px solid ${styles.border}`, borderRadius: '8px', color: styles.text }} />
              </div>

              <button type="submit" className="btn-premium-auth">{isLogin ? 'Entrar a Terminal' : 'Registrar'}</button>
            </form>
            <p onClick={() => { playTerminalSound('click'); setIsLogin(!isLogin); }} style={{ color: styles.textMuted, marginTop: '20px', fontSize: '13px', cursor: 'pointer', textDecoration:'underline' }}>{isLogin ? 'Crear cuenta nueva' : 'Volver al Login'}</p>
          </div>
        </div>
      ) : (
        
        /* PANEL PRINCIPAL */
        <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: `2px solid ${styles.border}`, marginBottom: '30px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '3px', margin: 0 }}>CHAKON SYSTEM</h1>
              <p style={{ margin: '5px 0 0 0', color: styles.textMuted, fontSize: '13px' }}>
                Terminal: <span style={{color: '#d4af37', fontWeight: 'bold'}}>{user.name} ({user.role === 'admin' ? 'Staff' : 'Cliente'})</span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button className="btn-theme-toggle" onClick={() => { playTerminalSound('click'); setDarkMode(!darkMode); }}>
                {darkMode ? '🌙 Modo Gala' : '☀️ Modo Atelier'}
              </button>
              
              <button className="btn-theme-toggle" onClick={() => { playTerminalSound('click'); setShowSettings(true); }}>
                ⚙️ Config
              </button>

              <button onClick={handleLogout} style={{ background: '#c62828', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Salir</button>
            </div>
          </div>

          {/* DASHBOARD ADMIN */}
          {user.role === 'admin' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '30px' }}>
              <div style={{ background: styles.cardBg, padding: '20px', borderRadius: '8px', border: `1px solid ${styles.border}` }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: styles.textMuted }}>ACTIVOS ALMACÉN</p>
                <h3 style={{ margin: 0, fontSize: '24px', color: '#d4af37' }}>${totalInversion.toLocaleString('es-MX')} MXN</h3>
              </div>
              <div style={{ background: styles.cardBg, padding: '20px', borderRadius: '8px', border: `1px solid ${styles.border}` }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: styles.textMuted }}>VOLUMEN PRENDAS</p>
                <h3 style={{ margin: 0, fontSize: '24px' }}>{totalPrendas} Piezas</h3>
              </div>

              <div style={{ background: styles.cardBg, padding: '20px', borderRadius: '8px', border: `1px solid ${styles.border}`, gridColumn: 'span 2' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: styles.textMuted }}>DISTRIBUCIÓN DE STOCK POR LÍNEA</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '11px' }}>
                  {['Vestidos', 'Chaquetas', 'Blusas', 'Pantalones'].map(cat => {
                    const percentage = getCategoryStats(cat);
                    return (
                      <div key={cat}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{cat}</span><strong>{percentage}%</strong></div>
                        <div className="chart-bar-bg"><div className="chart-bar-fill" style={{ width: `${percentage}%`, background: getCategoryColor(cat) }}></div></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CUERPO CENTRAL */}
          <div style={{ display: 'grid', gridTemplateColumns: user.role === 'admin' ? '380px 1fr' : '400px 1fr', gap: '30px' }}>
            
            {/* LADO IZQUIERDO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* MONEDERO */}
              <div style={{ background: '#111', color: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #d4af37', boxShadow: '0 8px 25px rgba(212,175,55,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '12px', letterSpacing: '2px', color: '#aaa' }}>CHAKON LUXURY WALLET</h4>
                    <h3 style={{ margin: '5px 0 0 0', fontSize: '24px', color: '#d4af37', fontWeight: '900' }}>${walletPoints} <span style={{fontSize:'12px'}}>PTS</span></h3>
                  </div>
                  <span style={{ fontSize: '24px' }}>👑</span>
                </div>
                <p style={{ fontSize: '10px', margin: '10px 0 0 0', color: '#888' }}>* Cada punto equivale a $1.00 MXN. Acumula el 5% en compras.</p>
              </div>

              {/* AGREGADO RÁPIDO POS */}
              {user.role === 'admin' && (
                <div style={{ background: styles.cardBg, padding: '20px', borderRadius: '8px', border: `2px solid #d4af37` }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#d4af37', fontWeight: 'bold', letterSpacing: '1px' }}>⚡ AGREGADO RÁPIDO POS</h4>
                  <form onSubmit={handleQuickScan} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="Escribe los últimos 6 dígitos del ID aquí..." 
                      value={quickScanId} 
                      onChange={e => setQuickScanId(e.target.value)} 
                      style={{ width: '100%', padding: '12px', background: styles.inputBg, border: `1px solid ${styles.border}`, color: styles.text, fontSize: '13px', borderRadius: '6px', boxSizing: 'border-box' }} 
                    />
                    <button type="submit" style={{ background: '#d4af37', color: '#111', border: 'none', padding: '12px', borderRadius: '6px', fontSize:'12px', fontWeight:'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Escanear e Introducir
                    </button>
                  </form>
                </div>
              )}

              {/* FORMULARIO CRUD ADMINISTRADOR */}
              {user.role === 'admin' && (
                <div style={{ background: styles.cardBg, padding: '20px', borderRadius: '8px', border: `1px solid ${styles.border}` }}>
                  <h3 style={{ fontSize: '16px', margin: '0 0 15px 0', paddingBottom: '10px', borderBottom: `1px solid ${styles.border}` }}>{productForm.id ? '🛠️ Editar Alta Costura' : '➕ Registrar Nuevo Diseño'}</h3>
                  <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Modelo:</label><input type="text" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} style={{ width: '100%', padding: '8px', background: styles.inputBg, border: `1px solid ${styles.border}`, color: styles.text }} /></div>
                    <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Descripción:</label><textarea rows="2" required value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} style={{ width: '100%', padding: '8px', background: styles.inputBg, border: `1px solid ${styles.border}`, color: styles.text }} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Precio ($):</label><input type="number" step="0.01" required value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} style={{ width: '100%', padding: '8px', background: styles.inputBg, border: `1px solid ${styles.border}`, color: styles.text }} /></div>
                      <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Stock:</label><input type="number" required value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} style={{ width: '100%', padding: '8px', background: styles.inputBg, border: `1px solid ${styles.border}`, color: styles.text }} /></div>
                    </div>
                    
                    {/* DROPDOWN CUSTOM EN EL FORMULARIO (REEMPLAZA EL SELECT NATIVO MALO) */}
                    <div style={{ position: 'relative' }}>
                      <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Línea:</label>
                      <div 
                        onClick={() => { playTerminalSound('click'); setFormDropdownOpen(!formDropdownOpen); }}
                        style={{ padding: '10px', background: styles.inputBg, border: `1px solid ${styles.border}`, borderRadius: '4px', color: productForm.category ? styles.text : styles.textMuted, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}
                      >
                        <span>{productForm.category || 'Seleccionar Línea...'}</span>
                        <span style={{ fontSize: '10px', transform: formDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                      </div>
                      
                      {formDropdownOpen && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: styles.cardBg, border: '1px solid #d4af37', borderRadius: '4px', marginTop: '4px', zIndex: 110, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                          {['Vestidos', 'Chaquetas', 'Blusas', 'Pantalones'].map(cat => (
                            <div 
                              key={cat}
                              className="premium-dropdown-item"
                              style={{ background: productForm.category === cat ? 'rgba(212,175,55,0.15)' : 'transparent', color: productForm.category === cat ? '#d4af37' : styles.text }}
                              onClick={() => { setProductForm({...productForm, category: cat}); setFormDropdownOpen(false); playTerminalSound('click'); }}
                            >
                              {cat}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>URL Imagen:</label><input type="text" value={productForm.imageUrl} onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} style={{ width: '100%', padding: '8px', background: styles.inputBg, border: `1px solid ${styles.border}`, color: styles.text }} /></div>
                    <button type="submit" style={{ padding: '10px', background: '#d4af37', color: '#111', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>{productForm.id ? 'Guardar Cambios' : 'Colocar en Almacén'}</button>
                    {productForm.id && <button type="button" onClick={() => { playTerminalSound('click'); resetProductForm(); }} style={{ padding: '8px', background: '#6c757d', color: '#fff', border: 'none', cursor: 'pointer' }}>Cancelar</button>}
                  </form>
                </div>
              )}

              {/* BOLSA DE COMPRAS */}
              <div style={{ background: styles.cardBg, padding: '20px', borderRadius: '8px', border: `1px solid ${styles.border}` }}>
                <h3 style={{ fontSize: '16px', margin: '0 0 15px 0', paddingBottom: '10px', borderBottom: `1px solid ${styles.border}` }}>🛒 Bolsa de Pedido</h3>
                {cart.length === 0 ? (
                  <p style={{ color: styles.textMuted, textAlign: 'center', padding: '30px 0', fontSize: '13px' }}>Bolsa vacía.</p>
                ) : (
                  <div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px' }}>
                      {cart.map(item => (
                        <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px dashed ${styles.border}`, fontSize: '13px' }}>
                          <div>
                            <strong>{item.name}</strong>
                            <div style={{ color: styles.textMuted, fontSize: '11px' }}>{item.qty} x ${item.price}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => addToCart(item)} style={{ background: '#28a745', border:'none', color:'#fff', padding:'2px 8px', cursor:'pointer', borderRadius:'3px' }}>+</button>
                            <button onClick={() => removeFromCart(item._id)} style={{ background: '#dc3545', border:'none', color:'#fff', padding:'2px 8px', cursor:'pointer', borderRadius:'3px' }}>-</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: `1px dashed ${styles.border}` }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: styles.textMuted }}>¿TIENES UN CUPÓN?</label>
                      <input 
                        type="text" 
                        placeholder="Escribe tu cupón aquí (Ej: CHAKON10)" 
                        value={coupon} 
                        onChange={e => setCoupon(e.target.value)} 
                        style={{ width: '100%', padding: '10px', background: styles.inputBg, border: `1px solid ${styles.border}`, color: styles.text, fontSize: '13px', borderRadius: '4px', boxSizing: 'border-box' }} 
                      />
                      <button onClick={handleApplyCoupon} style={{ background: styles.text, color: styles.bg, border: 'none', padding: '10px', fontSize: '12px', fontWeight:'bold', cursor:'pointer', borderRadius: '4px', textTransform: 'uppercase' }}>
                        Validar Código
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: styles.inputBg, padding: '10px', borderRadius: '6px', marginBottom: '15px', border: `1px solid ${styles.border}` }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>💸 Usar saldo del Monedero</span>
                      <label className="switch-luxury">
                        <input type="checkbox" checked={applyPoints} onChange={() => { playTerminalSound('click'); setApplyPoints(!applyPoints); }} disabled={walletPoints === 0} />
                        <span className="slider-luxury"></span>
                      </label>
                    </div>

                    <div style={{ background: styles.inputBg, padding: '15px', borderRadius: '6px', fontSize: '13px', border: `1px solid ${styles.border}`, marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Subtotal:</span><span>${subtotalCart.toFixed(2)}</span></div>
                      {discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc3545', marginBottom: '4px' }}><span>Descuento Cupón:</span><span>-${discountAmount.toFixed(2)}</span></div>}
                      {applyPoints && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b8860b', marginBottom: '4px' }}><span>Descuento Monedero:</span><span>-${Math.min(walletPoints, totalCart).toFixed(2)}</span></div>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: styles.textMuted, marginBottom: '4px' }}><span>IVA (16%):</span><span>${ivaCart.toFixed(2)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold', paddingTop: '6px', borderTop: `1px solid ${styles.border}`, marginTop: '6px' }}>
                        <span>TOTAL A PAGAR:</span><span style={{ color: '#28a745' }}>${finalPayablePrice.toFixed(2)} MXN</span>
                      </div>
                    </div>
                    <button onClick={checkoutSales} style={{ width: '100%', padding: '12px', background: '#28a745', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>Procesar Operación</button>
                  </div>
                )}
              </div>
            </div>

            {/* LADO DERECHO: CATÁLOGO */}
            <div>
              <h2 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '1px' }}>Colección Alta Costura</h2>
              
              {/* FILTROS INTEGRADOS CON EL NUEVO DROPDOWN EXCLUSIVO */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', background: styles.cardBg, padding: '15px', borderRadius: '8px', border: `1px solid ${styles.border}`, marginBottom: '25px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>BUSCAR PRENDA:</label>
                  <input type="text" placeholder="Filtrar..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '8px', width: '100%', background: styles.inputBg, border: `1px solid ${styles.border}`, color: styles.text, height:'38px', boxSizing:'border-box' }} />
                </div>
                
                {/* DROPDOWN CUSTOM PARA FILTRAR POR LÍNEAS (ADIÓS AL BUG DE PANTALLA) */}
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>LÍNEA:</label>
                  <div 
                    onClick={() => { playTerminalSound('click'); setFilterDropdownOpen(!filterDropdownOpen); }}
                    style={{ padding: '10px', background: styles.inputBg, border: `1px solid ${styles.border}`, color: styles.text, cursor: 'pointer', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', height:'38px', boxSizing:'border-box' }}
                  >
                    <span>{selectedCategory}</span>
                    <span style={{ fontSize: '10px', transform: filterDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                  </div>

                  {filterDropdownOpen && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: styles.cardBg, border: '1px solid #d4af37', borderRadius: '4px', marginTop: '4px', zIndex: 110, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow:'hidden' }}>
                      {['Todas', 'Vestidos', 'Chaquetas', 'Blusas', 'Pantalones'].map(cat => (
                        <div 
                          key={cat}
                          className="premium-dropdown-item"
                          style={{ background: selectedCategory === cat ? 'rgba(212,175,55,0.15)' : 'transparent', color: selectedCategory === cat ? '#d4af37' : styles.text }}
                          onClick={() => { setSelectedCategory(cat); setFilterDropdownOpen(false); playTerminalSound('click'); }}
                        >
                          {cat}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>PRECIO MÁXIMO: (${maxPrice} MXN)</label>
                  <input type="range" min="0" max="2500" step="50" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} style={{ width: '100%', marginTop: '8px' }} />
                </div>
              </div>

              {/* CUADRÍCULA DE ARTÍCULOS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {filteredProducts.map(prod => (
                  <div key={prod._id} className="product-card">
                    <div>
                      <div style={{ position: 'relative' }}>
                        <img src={prod.imageUrl} alt={prod.name} style={{ height: '180px', width: '100%', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', top: '8px', left: '8px', background: getCategoryColor(prod.category), color: '#fff', padding: '3px 8px', fontSize: '10px', fontWeight: 'bold', borderRadius: '10px' }}>{prod.category}</span>
                      </div>
                      <div style={{ padding: '12px' }}>
                        <h3 style={{ fontSize: '14px', margin: '0 0 5px 0' }}>{prod.name}</h3>
                        <p style={{ fontSize: '11px', color: styles.textMuted, height: '32px', overflow: 'hidden', margin: '0 0 10px 0' }}>{prod.description}</p>
                        <div style={{ fontSize: '10px', color: styles.textMuted, marginBottom: '5px' }}>ID: <span style={{fontFamily:'monospace', color:'#d4af37'}}>{prod._id.substring(prod._id.length - 6)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span>Inventario:</span>
                          <strong style={{ color: prod.stock < 5 ? '#dc3545' : '#28a745' }}>{prod.stock} u.</strong>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div style={{ padding: '0 12px 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>${Number(prod.price).toFixed(2)}</span>
                        <button onClick={() => addToCart(prod)} className="btn-add-cart">+ Bolsa</button>
                      </div>
                      {user.role === 'admin' && (
                        <div style={{ padding: '8px 12px', background: styles.inputBg, display: 'flex', gap: '8px', borderTop: `1px solid ${styles.border}` }}>
                          <button onClick={() => handleEditSelect(prod)} style={{background:'#007bff', color:'#fff', border:'none', padding:'4px 8px', borderRadius:'3px', cursor:'pointer', fontSize:'11px'}}>Editar</button>
                          <button onClick={() => handleDeleteProduct(prod._id)} style={{background:'#dc3545', color:'#fff', border:'none', padding:'4px 8px', borderRadius:'3px', cursor:'pointer', fontSize:'11px'}}>Baja</button>
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
    </div>
  );
}
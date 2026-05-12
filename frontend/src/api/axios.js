import axios from 'axios';

const clienteAxios = axios.create({
    baseURL: 'http://localhost:5000/api'
});

// Esto envía el token automáticamente en cada petición
clienteAxios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

export default clienteAxios;
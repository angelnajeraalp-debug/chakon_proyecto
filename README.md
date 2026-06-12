# 🛍️ Chakon Boutique - Sistema POS y Gestión VIP

Un sistema integral de Punto de Venta (POS) y gestión de inventario diseñado a la medida para una boutique de alta costura. Este software permite administrar productos, procesar ventas en tiempo real, gestionar perfiles de staff y fidelizar clientes a través de un sistema de lealtad en la nube ("Chakon Points").

---

## 🚀 Características Principales

* **Punto de Venta Atómico:** Procesamiento de ventas (Checkout) que genera tickets y descuenta el stock del inventario en una sola operación segura para evitar inconsistencias.
* **Gestión de Inventario (CRUD):** Creación, lectura, actualización y eliminación de productos de alta costura desde el panel de administrador.
* **Sistema de Lealtad (Chakon Points):** Monedero virtual integrado a los perfiles de los clientes, permitiendo acumular y gastar puntos en compras reales.
* **Gamificación de Ventas:** Barra de progreso con metas diarias de ventas en tiempo real para el equipo de cajeros/staff.
* **Persistencia Real:** Conexión a base de datos NoSQL mediante Mongoose, eliminando la dependencia del almacenamiento local (localStorage).

---

## 💻 Stack Tecnológico (MERN)

* **Frontend:** React.js, Vite (Diseño de interfaz tipo Terminal/Dark Mode).
* **Backend:** Node.js, Express.js (Sintaxis moderna con ES Modules `import/export`).
* **Base de Datos:** MongoDB (Local vía MongoDB Compass) y Mongoose (Modelado de datos).
* **Control de Versiones:** Git y GitHub (con protección de variables de entorno).

---

## 🛠️ Requisitos Previos

1. Instalar **Node.js** (Versión 18 o superior recomendada).
2. Instalar **MongoDB Compass** para ejecutar la base de datos localmente.
3. Instalar **Git** para el control de versiones.

---

## ⚙️ Instalación y Configuración Local

1. Clona este repositorio en tu computadora.
2. Abre una terminal y navega a la carpeta del backend.
3. Instala las dependencias del servidor ejecutando `npm install`.
4. En la raíz de la carpeta `backend`, crea un archivo llamado exactamente `.env`.
5. Pega las siguientes variables de configuración dentro de tu archivo `.env`:
   `MONGO_URI=mongodb://127.0.0.1:27017/chakon_boutique`
   `PORT=5000`
6. Navega a la carpeta del frontend (si existe una separada) e instala sus dependencias con `npm install`.
7. Abre MongoDB Compass y conéctate a la URI: `mongodb://127.0.0.1:27017`.

---

## 🏃‍♂️ Guía de Uso (Ejecución)

1. Enciende el servidor Backend abriendo una terminal en la carpeta `backend` y ejecutando `node server.js` (o `npm start`).
2. Verifica en la consola el mensaje de éxito: **"MongoDB Conectado Oficialmente"**.
3. Enciende el servidor Frontend abriendo otra terminal en la carpeta correspondiente y ejecutando `npm run dev`.
4. Abre la dirección web local (generalmente `http://localhost:5173`) en tu navegador.
5. **Nota sobre la Base de Datos:** MongoDB utiliza "Lazy Creation". La base de datos `chakon_boutique` no aparecerá en Compass hasta que registres el primer usuario o producto desde la interfaz de la aplicación.

---

## 📡 Estructura de la API REST (Rutas del Backend)

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| **GET** | `/api/products` | Obtiene el catálogo completo de inventario |
| **POST** | `/api/products` | Crea un nuevo artículo en la boutique |
| **PUT** | `/api/products/:id` | Actualiza precio, stock o datos de un artículo |
| **DELETE** | `/api/products/:id` | Elimina un artículo del catálogo |
| **POST** | `/api/users/login` | Autenticación y acceso de Staff/Clientes |
| **POST** | `/api/users` | Registro de nueva cuenta y regalo de Chakon Points |

---

## 🗄️ Modelos de Base de Datos

* **User:** Almacena credenciales, roles (`admin` o `client`) y el saldo del monedero virtual (`chakonPoints`).
* **Product:** Almacena nombre, descripción, precio, categoría, stock en tiempo real y URL de la imagen.
* **Order:** Almacena el historial inmutable de ventas, ID del ticket generado, desglose de artículos, cajero que operó, impuestos y uso/ganancia de puntos de lealtad.

---

## 📝 Notas Técnicas y Solución de Problemas

* **Error 500 al buscar productos en Node 18+:** Se aplicó un parche global en `server.js` (`global.crypto = crypto;`) para resolver la incompatibilidad de la librería interna de UUID de MongoDB con versiones recientes de Node.js.
* **Seguridad:** El archivo `.env` y la carpeta `node_modules` están estrictamente ignorados en el archivo `.gitignore` para prevenir fugas de credenciales.

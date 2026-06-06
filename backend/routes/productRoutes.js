// backend/routes/productRoutes.js
import express from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Rutas para la raíz /api/products
// El GET es público (cualquiera ve la ropa), pero el POST está protegido con el candado 'protect'
router.route('/')
  .get(getProducts)
  .post(protect, createProduct);

// 2. Rutas que necesitan el ID del producto (/api/products/:id)
// El PUT (editar) y DELETE (eliminar) están protegidos con 'protect'
router.route('/:id')
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

export default router;
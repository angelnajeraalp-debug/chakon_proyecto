// backend/routes/productRoutes.js
import express from 'express';
import Product from '../models/productModel.js';

const router = express.Router();

// OBTENER TODOS LOS PRODUCTOS (GET /api/products)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({}); // Busca todo en la BD
    res.json(products);
  } catch (error) {
    // 👇 ESTA ES LA LÍNEA MÁGICA QUE AGREGAMOS 👇
    console.error("❌ ERROR REAL AL BUSCAR PRODUCTOS:", error); 
    res.status(500).json({ message: 'Error al obtener los productos', detalle: error.message });
  }
});

// CREAR UN PRODUCTO (POST /api/products)
router.post('/', async (req, res) => {
  try {
    const { name, description, price, stock, category, imageUrl } = req.body;
    
    const product = await Product.create({
      name, description, price, stock, category, imageUrl
    });
    
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Datos inválidos para el producto' });
  }
});

// ACTUALIZAR UN PRODUCTO (PUT /api/products/:id)
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (product) {
      product.name = req.body.name || product.name;
      product.description = req.body.description || product.description;
      product.price = req.body.price || product.price;
      product.stock = req.body.stock !== undefined ? req.body.stock : product.stock;
      product.category = req.body.category || product.category;
      product.imageUrl = req.body.imageUrl || product.imageUrl;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el producto' });
  }
});

// ELIMINAR UN PRODUCTO (DELETE /api/products/:id)
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (product) {
      res.json({ message: 'Producto eliminado con éxito' });
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error al eliminar' });
  }
});

export default router;
// backend/controllers/productController.js

// Base de datos de productos iniciales para que la boutique no aparezca vacía
let mockProducts = [
  {
    _id: "prod_1",
    name: "Vestido de Noche Elegante",
    description: "Vestido largo de seda ideal para eventos de gala.",
    price: 1250.00,
    stock: 15,
    category: "Vestidos",
    imageUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500"
  },
  {
    _id: "prod_2",
    name: "Chaqueta de Cuero Slim",
    description: "Chaqueta de cuero sintético negro con cierres metálicos.",
    price: 899.00,
    stock: 8,
    category: "Chaquetas",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500"
  }
];

// 1. LEER (Obtener todos los productos)
export const getProducts = async (req, res) => {
  res.json(mockProducts);
};

// 2. CREAR (Añadir un nuevo producto)
export const createProduct = async (req, res) => {
  const { name, description, price, stock, category, imageUrl } = req.body;
  
  // Validación de campos obligatorios
  if (!name || !description || !price || stock === undefined || !category) {
    return res.status(400).json({ message: 'Por favor completa todos los campos obligatorios' });
  }
  
  const newProduct = {
    _id: 'prod_' + Math.random().toString(36).substr(2, 9),
    name,
    description,
    price: Number(price),
    stock: Number(stock),
    category,
    imageUrl: imageUrl || 'https://via.placeholder.com/150'
  };

  mockProducts.push(newProduct);
  res.status(201).json(newProduct);
};

// 3. ACTUALIZAR (Modificar un producto existente)
export const updateProduct = async (req, res) => {
  const { name, description, price, stock, category, imageUrl } = req.body;
  const index = mockProducts.findIndex(p => p._id === req.params.id);

  if (index !== -1) {
    mockProducts[index] = {
      ...mockProducts[index],
      name: name || mockProducts[index].name,
      description: description || mockProducts[index].description,
      price: price !== undefined ? Number(price) : mockProducts[index].price,
      stock: stock !== undefined ? Number(stock) : mockProducts[index].stock,
      category: category || mockProducts[index].category,
      imageUrl: imageUrl || mockProducts[index].imageUrl
    };
    res.json(mockProducts[index]);
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
};

// 4. ELIMINAR (Borrar un producto de la base de datos)
export const deleteProduct = async (req, res) => {
  const index = mockProducts.findIndex(p => p._id === req.params.id);
  
  if (index !== -1) {
    mockProducts = mockProducts.filter(p => p._id !== req.params.id);
    res.json({ message: 'Producto eliminado correctamente de la boutique' });
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
};
import mongoose from 'mongoose';

const orderSchema = mongoose.Schema({
  ticketId: { type: String, required: true, unique: true }, 
  operator: { type: String, required: true }, 
  items: [
    {
      name: { type: String, required: true },
      qty: { type: Number, required: true },
      price: { type: Number, required: true },
      product: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: 'Product' 
      }
    }
  ],
  subtotal: { type: Number, required: true },
  discount: { type: Number, required: true, default: 0 },
  pointsUsed: { type: Number, required: true, default: 0 },
  pointsEarned: { type: Number, required: true, default: 0 },
  iva: { type: Number, required: true },
  total: { type: Number, required: true }
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order; // <-- Sintaxis moderna
// Backend/src/controllers/cartController.js
const Cart = require('../models/Cart');

const cartController = {
  // Lấy thông tin giỏ hàng của user hiện tại
  getCart: async (req, res) => {
    try {
      // req.user.id được lấy từ authMiddleware sau khi verify token
      let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
      if (!cart) {
        cart = await Cart.create({ user: req.user.id, items: [] });
      }
      res.status(200).json({ success: true, cart });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Thêm sản phẩm vào giỏ
  addToCart: async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      let cart = await Cart.findOne({ user: req.user.id });

      if (!cart) {
        // Nếu chưa có giỏ hàng, tạo mới
        cart = new Cart({
          user: req.user.id,
          items: [{ product: productId, quantity: quantity || 1 }]
        });
      } else {
        // Kiểm tra sản phẩm đã có trong giỏ chưa
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        
        if (itemIndex > -1) {
          // Có rồi thì cộng dồn số lượng
          cart.items[itemIndex].quantity += (quantity || 1);
        } else {
          // Chưa có thì push vào mảng
          cart.items.push({ product: productId, quantity: quantity || 1 });
        }
      }

      await cart.save();
      const updatedCart = await Cart.findOne({ user: req.user.id }).populate('items.product');
      res.status(200).json({ success: true, message: 'Đã thêm vào giỏ hàng', cart: updatedCart });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Cập nhật số lượng (+ / -)
  updateCartItem: async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      const cart = await Cart.findOne({ user: req.user.id });

      if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

      const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        const updatedCart = await Cart.findOne({ user: req.user.id }).populate('items.product');
        res.status(200).json({ success: true, cart: updatedCart });
      } else {
        res.status(404).json({ success: false, message: 'Item not in cart' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Xóa 1 sản phẩm khỏi giỏ
  removeFromCart: async (req, res) => {
    try {
      const { productId } = req.params;
      const cart = await Cart.findOne({ user: req.user.id });

      if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

      cart.items = cart.items.filter(item => item.product.toString() !== productId);
      await cart.save();
      
      const updatedCart = await Cart.findOne({ user: req.user.id }).populate('items.product');
      res.status(200).json({ success: true, cart: updatedCart });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = cartController;
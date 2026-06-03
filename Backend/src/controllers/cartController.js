const cartService = require('../services/cartService');

const handleCartError = (res, error) => {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message
  });
};

const cartController = {
  getCart: async (req, res) => {
    try {
      const cart = await cartService.getOrCreateCart(req.user.id);
      return res.status(200).json({ success: true, cart });
    } catch (error) {
      return handleCartError(res, error);
    }
  },

  addToCart: async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      const cart = await cartService.addToCart({
        userId: req.user.id,
        productId,
        quantity: quantity || 1
      });

      return res.status(200).json({ success: true, message: 'Đã thêm vào giỏ hàng', cart });
    } catch (error) {
      return handleCartError(res, error);
    }
  },

  updateCartItem: async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      const cart = await cartService.updateCartItem({
        userId: req.user.id,
        productId,
        quantity
      });

      return res.status(200).json({ success: true, cart });
    } catch (error) {
      return handleCartError(res, error);
    }
  },

  removeFromCart: async (req, res) => {
    try {
      const cart = await cartService.removeFromCart({
        userId: req.user.id,
        productId: req.params.productId
      });

      return res.status(200).json({ success: true, cart });
    } catch (error) {
      return handleCartError(res, error);
    }
  }
};

module.exports = cartController;

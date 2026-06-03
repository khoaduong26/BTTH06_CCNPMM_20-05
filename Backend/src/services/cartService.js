const Cart = require('../models/Cart');

const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getPopulatedCart = async (userId) => {
  return Cart.findOne({ user: userId }).populate('items.product');
};

const getOrCreateCart = async (userId) => {
  let cart = await getPopulatedCart(userId);
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
};

const addToCart = async ({ userId, productId, quantity = 1 }) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = new Cart({
      user: userId,
      items: [{ product: productId, quantity }]
    });
  } else {
    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }
  }

  await cart.save();
  return getPopulatedCart(userId);
};

const updateCartItem = async ({ userId, productId, quantity }) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw createServiceError(404, 'Cart not found');
  }

  const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
  if (itemIndex === -1) {
    throw createServiceError(404, 'Item not in cart');
  }

  cart.items[itemIndex].quantity = quantity;
  await cart.save();
  return getPopulatedCart(userId);
};

const removeFromCart = async ({ userId, productId }) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw createServiceError(404, 'Cart not found');
  }

  cart.items = cart.items.filter((item) => item.product.toString() !== productId);
  await cart.save();
  return getPopulatedCart(userId);
};

module.exports = {
  getOrCreateCart,
  addToCart,
  updateCartItem,
  removeFromCart
};

const Cart = require('../models/Cart');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');

const ORDER_STATUSES = ['NEW', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'CANCELLATION_REQUESTED'];

const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const attachItemsToOrders = async (orders) => {
  return Promise.all(
    orders.map(async (order) => {
      const items = await OrderItem.find({ order: order._id }).populate('product');
      return {
        ...order.toJSON(),
        items
      };
    })
  );
};

const getEffectivePrice = (product) => {
  const price = Number(product?.price || 0);
  const discountPrice = Number(product?.discountPrice || 0);
  return discountPrice > 0 && discountPrice < price ? discountPrice : price;
};

const restoreStockForOrder = async (orderId) => {
  const items = await OrderItem.find({ order: orderId });
  await Promise.all(
    items.map(async (item) => {
      const product = await Product.findById(item.product);
      if (!product) return;

      product.stockQuantity += item.quantity;
      product.soldQuantity = Math.max((product.soldQuantity || 0) - item.quantity, 0);
      await product.save();
    })
  );
};

const checkoutCOD = async ({ userId, shippingAddress, phone, productIds }) => {
  if (!shippingAddress || !phone) {
    throw createServiceError(400, 'Vui lòng cung cấp địa chỉ và số điện thoại giao hàng');
  }

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw createServiceError(400, 'Vui lòng chọn ít nhất 1 sản phẩm để thanh toán');
  }

  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    throw createServiceError(400, 'Giỏ hàng của bạn đang trống');
  }

  const selectedCartItems = cart.items.filter((item) =>
    productIds.includes(item.product._id.toString())
  );

  if (selectedCartItems.length === 0) {
    throw createServiceError(400, 'Không tìm thấy sản phẩm hợp lệ trong giỏ hàng');
  }

  const invalidStockItem = selectedCartItems.find((item) => {
    return !item.product || item.product.stockQuantity < item.quantity;
  });

  if (invalidStockItem) {
    throw createServiceError(
      400,
      `Sản phẩm "${invalidStockItem.product?.name || 'không xác định'}" không đủ số lượng trong kho.`
    );
  }

  let total = 0;
  selectedCartItems.forEach((item) => {
    const actualPrice = getEffectivePrice(item.product);
    total += actualPrice * item.quantity;
  });

  const newOrder = new Order({
    user: userId,
    shippingAddress,
    phone,
    paymentMethod: 'COD',
    status: 'NEW',
    subtotal: total,
    total
  });
  await newOrder.save();

  const orderItems = selectedCartItems.map((item) => {
    const actualPrice = getEffectivePrice(item.product);
    const discountAmount = Math.max(Number(item.product.price || 0) - actualPrice, 0) * item.quantity;

    return {
      order: newOrder._id,
      product: item.product._id,
      quantity: item.quantity,
      unitPrice: actualPrice,
      discountAmount,
      total: actualPrice * item.quantity
    };
  });
  await OrderItem.insertMany(orderItems);

  await Promise.all(
    selectedCartItems.map((item) =>
      Product.updateOne(
        { _id: item.product._id },
        { $inc: { stockQuantity: -item.quantity, soldQuantity: item.quantity } }
      )
    )
  );

  const remainingItems = cart.items.filter((item) =>
    !productIds.includes(item.product._id.toString())
  );

  cart.items = remainingItems.map((item) => ({
    product: item.product._id,
    quantity: item.quantity
  }));

  await cart.save();
  return newOrder;
};

const getUserOrders = async (userId) => {
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
  const now = new Date();

  for (const order of orders) {
    if (order.status === 'NEW') {
      const diffMins = (now - new Date(order.createdAt)) / (1000 * 60);
      if (diffMins > 30) {
        order.status = 'CONFIRMED';
        await order.save();
      }
    }
  }

  return attachItemsToOrders(orders);
};

const getAdminOrders = async () => {
  const orders = await Order.find({})
    .populate('user', 'name email role')
    .sort({ createdAt: -1 });

  return attachItemsToOrders(orders);
};

const updateOrderStatus = async ({ orderId, status }) => {
  if (!ORDER_STATUSES.includes(status)) {
    throw createServiceError(400, 'Trạng thái đơn hàng không hợp lệ');
  }

  const order = await Order.findById(orderId).populate('user', 'name email role');
  if (!order) {
    throw createServiceError(404, 'Không tìm thấy đơn hàng');
  }

  const previousStatus = order.status;
  order.status = status;
  await order.save();

  if (status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
    await restoreStockForOrder(order._id);
  }

  const [orderWithItems] = await attachItemsToOrders([order]);
  return orderWithItems;
};

const cancelOrder = async ({ userId, orderId }) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw createServiceError(404, 'Không tìm thấy đơn hàng');
  }

  const now = new Date();
  const diffMins = (now - new Date(order.createdAt)) / (1000 * 60);

  if (order.status === 'PREPARING') {
    order.status = 'CANCELLATION_REQUESTED';
    await order.save();
    return { message: 'Đã gửi yêu cầu hủy đơn hàng đến cửa hàng!', order };
  }

  if ((order.status === 'NEW' || order.status === 'CONFIRMED') && diffMins <= 30) {
    order.status = 'CANCELLED';
    await order.save();
    await restoreStockForOrder(order._id);
    return { message: 'Hủy đơn hàng thành công!', order };
  }

  throw createServiceError(
    400,
    'Không thể hủy đơn hàng. Đơn hàng đã quá 30 phút hoặc đang trong quá trình vận chuyển.'
  );
};

module.exports = {
  checkoutCOD,
  getUserOrders,
  getAdminOrders,
  updateOrderStatus,
  cancelOrder
};

const orderService = require('../services/orderService');

const logControllerError = (operation, error) => {
  console.error(`[orderController:${operation}]`, {
    message: error.message,
    stack: error.stack
  });
};

const handleOrderError = (res, operation, error, fallbackMessage = 'Lỗi server') => {
  logControllerError(operation, error);
  return res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : fallbackMessage
  });
};

exports.checkoutCOD = async (req, res) => {
  try {
    const { shippingAddress, phone, productIds } = req.body;
    const order = await orderService.checkoutCOD({
      userId: req.user.id,
      shippingAddress,
      phone,
      productIds
    });

    return res.status(201).json({ message: 'Đặt hàng thành công', order });
  } catch (error) {
    return handleOrderError(res, 'checkoutCOD', error, 'Đã xảy ra lỗi trên server');
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await orderService.getUserOrders(req.user.id);
    return res.status(200).json({ orders });
  } catch (error) {
    return handleOrderError(res, 'getUserOrders', error);
  }
};

exports.getAdminOrders = async (_req, res) => {
  try {
    const orders = await orderService.getAdminOrders();
    return res.status(200).json({ orders });
  } catch (error) {
    return handleOrderError(res, 'getAdminOrders', error);
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await orderService.updateOrderStatus({
      orderId: req.params.orderId,
      status: req.body.status
    });

    return res.status(200).json({ message: 'Cập nhật trạng thái đơn hàng thành công', order });
  } catch (error) {
    return handleOrderError(res, 'updateOrderStatus', error);
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const result = await orderService.cancelOrder({
      userId: req.user.id,
      orderId: req.params.orderId
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleOrderError(res, 'cancelOrder', error);
  }
};

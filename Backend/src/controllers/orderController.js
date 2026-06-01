const Cart = require('../models/Cart');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');

const ORDER_STATUSES = ['NEW', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'CANCELLATION_REQUESTED'];

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

exports.checkoutCOD = async (req, res) => {
  try {
    const userId = req.user.id;
    // Nhận thêm mảng productIds từ request body
    const { shippingAddress, phone, productIds } = req.body; 

    if (!shippingAddress || !phone) {
      return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ và số điện thoại giao hàng' });
    }
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 sản phẩm để thanh toán' });
    }

    // 1. Lấy giỏ hàng hiện tại
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng của bạn đang trống' });
    }

    // 2. Lọc ra các sản phẩm NGƯỜI DÙNG ĐÃ CHỌN (dựa vào mảng productIds)
    const selectedCartItems = cart.items.filter(item => 
      productIds.includes(item.product._id.toString())
    );

    if (selectedCartItems.length === 0) {
      return res.status(400).json({ message: 'Không tìm thấy sản phẩm hợp lệ trong giỏ hàng' });
    }

    const invalidStockItem = selectedCartItems.find((item) => {
      return !item.product || item.product.stockQuantity < item.quantity;
    });

    if (invalidStockItem) {
      return res.status(400).json({
        message: `Sản phẩm "${invalidStockItem.product?.name || 'không xác định'}" không đủ số lượng trong kho.`
      });
    }

    let total = 0;
    selectedCartItems.forEach(item => {
      const actualPrice = getEffectivePrice(item.product);
      total += actualPrice * item.quantity;
    });

    // 4. Tạo Đơn hàng mới (Order)
    const newOrder = new Order({
      user: userId,
      shippingAddress,
      phone,
      paymentMethod: 'COD',
      status: 'NEW', 
      subtotal: total,
      total: total 
    });
    await newOrder.save();

    // 5. Di chuyển dữ liệu sang OrderItem
    const orderItems = selectedCartItems.map(item => {
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

    // 6. XÓA CÁC SẢN PHẨM ĐÃ MUA khỏi giỏ hàng (giữ lại các sản phẩm chưa mua)
    const remainingItems = cart.items.filter(item => 
      !productIds.includes(item.product._id.toString())
    );

    cart.items = remainingItems.map(item => ({
      product: item.product._id,
      quantity: item.quantity
    }));

    // Lưu lại giỏ hàng
    await cart.save();

    res.status(201).json({ message: 'Đặt hàng thành công', order: newOrder });
  } catch (error) {
    console.error("Lỗi khi checkout:", error);
    res.status(500).json({ message: 'Đã xảy ra lỗi trên server' });
  }
  
};
// 1. Lấy danh sách lịch sử đơn hàng của User
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    // Lấy tất cả đơn hàng của user, xếp đơn mới nhất lên đầu
    let orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    const now = new Date();
    
    // Mẹo xử lý tự động: Duyệt qua các đơn hàng, nếu đơn nào là 'NEW' mà quá 30 phút thì tự động cập nhật thành 'CONFIRMED'
    for (let order of orders) {
      if (order.status === 'NEW') {
        const diffMins = (now - new Date(order.createdAt)) / (1000 * 60);
        if (diffMins > 30) {
          order.status = 'CONFIRMED';
          await order.save();
        }
      }
    }

    // Gộp chi tiết các sản phẩm (OrderItem) vào từng đơn hàng để hiển thị lên UI
    const ordersWithItems = await attachItemsToOrders(orders);

    res.status(200).json({ orders: ordersWithItems });
  } catch (error) {
    console.error("Lỗi lấy lịch sử đơn hàng:", error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};  

exports.getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    const ordersWithItems = await attachItemsToOrders(orders);
    res.status(200).json({ orders: ordersWithItems });
  } catch (error) {
    console.error("Lỗi admin lấy danh sách đơn hàng:", error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
    }

    const order = await Order.findById(orderId).populate('user', 'name email role');
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    if (status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
      await restoreStockForOrder(order._id);
    }

    const [orderWithItems] = await attachItemsToOrders([order]);
    res.status(200).json({ message: 'Cập nhật trạng thái đơn hàng thành công', order: orderWithItems });
  } catch (error) {
    console.error("Lỗi admin cập nhật trạng thái đơn hàng:", error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// 2. Logic hủy đơn hàng
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const now = new Date();
    const diffMins = (now - new Date(order.createdAt)) / (1000 * 60); // Tính số phút trôi qua

    // Trường hợp 1: Shop đang chuẩn bị hàng (PREPARING) -> Gửi yêu cầu hủy đơn
    if (order.status === 'PREPARING') {
      order.status = 'CANCELLATION_REQUESTED';
      await order.save();
      return res.status(200).json({ message: 'Đã gửi yêu cầu hủy đơn hàng đến cửa hàng!', order });
    }

    // Trường hợp 2: Đang ở bước NEW hoặc CONFIRMED và chưa quá 30 phút -> Cho phép hủy trực tiếp
    if ((order.status === 'NEW' || order.status === 'CONFIRMED') && diffMins <= 30) {
      order.status = 'CANCELLED';
      await order.save();
      await restoreStockForOrder(order._id);
      return res.status(200).json({ message: 'Hủy đơn hàng thành công!', order });
    }

    // Trường hợp còn lại: Quá 30 phút hoặc đang giao/đã giao -> Không được hủy
    return res.status(400).json({ 
      message: 'Không thể hủy đơn hàng. Đơn hàng đã quá 30 phút hoặc đang trong quá trình vận chuyển.' 
    });
  } catch (error) {
    console.error("Lỗi khi hủy đơn:", error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};  


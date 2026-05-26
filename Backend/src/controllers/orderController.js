const Cart = require('../models/Cart');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

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

    let total = 0;
    selectedCartItems.forEach(item => {
      const actualPrice = (item.product.discountPrice && item.product.discountPrice > 0) 
                          ? item.product.discountPrice 
                          : item.product.price;
                          
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
    const orderItems = selectedCartItems.map(item => ({
      order: newOrder._id,
      product: item.product._id,
      quantity: item.quantity,
      unitPrice: item.product.price,
      total: item.product.price * item.quantity
    }));
    await OrderItem.insertMany(orderItems);

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
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({ order: order._id }).populate('product');
        return {
          ...order.toJSON(),
          items
        };
      })
    );

    res.status(200).json({ orders: ordersWithItems });
  } catch (error) {
    console.error("Lỗi lấy lịch sử đơn hàng:", error);
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


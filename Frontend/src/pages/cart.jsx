import React, { useEffect, useState } from 'react';
import { getCartAPI, updateCartItemAPI, removeCartItemAPI } from '../util/cart.api';
import { Link, useNavigate } from 'react-router-dom';
import { message, Popconfirm } from 'antd';
const CartPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const res = await getCartAPI();
            if (res && res.cart) {
                setCartItems(res.cart.items);
            }
        } catch (error) {
            console.error("Lỗi khi tải giỏ hàng:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuantity = async (productId, newQuantity) => {
        const qty = parseInt(newQuantity);
        if (isNaN(qty) || qty < 1) return;

        try {
            console.log("Đang cập nhật SP:", productId, "-> Số lượng:", qty);
            const res = await updateCartItemAPI(productId, qty);

            const dataCart = res?.cart || res?.data?.cart;
            if (dataCart) {
                setCartItems(dataCart.items);
            }
        } catch (error) {
            console.error("Lỗi cập nhật số lượng:", error);
            message.error("Không thể cập nhật số lượng. Vui lòng thử lại!");
        }
    };

    const handleRemoveItem = async (productId) => {
    if (!productId) return;
    try {
        const res = await removeCartItemAPI(productId);
        const dataCart = res?.cart || res?.data?.cart;
        if (dataCart) {
            setCartItems(dataCart.items);
        } else {
            fetchCart(); 
        }
        message.success("Đã xóa sản phẩm khỏi giỏ hàng thành công!");
    } catch (error) {
        console.error("Lỗi xóa sản phẩm", error);
        message.error("Không thể xóa sản phẩm. Vui lòng thử lại!");
    }
};

    const totalPrice = cartItems.reduce((total, item) => {
        return total + ((item.product?.price || 0) * item.quantity);
    }, 0);

    if (loading) return <div className="text-center py-10 text-xl font-semibold">Đang tải giỏ hàng...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold uppercase mb-8 text-gray-800 border-b-2 border-gray-200 pb-4">
                Giỏ hàng của bạn
            </h1>

            {cartItems.length === 0 ? (
                <div className="text-center bg-white p-10 rounded shadow">
                    <p className="mb-4 text-gray-500">Giỏ hàng của bạn đang trống.</p>
                    <Link to="/" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
                        Tiếp tục mua sắm
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Cột danh sách sản phẩm */}
                    <div className="w-full lg:w-3/4 bg-white rounded shadow p-6">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b text-gray-600">
                                    <th className="pb-3 uppercase font-medium">Sản phẩm</th>
                                    <th className="pb-3 uppercase font-medium">Đơn giá</th>
                                    <th className="pb-3 uppercase font-medium">Số lượng</th>
                                    <th className="pb-3 uppercase font-medium">Thành tiền</th>
                                    <th className="pb-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cartItems.map((item) => (
                                    <tr key={item.product?._id || Math.random()} className="border-b hover:bg-gray-50">
                                        <td className="py-4 flex items-center gap-4">
                                            {/* ĐÃ FIX LỖI ĐỌC ẢNH Ở ĐÂY */}
                                            <img 
                                                src={item.product?.imageUrls?.[0] ? item.product.imageUrls[0] : 'https://placehold.co/150x150?text=No+Image'} 
                                                alt={item.product?.name || 'Sản phẩm'} 
                                                className="w-20 h-20 object-cover border rounded"
                                                onError={(e) => {
                                                    e.currentTarget.src = 'https://placehold.co/150x150?text=No+Image';
                                                }}
                                            />
                                            <span className="font-semibold text-gray-700">
                                                {item.product?.name || 'Sản phẩm không tồn tại'}
                                            </span>
                                        </td>
                                        <td className="py-4 font-medium">
                                            {item.product?.price?.toLocaleString('vi-VN')} đ
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center border w-max rounded bg-white">
                                                <button 
                                                    // Dùng Number() để đảm bảo làm toán trừ, thêm fallback id
                                                    onClick={() => handleUpdateQuantity(item.product?._id || item.product?.id, Number(item.quantity) - 1)}
                                                    className="px-3 py-1 hover:bg-gray-100 font-bold text-gray-600 transition-colors"
                                                >-</button>
                                                
                                                <input 
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        if (!isNaN(val) && val > 0) {
                                                            
                                                            handleUpdateQuantity(item.product?._id || item.product?.id, val);
                                                        }
                                                    }}
                                                    className="w-14 text-center outline-none border-x py-1 font-semibold text-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />

                                                <button 
                                                    // Dùng Number() để đảm bảo làm toán cộng
                                                    onClick={() => handleUpdateQuantity(item.product?._id || item.product?.id, Number(item.quantity) + 1)}
                                                    className="px-3 py-1 hover:bg-gray-100 font-bold text-gray-600 transition-colors"
                                                >+</button>
                                            </div>
                                        </td>
                                        <td className="py-4 font-bold text-red-600">
                                            {((item.product?.price || 0) * item.quantity).toLocaleString('vi-VN')} đ
                                        </td>
                                        <td className="py-4 text-right">
                                            <Popconfirm
                                                title="Xóa sản phẩm"
                                                description="Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?"
                                                onConfirm={() => handleRemoveItem(item.product?._id || item.product?.id)}
                                                okText="Có, xóa"
                                                cancelText="Hủy"
                                                okButtonProps={{ danger: true }} 
                                            >
                                                <button className="text-red-500 hover:text-red-700 font-semibold transition-colors">
                                                    Xóa
                                                </button>
                                            </Popconfirm>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Cột Tổng kết & Thanh toán */}
                    <div className="w-full lg:w-1/4">
                        <div className="bg-white rounded shadow p-6 sticky top-24">
                            <h2 className="text-xl font-bold uppercase border-b pb-3 mb-4 text-gray-800">Thông tin đơn hàng</h2>
                            <div className="flex justify-between mb-4 text-gray-600">
                                <span>Tạm tính:</span>
                                <span className="font-semibold">{totalPrice.toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className="flex justify-between mb-6 text-xl font-bold text-red-600">
                                <span>Tổng cộng:</span>
                                <span>{totalPrice.toLocaleString('vi-VN')} đ</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-6 italic">Phí vận chuyển sẽ được tính ở trang thanh toán.</p>
                            
                            <button 
                                onClick={() => navigate('/checkout')}
                                className="w-full bg-red-600 text-white py-3 rounded font-bold uppercase tracking-wide hover:bg-red-700 transition"
                            >
                                Tiến hành thanh toán
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;
import React, { useEffect, useState } from 'react';
import { getCartAPI, updateCartItemAPI, removeCartItemAPI } from '../util/cart.api';
import { Link, useNavigate } from 'react-router-dom';
import { message, Popconfirm } from 'antd';

const CartPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    // Danh sách ID các sản phẩm được tích chọn
    const [selectedIds, setSelectedIds] = useState([]);
    
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
            const res = await updateCartItemAPI(productId, qty);
            if (res?.cart || res?.data?.cart) {
                setCartItems(res.cart?.items || res.data.cart.items);
            }
        } catch (error) {
            message.error("Không thể cập nhật số lượng.");
        }
    };

    const handleRemoveItem = async (productId) => {
        if (!productId) return;
        try {
            const res = await removeCartItemAPI(productId);
            if (res?.cart || res?.data?.cart) {
                setCartItems(res.cart?.items || res.data.cart.items);
            } else {
                fetchCart(); 
            }
            setSelectedIds(prev => prev.filter(id => id !== productId));
            message.success("Đã xóa sản phẩm khỏi giỏ hàng!");
        } catch (error) {
            message.error("Không thể xóa sản phẩm.");
        }
    };

    // Xử lý khi tick chọn 1 sản phẩm
    const handleToggleSelect = (productId) => {
        setSelectedIds(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            } else {
                return [...prev, productId];
            }
        });
    };

    // Xử lý khi tick "Chọn tất cả"
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = cartItems.map(item => item.product?._id || item.product?.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    // Chuyển hướng sang trang thanh toán kèm theo dữ liệu ID đã chọn
    const handleGoToCheckout = () => {
        if (selectedIds.length === 0) {
            message.warning("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
            return;
        }
        navigate('/checkout', { state: { selectedIds } });
    };

    // Chỉ tính tổng tiền của những sản phẩm đang được tick
    const totalPrice = cartItems
    .filter(item => selectedIds.includes(item.product?._id || item.product?.id))
    .reduce((total, item) => {
        const originalPrice = Number(item.product?.price || 0);
        const discountPrice = Number(item.product?.discountPrice || 0);
        const hasDiscount = discountPrice > 0 && discountPrice < originalPrice;
        const actualPrice = hasDiscount ? discountPrice : originalPrice;
            
        return total + (actualPrice * item.quantity);
    }, 0);

    const isAllSelected = cartItems.length > 0 && selectedIds.length === cartItems.length;

    if (loading) return <div className="text-center py-10 text-xl font-semibold text-ink">Đang tải giỏ hàng...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-stone-200 pb-4 gap-4">
                <h1 className="text-3xl font-bold uppercase text-ink">
                    Giỏ hàng của bạn
                </h1>
                <Link 
                    to="/user/orders" 
                    className="flex items-center gap-2 text-primary hover:text-white border border-primary hover:bg-primary rounded-md px-4 py-2 font-semibold text-sm transition-all shadow-sm"
                >
                    📋 Đơn mua của tôi
                </Link>
            </div>

            {cartItems.length === 0 ? (
                <div className="text-center bg-surface p-10 rounded-lg border border-stone-200 shadow-sm">
                    <p className="mb-4 text-inkLight">Giỏ hàng của bạn đang trống.</p>
                    <Link to="/" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-amber-700 transition">
                        Tiếp tục mua sắm
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-3/4 bg-surface rounded-lg border border-stone-200 shadow-sm p-6 overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="border-b border-stone-200 text-inkLight">
                                    <th className="pb-3 w-10">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 cursor-pointer accent-primary"
                                            checked={isAllSelected}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="pb-3 uppercase font-medium">Sản phẩm</th>
                                    <th className="pb-3 uppercase font-medium">Đơn giá</th>
                                    <th className="pb-3 uppercase font-medium text-center">Số lượng</th>
                                    <th className="pb-3 uppercase font-medium">Thành tiền</th>
                                    <th className="pb-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cartItems.map((item) => {
                                    const productId = item.product?._id || item.product?.id;
                                    const isSelected = selectedIds.includes(productId);
                                    const originalPrice = Number(item.product?.price || 0);
                                    const discountPrice = Number(item.product?.discountPrice || 0);
                                    const hasDiscount = discountPrice > 0 && discountPrice < originalPrice;
                                    const displayPrice = hasDiscount ? discountPrice : originalPrice;
                                    return (
                                    <tr key={productId || Math.random()} className="border-b border-stone-100 hover:bg-primarySoft/40 transition-colors">
                                        <td className="py-4">
                                            <input 
                                                type="checkbox" 
                                                className="w-5 h-5 cursor-pointer accent-primary"
                                                checked={isSelected}
                                                onChange={() => handleToggleSelect(productId)}
                                            />
                                        </td>
                                        <td className="py-4 flex items-center gap-4">
                                            <img 
                                                src={item.product?.imageUrls?.[0] || 'https://placehold.co/150x150?text=No+Image'} 
                                                alt={item.product?.name || 'Sản phẩm'} 
                                                className="w-16 h-16 object-cover border border-stone-200 rounded-md"
                                            />
                                            <span className="font-semibold text-ink line-clamp-2">
                                                {item.product?.name || 'Sản phẩm không tồn tại'}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <div className="font-medium text-primary">
                                                {displayPrice.toLocaleString('vi-VN')} đ
                                            </div>
                                            {hasDiscount && (
                                                <div className="text-sm text-inkLight/60 line-through">
                                                    {originalPrice.toLocaleString('vi-VN')} đ
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center justify-center border border-stone-200 w-max rounded-md bg-white mx-auto">
                                                <button 
                                                    onClick={() => handleUpdateQuantity(productId, Number(item.quantity) - 1)}
                                                    className="px-3 py-1 hover:bg-primarySoft font-bold text-inkLight transition-colors"
                                                >-</button>
                                                <input 
                                                    type="number" min="1" value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        if (!isNaN(val) && val > 0) handleUpdateQuantity(productId, val);
                                                    }}
                                                    className="w-12 text-center outline-none border-x border-stone-200 py-1 font-semibold text-ink [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button 
                                                    onClick={() => handleUpdateQuantity(productId, Number(item.quantity) + 1)}
                                                    className="px-3 py-1 hover:bg-primarySoft font-bold text-inkLight transition-colors"
                                                >+</button>
                                            </div>
                                        </td>
                                        <td className="py-4 font-bold text-primary">
                                            {(displayPrice * item.quantity).toLocaleString('vi-VN')} đ
                                        </td>
                                        <td className="py-4 text-right">
                                            <Popconfirm
                                                title="Xóa sản phẩm"
                                                description="Xóa sản phẩm này khỏi giỏ hàng?"
                                                onConfirm={() => handleRemoveItem(productId)}
                                                okText="Có" cancelText="Hủy" okButtonProps={{ danger: true }} 
                                            >
                                                <button className="text-red-500 hover:text-red-700 font-semibold">Xóa</button>
                                            </Popconfirm>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>

                    <div className="w-full lg:w-1/4">
                        <div className="bg-surface rounded-lg border border-stone-200 shadow-sm p-6 sticky top-24">
                            <h2 className="text-xl font-bold uppercase border-b border-stone-200 pb-3 mb-4 text-ink">Thông tin đơn hàng</h2>
                            <div className="flex justify-between mb-4 text-inkLight">
                                <span>Đã chọn:</span>
                                <span className="font-semibold">{selectedIds.length} sản phẩm</span>
                            </div>
                            <div className="flex justify-between mb-6 text-xl font-bold text-primary border-t border-stone-200 pt-4">
                                <span>Tổng cộng:</span>
                                <span>{totalPrice.toLocaleString('vi-VN')} đ</span>
                            </div>
                            
                            <button 
                                onClick={handleGoToCheckout}
                                disabled={selectedIds.length === 0}
                                className={`w-full text-white py-3 rounded-md font-bold uppercase tracking-wide transition ${selectedIds.length === 0 ? 'bg-stone-400 cursor-not-allowed' : 'bg-primary hover:bg-amber-700'}`}
                            >
                                Mua Hàng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;

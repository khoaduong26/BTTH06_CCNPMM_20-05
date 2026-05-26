import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { checkoutCodAPI } from '../util/order.api';
import { getCartAPI } from '../util/cart.api';

const CheckoutPage = () => {
    const navigate = useNavigate();
    
    // SỬ DỤNG USELOCATION ĐỂ LẤY DATA TỪ TRANG CART TRUYỀN SANG
    const location = useLocation();
    // Lấy mảng ID sản phẩm đã chọn (nếu người dùng vào thẳng link /checkout không qua cart thì mảng rỗng)
    const selectedIds = location.state?.selectedIds || [];

    const [formData, setFormData] = useState({ fullName: '', phone: '', shippingAddress: '', note: '' });
    const [cartItems, setCartItems] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);

    useEffect(() => {
        // Chặn người dùng nếu họ chưa chọn sản phẩm nào mà cố tình vào URL /checkout
        if (selectedIds.length === 0) {
            message.warning("Vui lòng chọn sản phẩm từ giỏ hàng trước!");
            navigate('/cart');
            return;
        }
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const res = await getCartAPI();
            if (res && res.cart && res.cart.items.length > 0) {
                // QUAN TRỌNG: Chỉ lọc và hiển thị những sản phẩm nằm trong mảng selectedIds
                const filteredItems = res.cart.items.filter(item => 
                    selectedIds.includes(item.product?._id || item.product?.id)
                );
                
                if(filteredItems.length === 0) {
                    message.warning("Không tìm thấy sản phẩm đã chọn trong giỏ.");
                    navigate('/cart');
                    return;
                }
                setCartItems(filteredItems);
            }
        } catch (error) {
            message.error("Không thể tải dữ liệu đơn hàng.");
        } finally {
            setLoadingData(false);
        }
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            message.error("Trình duyệt không hỗ trợ lấy vị trí.");
            return;
        }
        setFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=vi`);
                    const data = await response.json();
                    if (data && data.display_name) {
                        setFormData(prev => ({ ...prev, shippingAddress: data.display_name }));
                        message.success("Đã lấy được vị trí!");
                    }
                } catch (error) {
                    message.error("Lỗi kết nối khi lấy địa chỉ.");
                } finally {
                    setFetchingLocation(false);
                }
            },
            () => { setFetchingLocation(false); message.error("Không thể lấy vị trí. Vui lòng bật GPS."); },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleCheckoutCOD = async (e) => {
        e.preventDefault();
        if (!formData.fullName || !formData.shippingAddress || !formData.phone) {
            message.warning("Vui lòng điền đầy đủ thông tin nhận hàng");
            return;
        }

        setSubmitting(true);
        try {
            const finalAddress = `[Người nhận: ${formData.fullName}] ${formData.shippingAddress} ${formData.note ? ` - [Ghi chú: ${formData.note}]` : ''}`;
            
            // CẬP NHẬT PAYLOAD: Truyền thêm mảng productIds xuống Backend
            const payload = {
                phone: formData.phone,
                shippingAddress: finalAddress,
                productIds: selectedIds 
            };

            const res = await checkoutCodAPI(payload);
            if (res && res.order) {
                message.success("Đặt hàng thành công!");
                navigate('/user/orders'); 
            }
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi đặt hàng. Vui lòng thử lại!");
        } finally {
            setSubmitting(false);
        }
    };

    const subtotal = cartItems.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);
    const total = subtotal; // Freeship

    if (loadingData) return <div className="text-center py-10">Đang tải thông tin đơn hàng...</div>;

    return (
        <div className="bg-gray-100 min-h-screen py-8 text-gray-800">
            <div className="max-w-5xl mx-auto px-4 space-y-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Thanh Toán Đơn Hàng</h1>

                <form onSubmit={handleCheckoutCOD} className="space-y-4">
                    {/* SECTION 1: ĐỊA CHỈ NHẬN HÀNG */}
                    <div className="bg-white rounded-sm shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[repeating-linear-gradient(45deg,#ff6c6c,#ff6c6c_33px,transparent_0,transparent_41px,#428bfa_0,#428bfa_74px,transparent_0,transparent_82px)]"></div>
                        <div className="p-6">
                            <h2 className="text-lg font-semibold mb-4 text-red-600 flex items-center gap-2">📍 Địa Chỉ Nhận Hàng</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Họ và tên người nhận</label>
                                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full border p-2 rounded" required placeholder="Nhập họ tên" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Số điện thoại</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border p-2 rounded" required placeholder="Nhập số điện thoại" />
                                </div>
                                <div className="md:col-span-2">
                                    <div className="flex justify-between items-end mb-1">
                                        <label className="block text-sm text-gray-600">Địa chỉ giao hàng cụ thể</label>
                                        <button type="button" onClick={handleGetLocation} disabled={fetchingLocation} className={`text-sm flex items-center gap-1 font-semibold ${fetchingLocation ? 'text-gray-400' : 'text-blue-600'}`}>
                                            {fetchingLocation ? '⏳ Đang định vị...' : '📍 Tự động lấy vị trí'}
                                        </button>
                                    </div>
                                    <textarea name="shippingAddress" value={formData.shippingAddress} onChange={handleInputChange} className="w-full border p-2 rounded" rows="2" required placeholder="Tòa nhà, Đường, Phường..."></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: SẢN PHẨM & GHI CHÚ */}
                    <div className="bg-white p-6 rounded-sm shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Sản phẩm đơn hàng</h2>
                        <div className="space-y-4 mb-6">
                            {cartItems.map(item => (
                                <div key={item.product?._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <img src={item.product?.imageUrls?.[0] || 'https://placehold.co/80x80'} alt={item.product?.name} className="w-16 h-16 object-cover border rounded"/>
                                        <div>
                                            <p className="font-semibold text-gray-700">{item.product?.name || 'Sản phẩm'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-600">{item.product?.price?.toLocaleString('vi-VN')} đ</p>
                                        <p className="text-sm text-gray-500">x{item.quantity}</p>
                                        <p className="font-semibold text-gray-800 mt-1">{((item.product?.price || 0) * item.quantity).toLocaleString('vi-VN')} đ</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center border-t pt-4">
                            <label className="text-gray-700 whitespace-nowrap mr-4 font-medium">Lời nhắn:</label>
                            <input type="text" name="note" value={formData.note} onChange={handleInputChange} className="w-full border-b border-gray-300 py-1 bg-transparent text-sm" placeholder="Lưu ý cho người bán..."/>
                        </div>
                    </div>

                    {/* SECTION 3: PHƯƠNG THỨC THANH TOÁN */}
                    <div className="bg-white p-6 rounded-sm shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
                        <div className="flex gap-4">
                            <button type="button" className="border-2 border-red-500 text-red-500 bg-red-50 py-2 px-4 rounded font-medium relative">
                                Thanh toán khi nhận hàng (COD)
                                <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-bl-sm">✓</div>
                            </button>
                        </div>
                    </div>

                    {/* SECTION 4: TỔNG KẾT & ĐẶT HÀNG */}
                    <div className="bg-[#fffefb] border border-gray-200 p-6 rounded-sm shadow-sm text-right">
                        <div className="flex justify-end items-center mb-2 gap-4 text-gray-600">
                            <span>Tổng tiền hàng:</span>
                            <span className="w-32">{subtotal.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="flex justify-end items-center mb-6 gap-4">
                            <span className="font-semibold text-gray-700">Tổng thanh toán:</span>
                            <span className="w-32 text-2xl font-bold text-red-600">{total.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-6">
                            <p className="text-sm text-gray-500 text-left max-w-md">Nhấn "Đặt hàng" đồng nghĩa với việc bạn đồng ý tuân theo <span className="text-blue-600 cursor-pointer">Điều khoản</span>.</p>
                            <button type="submit" disabled={submitting} className={`bg-red-600 text-white px-10 py-3 rounded text-lg font-bold hover:bg-red-700 transition shadow ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {submitting ? 'Đang xử lý...' : 'ĐẶT HÀNG'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CheckoutPage;
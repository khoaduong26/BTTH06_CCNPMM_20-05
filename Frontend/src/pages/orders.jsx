import React, { useEffect, useState } from 'react';
import { getUserOrdersAPI, cancelOrderAPI } from '../util/order.api';
import { message, Popconfirm, Tag } from 'antd';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const res = await getUserOrdersAPI();
            if (res && res.orders) {
                setOrders(res.orders);
            }
        } catch (error) {
            message.error("Không thể tải danh sách đơn hàng.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (orderId) => {
        try {
            const res = await cancelOrderAPI(orderId);
            message.success(res.message || "Xử lý đơn hàng thành công!");
            loadOrders(); // Tải lại danh sách sau khi hủy
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể hủy đơn hàng.");
        }
    };

    // Hàm chuyển đổi tên biến trạng thái sang tiếng Việt và màu sắc hiển thị
    const renderStatus = (status) => {
        switch (status) {
            case 'NEW': return <Tag color="blue">Đơn hàng mới</Tag>;
            case 'CONFIRMED': return <Tag color="cyan">Đã xác nhận</Tag>;
            case 'PREPARING': return <Tag color="orange">Shop đang chuẩn bị hàng</Tag>;
            case 'SHIPPING': return <Tag color="purple">Đang giao hàng</Tag>;
            case 'DELIVERED': return <Tag color="green">Đã giao thành công</Tag>;
            case 'CANCELLED': return <Tag color="red">Đã hủy đơn</Tag>;
            case 'CANCELLATION_REQUESTED': return <Tag color="volcano">Đang yêu cầu hủy</Tag>;
            default: return <Tag>{status}</Tag>;
        }
    };

    // Lọc danh sách đơn hàng dựa trên Tab người dùng đang chọn
    const filteredOrders = orders.filter(order => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'CANCELLED_GROUP') return ['CANCELLED', 'CANCELLATION_REQUESTED'].includes(order.status);
        return order.status === activeTab;
    });

    const tabs = [
        { key: 'ALL', label: 'Tất cả' },
        { key: 'NEW', label: 'Chờ xác nhận' },
        { key: 'CONFIRMED', label: 'Đã xác nhận' },
        { key: 'PREPARING', label: 'Đang chuẩn bị' },
        { key: 'SHIPPING', label: 'Đang giao' },
        { key: 'DELIVERED', label: 'Đã giao' },
        { key: 'CANCELLED_GROUP', label: 'Đã hủy/Yêu cầu hủy' },
    ];

    if (loading) return <div className="text-center py-10 text-ink">Đang tải danh sách đơn hàng...</div>;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
            <h1 className="text-2xl font-bold uppercase mb-6 text-ink">Đơn mua của bạn</h1>

            <div className="flex bg-surface shadow-sm rounded-lg border border-stone-200 mb-4 overflow-x-auto whitespace-nowrap">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-3 px-4 text-center font-medium border-b-2 transition-colors ${
                            activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-inkLight hover:text-primary'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {filteredOrders.length === 0 ? (
                <div className="text-center bg-surface p-12 rounded-lg border border-stone-200 shadow-sm text-inkLight">Không có đơn hàng nào.</div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map(order => {
                        // Tính toán xem đơn hàng đã đặt được bao nhiêu phút
                        const diffMins = (new Date() - new Date(order.createdAt)) / (1000 * 60);
                        // Điều kiện hiển thị nút hủy trực tiếp hoặc nút gửi yêu cầu hủy
                        const canCancelDirectly = ['NEW', 'CONFIRMED'].includes(order.status) && diffMins <= 30;
                        const canRequestCancel = order.status === 'PREPARING';

                        return (
                            <div key={order.id} className="bg-surface shadow-sm rounded-lg p-6 border border-stone-200">
                                <div className="flex justify-between items-center border-b border-stone-200 pb-3 mb-4">
                                    <span className="text-sm text-inkLight">
                                        Mã đơn: <span className="font-semibold text-ink">{order.id}</span> | Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
                                    </span>
                                    <div>{renderStatus(order.status)}</div>
                                </div>

                                <div className="space-y-3">
                                    {order.items?.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={item.product?.imageUrls?.[0] || 'https://placehold.co/50x50'} 
                                                    alt="" className="w-12 h-12 object-cover border border-stone-200 rounded-md"
                                                />
                                                <div>
                                                    <p className="font-semibold text-ink">{item.product?.name}</p>
                                                    <p className="text-xs text-inkLight/70">Số lượng: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <span className="text-inkLight font-medium">
                                                {item.unitPrice?.toLocaleString('vi-VN')} đ
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-stone-200 mt-4 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-primarySoft/45 p-3 rounded-md">
                                    <div className="text-xs text-inkLight space-y-1">
                                        <p>📞 SĐT: {order.phone}</p>
                                        <p className="line-clamp-1">📍 Địa chỉ: {order.shippingAddress}</p>
                                    </div>
                                    
                                    <div className="text-right self-end md:self-auto space-y-2">
                                        <div>
                                            <span className="text-sm text-inkLight">Tổng số tiền: </span>
                                            <span className="text-lg font-bold text-primary">{order.total?.toLocaleString('vi-VN')} đ</span>
                                        </div>

                                        {canCancelDirectly && (
                                            <Popconfirm
                                                title="Hủy đơn hàng" description="Bạn có chắc chắn muốn hủy đơn hàng này trực tiếp?"
                                                onConfirm={() => handleCancel(order.id)} okText="Có, hủy đơn" cancelText="Không" okButtonProps={{ danger: true }}
                                            >
                                                <button className="bg-red-500 text-white px-4 py-1.5 rounded-md text-xs font-semibold hover:bg-red-600 transition">
                                                    Hủy đơn hàng (Còn {Math.max(0, Math.floor(30 - diffMins))} phút)
                                                </button>
                                            </Popconfirm>
                                        )}

                                        {canRequestCancel && (
                                            <Popconfirm
                                                title="Yêu cầu hủy đơn" description="Đơn hàng đang chuẩn bị, gửi yêu cầu yêu cầu shop hủy giúp bạn?"
                                                onConfirm={() => handleCancel(order.id)} okText="Gửi yêu cầu" cancelText="Không"
                                            >
                                                <button className="bg-amber-600 text-white px-4 py-1.5 rounded-md text-xs font-semibold hover:bg-amber-700 transition">
                                                    Gửi Yêu cầu hủy đơn cho shop
                                                </button>
                                            </Popconfirm>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default OrdersPage;

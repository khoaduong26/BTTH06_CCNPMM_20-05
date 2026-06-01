import { useEffect, useMemo, useState } from 'react';
import { message, Popconfirm, Select, Tag } from 'antd';
import { getAdminOrdersAPI, updateOrderStatusAPI } from '../util/order.api';

const STATUS_OPTIONS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'NEW', label: 'Mới' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'PREPARING', label: 'Chuẩn bị hàng' },
  { key: 'SHIPPING', label: 'Đang giao' },
  { key: 'DELIVERED', label: 'Đã giao' },
  { key: 'CANCELLATION_REQUESTED', label: 'Yêu cầu hủy' },
  { key: 'CANCELLED', label: 'Đã hủy' }
];

const NEXT_ACTIONS = {
  NEW: [{ status: 'CONFIRMED', label: 'Xác nhận đơn' }, { status: 'CANCELLED', label: 'Hủy đơn', danger: true }],
  CONFIRMED: [{ status: 'PREPARING', label: 'Chuẩn bị hàng' }, { status: 'CANCELLED', label: 'Hủy đơn', danger: true }],
  PREPARING: [{ status: 'SHIPPING', label: 'Giao hàng' }],
  SHIPPING: [{ status: 'DELIVERED', label: 'Hoàn tất' }],
  CANCELLATION_REQUESTED: [{ status: 'CANCELLED', label: 'Duyệt hủy', danger: true }, { status: 'PREPARING', label: 'Từ chối hủy' }]
};

const STATUS_LABELS = {
  NEW: 'Đơn mới',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  CANCELLATION_REQUESTED: 'Yêu cầu hủy'
};

const STATUS_COLORS = {
  NEW: 'blue',
  CONFIRMED: 'cyan',
  PREPARING: 'orange',
  SHIPPING: 'purple',
  DELIVERED: 'green',
  CANCELLED: 'red',
  CANCELLATION_REQUESTED: 'volcano'
};

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString('vi-VN') + ' đ';
};

const renderStatus = (status) => {
  return <Tag color={STATUS_COLORS[status] || 'default'}>{STATUS_LABELS[status] || status}</Tag>;
};

const AdminPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [updatingId, setUpdatingId] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await getAdminOrdersAPI();
      if (res?.status >= 400) {
        message.error(res?.message || 'Không thể tải danh sách đơn hàng.');
        setOrders([]);
        return;
      }
      setOrders(Array.isArray(res?.orders) ? res.orders : []);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeStatus === 'ALL') return orders;
    return orders.filter((order) => order.status === activeStatus);
  }, [orders, activeStatus]);

  const stats = useMemo(() => {
    return STATUS_OPTIONS.slice(1).map((status) => ({
      ...status,
      count: orders.filter((order) => order.status === status.key).length
    }));
  }, [orders]);

  const handleUpdateStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      const res = await updateOrderStatusAPI(orderId, status);
      if (res?.status >= 400 || !res?.order) {
        message.error(res?.message || 'Không thể cập nhật trạng thái đơn hàng.');
        return;
      }
      message.success(res?.message || 'Đã cập nhật trạng thái đơn hàng.');
      setOrders((prev) => prev.map((order) => (order.id === orderId ? res.order : order)));
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng.');
    } finally {
      setUpdatingId('');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-ink">Đang tải danh sách đơn hàng...</div>;
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-surface p-6 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Admin</p>
            <h1 className="mt-2 text-3xl font-bold text-ink">Quản lý đơn hàng</h1>
            <p className="mt-2 text-sm text-inkLight">
              Theo dõi đơn hàng của user, xác nhận, chuẩn bị, giao hàng và xử lý yêu cầu hủy.
            </p>
          </div>
          <button
            type="button"
            onClick={loadOrders}
            className="rounded-md border border-stone-200 px-4 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
          >
            Làm mới
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <button
              type="button"
              key={item.key}
              onClick={() => setActiveStatus(item.key)}
              className={`rounded-lg border p-4 text-left shadow-sm transition ${
                activeStatus === item.key
                  ? 'border-primary bg-primarySoft'
                  : 'border-stone-200 bg-surface hover:border-primary/50'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-inkLight">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-ink">{item.count}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 bg-surface p-4 shadow-sm">
          <span className="text-sm font-semibold text-ink">Lọc trạng thái</span>
          <Select
            value={activeStatus}
            onChange={setActiveStatus}
            options={STATUS_OPTIONS.map((item) => ({ value: item.key, label: item.label }))}
            className="min-w-[220px]"
          />
          <span className="text-sm text-inkLight">{filteredOrders.length} đơn hàng</span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-surface p-12 text-center text-inkLight shadow-sm">
            Không có đơn hàng phù hợp.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const actions = NEXT_ACTIONS[order.status] || [];
              const customerName = order.user?.name || order.user?.email || 'Khách hàng';

              return (
                <article key={order.id} className="rounded-lg border border-stone-200 bg-surface p-5 shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-ink">Đơn #{order.id}</h2>
                        {renderStatus(order.status)}
                      </div>
                      <p className="mt-1 text-sm text-inkLight">
                        {customerName} | {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <Popconfirm
                          key={action.status}
                          title="Cập nhật đơn hàng"
                          description={`Chuyển đơn sang trạng thái "${STATUS_LABELS[action.status]}"?`}
                          onConfirm={() => handleUpdateStatus(order.id, action.status)}
                          okText="Xác nhận"
                          cancelText="Hủy"
                          okButtonProps={{ danger: action.danger }}
                        >
                          <button
                            type="button"
                            disabled={updatingId === order.id}
                            className={`rounded-md px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              action.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-amber-700'
                            }`}
                          >
                            {action.label}
                          </button>
                        </Popconfirm>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-5 py-4 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-3">
                      {order.items?.map((item) => (
                        <div key={item.id || item.product?.id} className="flex items-center justify-between gap-4 rounded-md bg-primarySoft/40 p-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <img
                              src={item.product?.imageUrls?.[0] || 'https://placehold.co/80x80?text=No+Image'}
                              alt={item.product?.name || 'Sản phẩm'}
                              className="h-14 w-14 rounded-md border border-stone-200 object-cover"
                            />
                            <div className="min-w-0">
                              <p className="line-clamp-1 font-semibold text-ink">{item.product?.name || 'Sản phẩm'}</p>
                              <p className="text-xs text-inkLight">Số lượng: {item.quantity}</p>
                            </div>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-primary">{formatCurrency(item.unitPrice)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-md border border-stone-200 bg-white p-4 text-sm">
                      <p className="font-semibold text-ink">Thông tin giao hàng</p>
                      <p className="mt-2 text-inkLight">SĐT: {order.phone}</p>
                      <p className="mt-1 text-inkLight">Địa chỉ: {order.shippingAddress}</p>
                      <div className="mt-4 border-t border-stone-200 pt-4">
                        <div className="flex justify-between text-inkLight">
                          <span>Phương thức</span>
                          <span className="font-semibold text-ink">{order.paymentMethod}</span>
                        </div>
                        <div className="mt-2 flex justify-between text-lg font-bold text-primary">
                          <span>Tổng</span>
                          <span>{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;

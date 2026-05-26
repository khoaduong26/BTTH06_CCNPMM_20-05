import axios from './axios.customize';

export const checkoutCodAPI = async (data) => {
    return await axios.post('/api/order/checkout/cod', data);
};
export const getUserOrdersAPI = async () => {
    return await axios.get('/api/order/history');
};

export const cancelOrderAPI = async (orderId) => {
    return await axios.post(`/api/order/cancel/${orderId}`);
};
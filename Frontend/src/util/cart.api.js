
import axios from './axios.customize';

export const getCartAPI = () => {
    return axios.get('/api/cart');
}

export const addToCartAPI = (productId, quantity = 1) => {
    return axios.post('/api/cart/add', { productId, quantity });
}

export const updateCartItemAPI = (productId, quantity) => {
    return axios.put('/api/cart/update', { productId, quantity });
}

export const removeCartItemAPI = (productId) => {
    return axios.delete(`/api/cart/remove/${productId}`);
}
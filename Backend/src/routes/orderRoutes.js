const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/checkout/cod', authenticateToken, orderController.checkoutCOD);
router.get('/history', authenticateToken, orderController.getUserOrders);
router.post('/cancel/:orderId', authenticateToken, orderController.cancelOrder);

module.exports = router;
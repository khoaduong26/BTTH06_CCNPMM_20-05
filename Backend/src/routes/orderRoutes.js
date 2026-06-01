const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.post('/checkout/cod', authenticateToken, orderController.checkoutCOD);
router.get('/history', authenticateToken, orderController.getUserOrders);
router.post('/cancel/:orderId', authenticateToken, orderController.cancelOrder);
router.get('/admin/orders', authenticateToken, authorizeRoles('ADMIN'), orderController.getAdminOrders);
router.patch('/admin/orders/:orderId/status', authenticateToken, authorizeRoles('ADMIN'), orderController.updateOrderStatus);

module.exports = router;

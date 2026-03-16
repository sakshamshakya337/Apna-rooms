const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);

module.exports = router;

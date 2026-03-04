const express = require('express');
const router = express.Router();
const { recordPayment, getGroupPayments, getCycleSummary, deletePayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { validate, recordPaymentSchema } = require('../middleware/validation');

router.post('/', protect, validate(recordPaymentSchema), recordPayment);
router.get('/group/:groupId', protect, getGroupPayments);
router.get('/group/:groupId/cycle/:cycle', protect, getCycleSummary);
router.delete('/:id', protect, deletePayment);

module.exports = router;

const router = require('express').Router();
const paymentController = require('../controllers/recieve_payment_controller');
const transactionController = require('../controllers/transacton_verification');


router.post("/payment", paymentController.recievePyment);

router.post("/webhook", paymentController.webhooks);

router.post("/delivery-payout", paymentController.initiatePayout);

router.post("/verify-payment", transactionController.verifyTransaction);





module.exports = router; 
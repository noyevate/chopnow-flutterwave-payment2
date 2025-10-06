const router = require('express').Router();
const paymentController = require('../controllers/recieve_payment_controller');


router.post("/payment", paymentController.recievePyment);

router.post("/webhook", paymentController.webhooks);

router.post("/delivery-payout", paymentController.initiatePayout);




module.exports = router; 
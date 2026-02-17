const axios = require('axios');
require('dotenv').config();
const logger = require('../services/looger')

const generateTxRef = () => {
    const prefix = 'chopnow-customer-order-payment'; 
    const timestamp = Date.now(); 
    const randomString = Math.random().toString(36).substring(2, 8); 
  
    return `${prefix}-${timestamp}-${randomString}`;
};

const generatedeliveryTxRef = () => {
    const prefix = 'chopnow-delivery-payment'; 
    const timestamp = Date.now(); 
    const randomString = Math.random().toString(36).substring(2, 8); 
  
    return `${prefix}-${timestamp}-${randomString}`;
};

// async function recievePyment (req, res) {
//   console.log("Starting...")
//     const { amount, email, currency } = req.body;

//   try {
//     const tx_ref = generateTxRef(); // Generate a unique transaction reference

//     const response = await axios.post('https://api.flutterwave.com/v3/payments', {
//       tx_ref,
//       amount,
//       currency,
//       redirect_url: "https://https://nobsafrica.webflow.io",
//       payment_type: "card",
//       customer: {
//         email,
//       },
//       customizations: {
//         title: "Payment for services",
//         description: "Payment for services rendered",
//       }
//     }, {
//       headers: {
//         Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
//       }
//     });
//     console.log(response)
//     logger.info(`payment made`, response.data['id']),
//     res.status(200).send(response.data);
//     console.log("end...")
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//     console.log("end...")
//   }
// } 


async function recievePyment(req, res) {
  const { amount, email } = req.body;

  try {
    const tx_ref = generateTxRef();

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // Paystack uses kobo
        reference: tx_ref,
        callback_url: "https://nobsafrica.webflow.io"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    logger.info("payment initialized", response.data.data.reference);
    return res.status(200).json(response.data.data);

  } catch (error) {
    logger.error("payment init failed", error);
    return res.status(500).json({ error: error.message });
  }
}


async function payment_callback (req, res) {

  if (req.query.status === 'successful') {
      const transactionDetails = await Transaction.find({ref: req.query.tx_ref});
      const response = await flw.Transaction.verify({id: req.query.transaction_id});
      if (
          response.data.status === "successful"
          && response.data.amount === transactionDetails.amount
          && response.data.currency === "NGN") {
          // Success! Confirm the customer's payment
      } else {
          // Inform the customer their payment was unsuccessful
      }
  }
}



// async function webhooks(req, res) {
//   const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
//   const signature = req.headers['verif-hash'];

//   if (!signature || signature !== secretHash) {
//     return res.status(401).send('Unauthorized');
//   }

//   const event = req.body;
//   console.log('Webhook event received:', event);
//   console.log('Raw Webhook Event:', JSON.stringify(event, null, 2));

//   if (event['event.type'] === 'CARD_TRANSACTION' && event.status === 'successful') {
//     console.log('Payment successful, triggering payout...');

//     // 20% of the delivery amount goes to the logistics company
//     const payoutAmount = event.amount * 0.20;
//     await initiatePayout(payoutAmount, `Delivery for Transaction Ref: ${event.tx_ref}`);
//   } else {
//     console.log('Payment failed or incomplete:', event);
//   }

//   res.status(200).send('Webhook received successfully');
// }

const crypto = require("crypto");

async function webhooks(req, res) {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  if (event.event === "charge.success") {
    console.log("Payment successful:", event.data.reference);

    const payoutAmount = event.data.amount / 100 * 0.2;
    // trigger payout flow here
  }

  res.sendStatus(200);
}




// async function initiatePayout(req, res) {
//   console.log("calling the payout function...");

//   const { account_bank, account_number, amount, narration, full_name } = req.body;

//   try {
//     const response = await axios.post(
//       "https://api.flutterwave.com/v3/transfers",
//       {
//         account_bank,
//         account_number,
//         amount,
//         narration: narration || "Payout for delivery",
//         currency: "NGN",
//         reference: generatedeliveryTxRef(),
//         debit_currency: "NGN",
//         full_name: full_name || ""
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("Payout initiated:", response.data);
//     logger.info(`payout queued`, response.data['id'])
//     return res.status(200).json(response.data);
//   } catch (error) {
//     if (error.response) {
//       logger.error("payout failed", error)
//       console.error("Payout failed:", error.response.data);
//       return res.status(400).json(error.response.data);
//     } else {
//       console.error("Payout failed:", error.message);
//       return res.status(500).json({ message: error.message });
//     }
//   }
// }


async function initiatePayout(req, res) {
  const { account_number, bank_code, amount, name } = req.body;

  try {
    const recipient = await createRecipient(account_number, bank_code, name);

    const response = await axios.post(
      "https://api.paystack.co/transfer",
      {
        source: "balance",
        amount: amount * 100,
        recipient,
        reason: "Delivery payout"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    logger.info("payout initiated", response.data.data.reference);
    return res.status(200).json(response.data);

  } catch (error) {
    logger.error("payout failed", error);
    return res.status(500).json({ error: error.message });
  }
}


async function createRecipient(account_number, bank_code, name) {
  const response = await axios.post(
    "https://api.paystack.co/transferrecipient",
    {
      type: "nuban",
      name,
      account_number,
      bank_code,
      currency: "NGN"
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    }
  );

  return response.data.data.recipient_code;
}





module.exports = {recievePyment, payment_callback, webhooks, createRecipient, initiatePayout};
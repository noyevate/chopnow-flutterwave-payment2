const axios = require("axios");
const logger = require("../services/looger");

async function verifyTransaction(req, res) {
  try {
    const { reference, expectedAmount } = req.body;

    if (!reference) {
      return res.status(400).json({
        status: false,
        message: "Transaction reference is required"
      });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const data = response.data.data;

    // ✅ Validate transaction
    if (
      data.status === "success" &&
      data.currency === "NGN" &&
      (!expectedAmount || data.amount === expectedAmount * 100)
    ) {
      logger.info("Transaction verified", reference);

      return res.status(200).json({
        status: true,
        message: "Transaction verified successfully",
        data
      });
    }

    logger.warn("Transaction verification failed", reference);

    return res.status(400).json({
      status: false,
      message: "Transaction not valid",
      data
    });

  } catch (error) {
    logger.error("Verification error", error);

    return res.status(500).json({
      status: false,
      message: "Verification failed",
      error: error.message
    });
  }
}

module.exports = { verifyTransaction };

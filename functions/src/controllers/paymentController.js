const stripeUtils = require('../utils/stripeUtils');

// Function to create a payment intent
const createPaymentIntent = async (req, res) => {
  const { amount } = req.body; // Amount is passed in the request body

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero.' });
  }

  try {
    const paymentIntent = await stripeUtils.createPaymentIntent(amount);

    // Send the client secret to the frontend
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent.' });
  }
};

module.exports = {
  createPaymentIntent,
};

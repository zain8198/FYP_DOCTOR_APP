// Firebase Functions (Cloud Function)
const functions = require("firebase-functions");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Secret key

exports.createPaymentIntent = functions.https.onRequest(async (req, res) => {
  try {
    const { amount } = req.body; // amount passed from client side

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,  // amount should be in cents, for example 1000 = $10.00
      currency: "usd",
      description: "Appointment Payment",
    });

    // Send client secret to client-side
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).send("Server Error");
  }
});

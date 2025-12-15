const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const paymentController = require('./src/controllers/paymentController');

const app = express();

// Enable CORS
app.use(cors({ origin: true }));

// Add route for creating payment intent
app.post('/create-payment-intent', paymentController.createPaymentIntent);

exports.api = functions.https.onRequest(app);

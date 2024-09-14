// File: qr-code-payment.js

// Required libraries
const express = require('express');
const qrcode = require('qrcode');
const Razorpay = require('razorpay');

const app = express();
const port = 3000;

// Razorpay initialization
const razorpay = new Razorpay({
  key_id: 'YOUR_RAZORPAY_KEY_ID',
  key_secret: 'YOUR_RAZORPAY_KEY_SECRET'
});

app.use(express.json());
app.use(express.static('public'));

// Generate QR code for payment
app.get('/generate-qr', async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: 50000, // Amount in paise (e.g., 500.00 INR)
      currency: 'INR',
      receipt: 'order_receipt_' + Date.now(),
      payment_capture: 1
    });

    const paymentLink = `https://your-domain.com/pay?order_id=${order.id}`;
    const qrCode = await qrcode.toDataURL(paymentLink);

    res.json({ qrCode, orderId: order.id });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Handle payment
app.post('/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', 'YOUR_RAZORPAY_KEY_SECRET')
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    res.json({ success: true, message: 'Payment verified successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid signature' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
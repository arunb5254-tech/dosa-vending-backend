const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   RAZORPAY CONFIG
========================= */

const razorpay = new Razorpay({
  key_id: "rzp_test_SGW9dU8nTUa71m",
  key_secret: "cOpxtgFaFxuIDTAdBzZVjzNo"
});

/* =========================
   ORDER STORAGE
========================= */

let orders = {};

/* =========================
   CREATE ORDER
========================= */

app.post("/create-order", async (req, res) => {

  try {

    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "dosa_order"
    });

    const paymentLink = await razorpay.paymentLink.create({

      amount: amount * 100,
      currency: "INR",
      description: "Smart Dosa Machine",

      reference_id: order.id,

      notify: {
        sms: false,
        email: false
      }

    });

    orders[order.id] = "pending";

    res.json({
      order_id: order.id,
      qr: paymentLink.short_url
    });

  } catch (error) {

    console.log(error);
    res.status(500).send("Order failed");

  }

});

/* =========================
   PAYMENT STATUS
========================= */

app.post("/payment-status", (req, res) => {

  const { order_id } = req.body;

  const status = orders[order_id] || "pending";

  res.json({
    status: status
  });

});

/* =========================
   RAZORPAY WEBHOOK
========================= */

app.post("/webhook", async (req, res) => {

  const event = req.body.event;

  if (event === "payment_link.paid") {

    const orderId = req.body.payload.payment_link.entity.reference_id;

    console.log("Payment received:", orderId);

    orders[orderId] = "paid";

    /* Trigger ESP8266 */

    try {

      await axios.get("http://192.168.137.133/start");

      console.log("ESP8266 Triggered");

    } catch (error) {

      console.log("ESP Error:", error.message);

    }

  }

  res.sendStatus(200);

});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log("Server running on port", PORT);

});
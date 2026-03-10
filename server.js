const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: "rzp_test_SGW9dU8nTUa71m",
  key_secret: "cOpxtgFaFxuIDTAdBzZVjzNo"
});

const ESP_IP = "192.168.137.36";

let orders = {};

/* CREATE PAYMENT LINK */

app.post("/create-order", async (req, res) => {

  try {

    const amount = req.body.amount;

    const paymentLink = await razorpay.paymentLink.create({
      amount: amount * 100,
      currency: "INR",
      description: "Dosa Machine",
      notify: { sms: false, email: false }
    });

    orders[paymentLink.id] = "pending";

    res.json({
      order_id: paymentLink.id,
      qr: paymentLink.short_url
    });

  } catch (error) {

    console.log(error);
    res.status(500).send("Order error");

  }

});


/* CHECK PAYMENT */

app.post("/payment-status", (req, res) => {

  const id = req.body.order_id;

  res.json({
    status: orders[id] || "pending"
  });

});


/* WEBHOOK FROM RAZORPAY */

app.post("/webhook", async (req, res) => {

  const event = req.body.event;

  console.log("Webhook event:", event);

  if (event === "payment_link.paid") {

    const orderId = req.body.payload.payment_link.entity.id;

    console.log("Payment received:", orderId);

    orders[orderId] = "paid";

    try {

      await axios.get(`http://${ESP_IP}/start`);

      console.log("ESP triggered");

    } catch (e) {

      console.log("ESP not reachable");

    }

  }

  res.sendStatus(200);

});


app.listen(5000, () => {

  console.log("Server running");

});

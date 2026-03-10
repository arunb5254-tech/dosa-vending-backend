const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(bodyParser.json());

const razorpay = new Razorpay({
  key_id: "rzp_test_SGW9dU8nTUa71m",
  key_secret: "cOpxtgFaFxuIDTAdBzZVjzNo"
});

let payments = {};

/* CREATE ORDER */

app.post("/create-order", async (req, res) => {

  const amount = req.body.amount;

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR"
  });

  const qrLink = `upi://pay?pa=razorpay@axisbank&pn=DosaMachine&am=${amount}&cu=INR`;

  payments[order.id] = "pending";

  res.json({
    order_id: order.id,
    qr: qrLink
  });

});


/* PAYMENT STATUS */

app.post("/payment-status", async (req, res) => {

  const orderId = req.body.order_id;

  try {

    const paymentsList = await razorpay.orders.fetchPayments(orderId);

    if (paymentsList.items.length > 0) {

      const status = paymentsList.items[0].status;

      if (status === "captured") {

        payments[orderId] = "paid";

        /* TRIGGER ESP */

        try {
          await axios.get("http://192.168.137.36/start");
        } catch (err) {
          console.log("ESP not reachable");
        }

        return res.json({ status: "paid" });

      }

    }

    res.json({ status: "pending" });

  } catch (err) {

    res.json({ status: "pending" });

  }

});


app.listen(5000, () => {
  console.log("Server running on port 5000");
});

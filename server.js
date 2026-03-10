const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* Razorpay Keys */

const razorpay = new Razorpay({
  key_id: "rzp_test_SGW9dU8nTUa71m",
  key_secret: "cOpxtgFaFxuIDTAdBzZVjzNo"
});

/* Order Storage */

let orders = {};

/* Machine State */

let machineStatus = "idle";

/* CREATE PAYMENT LINK */

app.post("/create-order", async (req, res) => {

  try {

    const amount = req.body.amount;

    const paymentLink = await razorpay.paymentLink.create({

      amount: amount * 100,
      currency: "INR",
      description: "Smart Dosa Machine",

      notify: {
        sms: false,
        email: false
      }

    });

    orders[paymentLink.id] = "pending";

    res.json({
      order_id: paymentLink.id,
      qr: paymentLink.short_url
    });

  } catch (err) {

    console.log(err);
    res.status(500).send("Payment link error");

  }

});


/* FLUTTER CHECK PAYMENT */

app.post("/payment-status", (req, res) => {

  const id = req.body.order_id;

  res.json({
    status: orders[id] || "pending"
  });

});


/* RAZORPAY WEBHOOK */

app.post("/webhook", (req, res) => {

  const event = req.body.event;

  console.log("Webhook event:", event);

  if (event === "payment_link.paid") {

    const orderId =
      req.body.payload.payment_link.entity.id;

    console.log("Payment received:", orderId);

    orders[orderId] = "paid";

    /* trigger machine */

    machineStatus = "cook";

  }

  res.sendStatus(200);

});


/* ESP CHECK MACHINE */

app.get("/machine-status", (req, res) => {

  if (machineStatus === "cook") {

    machineStatus = "idle";

    res.send("cook");

  } else {

    res.send("idle");

  }

});


app.listen(5000, () => {

  console.log("Server running on port 5000");

});

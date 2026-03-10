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

/* CREATE PAYMENT LINK */

app.post("/create-order", async (req, res) => {

  try {

    const amount = req.body.amount;

    const paymentLink = await razorpay.paymentLink.create({

      amount: amount * 100,
      currency: "INR",
      accept_partial: false,
      description: "Smart Dosa Machine",
      customer: {
        name: "Customer"
      },
      notify: {
        sms: false,
        email: false
      }

    });

    res.json({
      qr: paymentLink.short_url
    });

  } catch (error) {

    console.log(error);

    res.status(500).send("Error creating payment link");

  }

});


/* WEBHOOK FOR PAYMENT SUCCESS */

app.post("/payment-success", async (req, res) => {

  console.log("Payment received");

  try {

    await axios.get(`http://${ESP_IP}/start`);

  } catch (e) {

    console.log("ESP not reachable");

  }

  res.send("Machine started");

});


app.listen(5000, () => {

  console.log("Server running");

});

// module imports
import express from "express";

// file imports
import admins from "./admins.js";
import auth from "./auth.js";
import messages from "./messages.js";
import users from "./users.js";
import paymentAccounts from "./payment-accounts.js"
import orders from "./orders.js";
import launderer from "./launderer.js";
import customer from "./customer.js";

// import customer from "./customer.js"
// import order from "./order.js";

// variable initializations
const router = express.Router();

router.use("/admins", admins);
router.use("/auth", auth);
router.use("/messages", messages);
router.use("/users", users);
router.use("/payments", paymentAccounts);
router.use("/orders", orders);
router.use("/launderer", launderer)
router.use("/customer", customer)
// router.use("paymentAccounts", paymentAccounts)

router.use("/docs", (req, res, next) =>
  res.redirect("https://documenter.getpostman.com/view/14185057/UVkqruXK")
);

export default router;

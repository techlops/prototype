import express from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import { verifyToken } from "../middlewares/authenticator.js";
import * as paymentAccountsController from "../controllers/payment-accounts.js";

const router = express.Router();


router.post(
  "/addPaymentMethod",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user; 
    const {account} = req.body;
    const args = {account, user};
    const response = await paymentAccountsController.addPaymentAccount(args);
    res.json(response);
  })
);

// router.post(
//   "/addPaymentMethod",
//   verifyToken,
//   asyncHandler(async (req, res) => {
//     const{user} = req.user;
//     const {account} = req.body;
//     const args = {account, user};
//     const response = await paymentAccountsController.addPaymentAccount(args);
//     res.json(response);
//   })
// );



// 1. add payment account in account table using own jwt.
// 2. 
// 
// 

export default router;
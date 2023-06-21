import express from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import * as authController from "../controllers/auth.js";

const router = express.Router();

router.post(
  "/registerUser",
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, phone } = req.body;
    const args = {
      email,
      password,
      firstName,
      lastName,
      phone,
    };
    const response = await authController.registerUser(args);
    res.json(response);
  })
);

router.post(
  "/registerLaunderer",
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, phone, location } = req.body;
    const args = {
      email,
      password,
      firstName,
      lastName,
      phone,
      location,
    };
    const response = await authController.registerLaunderer(args);
    res.json(response);
  })
);

router.post(
  "/verifyOTP",
  asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const { user } = req.query;
    const args = {user, otp};
    const response = await authController.verifyOTP(args);
    res.json(response);
  })
);

router.put(
  "/sendAgainOTP",
  asyncHandler(async (req, res) => {
    const { user } = req.body;
    const args = {user};
    const response = await authController.sendAgainOTP(args);
    res.json(response);
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const args = {
      email,
      password,
    };
    const response = await authController.login(args);
    res.json(response);
  })
);

export default router;

import express from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import * as authController from "../controllers/auth.js";
import directories from "../configs/directories.js";
import { upload } from "../middlewares/uploader.js";

const { IMAGES_DIRECTORY } = directories;

const router = express.Router();


router.post(
  "/registerUser",
  upload(IMAGES_DIRECTORY).single("image"),
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, phone, phoneCode, coordinates } = req.body;

    // Get the uploaded image path
    const imagePath = req.file ? req.file.path : null;

    const args = {
      email,
      password,
      firstName,
      lastName,
      phone,
      phoneCode,
      image: imagePath, // Assign the image path to the "image" field
      coordinates

    };

    const response = await authController.registerUser(args);
    res.json(response);
  })
);

router.post(
  "/registerLaunderer",
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, phone, phoneCode, coordinates } = req.body;

    // Get the uploaded image path
    const imagePath = req.file ? req.file.path : null;

    const args = {
      email,
      password,
      firstName,
      lastName,
      phone,
      phoneCode,
      image: imagePath, // Assign the image path to the "image" field
      coordinates

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

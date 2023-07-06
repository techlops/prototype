import express from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import * as authController from "../controllers/auth.js";
import directories from "../configs/directories.js";
import { upload } from "../middlewares/uploader.js";
import { verifyToken } from "../middlewares/authenticator.js";

const { IMAGES_DIRECTORY } = directories;

const router = express.Router();

router.post(
  "/request-order",
  verifyToken,
  upload(IMAGES_DIRECTORY).single("image"),
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { totalAmount } = req.body;

    console.log("totalAmount : ", totalAmount);
  })
);

router.post(
  "/request-order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { totalAmount } = req.body;

    console.log("totalAmount : ", totalAmount);
  })
);


export default router;
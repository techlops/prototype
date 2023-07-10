import express from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import * as ordersController from "../controllers/order.js";
import { upload } from "../middlewares/uploader.js";
import directories from "../configs/directories.js";
import path from "path";
import { verifyToken } from "../middlewares/authenticator.js";

const { IMAGES_DIRECTORY } = directories;

// const { ATTACHMENTS_DIRECTORY } = directories;

const router = express.Router();

// Request order service
router.post(
  "/request-order",
  verifyToken,
  upload(IMAGES_DIRECTORY).any(),
  asyncHandler(async (req, res) => {
    const user = req.user;

    const {
      bags,
      totalAmount,
      coordinates,
      lflBagsCount,
      deliveryFee,
      zip,
      address,
      city,
      state,
      country,
    } = req.body;

    // Prepare an array to store the bag images
    const bagImages = [];

    // Iterate over the bags and retrieve the corresponding images
    bags.forEach((bag, index) => {
      const bagImagesField = `bags[${index}][images]`;
      const bagImagesFiles = req.files.filter(
        (file) => file.fieldname === bagImagesField
      );
      const bagImagePaths = bagImagesFiles.map((file) =>
        path.basename(file.path)
      );
      bagImages.push(bagImagePaths);
    });

    console.log("bags : ", bags);
    console.log("bagImages : ", bagImages);

    const args = {
      bags,
      totalAmount,
      coordinates,
      lflBagsCount,
      deliveryFee,
      user,
      zip,
      address,
      city,
      state,
      country,
      bagImages,
    };
    const response = await ordersController.requestServiceOrder(args);
    res.json(response);
  })
);

// View nearby order requests
router.get(
  "/nearby-orders",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    console.log("req.user : ", user);
    const args = { user };

    const response = await ordersController.nearbyPendingOrderRequests(args);
    res.json(response);
  })
);

// Accept order request
router.patch(
  "/accept-order/:order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;
    const { accept } = req.query;

    const args = { user, order, accept };

    const response = await ordersController.laundererOrderRequestAccept(args);

    res.json(response);
  })
);

// Decline order request
router.post(
  "/decline-order/:order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;
    const { accept } = req.query;

    const args = { user, order, accept };

    const response = await ordersController.laundererOrderRequestDecline(args);

    res.json(response);
  })
);

// Upload images before starting work
router.post(
  "/images-before-work/:order",
  verifyToken,
  upload(IMAGES_DIRECTORY).any(),
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;
    const images = req.files.map((file) => path.basename(file.path));

    const args = { user, order, images };

    console.log("images : ", images)

    const response = await ordersController.beforeWorkPictures(args);

    res.json(response);
  })
);

router.post(
  "/images-before-workss/:order",
  verifyToken,
  upload(IMAGES_DIRECTORY).any("images[]"),
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;
    const { images } = req.files;

    console.log("req.files: ", req.files);

    // if (!images) {
    //   return res.status(400).json({ error: "No images uploaded" });
    // }

    // Extract the file paths from the uploaded images
    const imagePaths = images.map((file) => file.path);

    console.log("imagePaths: ", imagePaths);

    const response = await ordersController.beforeWorkPictures(
      order,
      imagePaths
    );
    res.json(response);
  })
);

export default router;

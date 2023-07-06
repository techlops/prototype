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

router.post(
  "/request-orderwq",
  verifyToken,
  upload(IMAGES_DIRECTORY).fields([{ name: "bags[0][images]", maxCount: 5 }]),
  asyncHandler(async (req, res) => {
    const user = req.user;

    // const imagePath = req.file ? req.file.path : null;

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

    console.log("totalAmount : ",totalAmount)
    const args = { bags, totalAmount, coordinates, lflBagsCount, deliveryFee, user, zip, address, city, state, country };
    const response = await orderController.requestServiceOrder(args);
    res.json(response);
  })
);

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
      const bagImagePaths = bagImagesFiles.map((file) => path.basename(file.path))
      bagImages.push(bagImagePaths);
    });

    console.log("bags : ", bags);
    console.log("bagImages : ", bagImages);


    const args = { bags, totalAmount, coordinates, lflBagsCount, deliveryFee, user, zip, address, city, state, country, bagImages };
    const response = await ordersController.requestServiceOrder(args);
    res.json(response);
  })
);


router.get(
  "/nearby-orders",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user  = req.user;
    console.log("req.user : ", user)
    const args = { user };

    const response = await ordersController.nearbyPendingOrderRequests(args);
    res.json(response);
  })
);

export default router;

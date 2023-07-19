import express from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import * as ordersController from "../controllers/order.js";
import { upload } from "../middlewares/uploader.js";
import directories from "../configs/directories.js";
import path from "path";
import { verifyToken, verifyUser } from "../middlewares/authenticator.js";

const { IMAGES_DIRECTORY } = directories;

// const { ATTACHMENTS_DIRECTORY } = directories;

const router = express.Router();

// CUSTOMER

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
      time
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
      time
    };
    const response = await ordersController.requestServiceOrder(args);
    res.json(response);
  })
);

// feedback submit
router.patch(
  "/submit-work/:order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;

    const args = { user, order };

    const response = await ordersController.feedbackSubmit(args);

    res.json(response);
  })
);

// get order logs (track order)

// get order details

// cancel order

// report order

// add new locations

// edit existing locations

// update cus

// 


// LAUNDERER



// View nearby order requests
router.get(
  "/nearby-orders",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    console.log("req.user : ", user);
    const args = { user };
    console.log("HXXXXXXXXXXXXXXXXXKXKXKXKXKXKXKXKXKXKXKX ------------------")

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

// start service
router.patch(
  "/start-service-order/:order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;

    const args = { user, order };

    const response = await ordersController.startService(args);

    res.json(response);
  })
)

// coming for picking up order
router.patch(
  "/coming-for-pickup/:order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;

    const args = { user, order };

    const response = await ordersController.laundererOnWay(args);

    res.json(response);
  })
);

// launderer reached location
router.patch(
  "/reached-location/:order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;

    const args = { user, order };

    const response = await ordersController.laundererReachedLocation(args);

    res.json(response);
  })
);

// Upload images before starting work and select pick up location type
router.patch(
  "/pickup-location-select/:order",
  verifyToken,
  upload(IMAGES_DIRECTORY).any(),
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params; 
    const { pickUpType } = req.query;
    const images = req.files.map((file) => path.basename(file.path));

    const args = { user, order, images, pickUpType };

    console.log("images : ", images)

    const response = await ordersController.pickupLocationSelect(args);

    res.json(response);
  })
);

// clothes in dryer
router.patch(
  "/clothes-in-dryer/:order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;

    const args = { user, order };

    const response = await ordersController.clothesInDryer(args);

    res.json(response);
  })
);

// clothes folding
router.patch(
  "/clothes-fold/:order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;

    const args = { user, order };

    const response = await ordersController.clothesFolding(args);

    res.json(response);
  })
);

// clothes delivery
router.patch(
  "/deliver-clothes/:order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;

    const args = { user, order };

    const response = await ordersController.clothesDelivery(args);

    res.json(response);
  })
);

// submit work
router.patch(
  "/submit-work/:order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;
    const {feedback} = req.body;

    const args = { user, order };

    const response = await ordersController.submitWork(args);

    res.json(response);
  })
);

// order count per days of month for calender
router.get(
  "/order-count-per-days-of-month",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { month, year } = req.query;
    const args = {month, year, user}

    const response = await ordersController.orderCountPerDay(args);
    res.json(response);
  })
);

// orders by single day
router.get(
  "/orders-by-single-day",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { day, month, year, page, limit } = req.query;
    const args = {day, month, year, user, page, limit}

    const response = await ordersController.ordersByDay(args);
    res.json(response);
  })
);

// list of in progress orders
router.get(
  "/in-progress-orders",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const{page, limit} = req.query;
    const args = { user, page, limit }

    const response = await ordersController.inProgressOrders(args);
    res.json(response);
  })
);

// list of upcoming orders
router.get(
  "/upcoming-orders",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const{page, limit} = req.query;
    const args = { user, page, limit }

    const response = await ordersController.upcomingOrders(args);
    res.json(response);
  })
);

// list of completed orders
router.get(
  "/completed-orders",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const{page, limit} = req.query;
    const args = { user, page, limit }

    const response = await ordersController.completedOrders(args);
    res.json(response);
  })
);


// update launderer location on map when order service started and when coming for delivery

// launderer profile of total orders and total earnings

// list of launderer reviews

// list of canceled orders

// list of declined orders

export default router;

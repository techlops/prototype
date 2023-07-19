import express from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import * as laundererController from "../controllers/launderer.js";
import { upload } from "../middlewares/uploader.js";
import directories from "../configs/directories.js";
import path from "path";
import { verifyToken, verifyUser } from "../middlewares/authenticator.js";

const { IMAGES_DIRECTORY } = directories;

const router = express.Router();

// LAUNDERER


// 1. update launderer location on map when order service started and when coming for delivery

// 2. list of launderer reviews

// 3. launderer online / offline switch



// View nearby order requests
router.get(
  "/nearby-orders",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    console.log("req.user : ", user);
    const args = { user };

    const response = await laundererController.nearbyPendingOrderRequests(args);
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
    console.log("in launderer routes so we're good ----------------------------")
    const args = { user, order, accept };

    const response = await laundererController.laundererOrderRequestAccept(
      args
    );

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

    const response = await laundererController.laundererOrderRequestDecline(
      args
    );

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

    const response = await laundererController.startService(args);

    res.json(response);
  })
);

// coming for picking up order
router.patch(
  "/coming-for-pickup/:order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;

    const args = { user, order };

    const response = await laundererController.laundererOnWay(args);

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

    const response = await laundererController.laundererReachedLocation(args);

    res.json(response);
  })
);

// Upload images before starting work and select pick up location type
router.patch(
  "/select-pickup-location/:order",
  verifyToken,
  upload(IMAGES_DIRECTORY).any(),
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;
    const { pickUpType } = req.query;

    const images = req.files ? req.files.map((file) => path.basename(file.path)) : [];
    const { feedback } = req.body;

    const args = { user, order, images, pickUpType };

    const response = await laundererController.pickupLocationSelect(args);

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

    const response = await laundererController.clothesInDryer(args);

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

    const response = await laundererController.clothesFolding(args);

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

    const response = await laundererController.clothesDelivery(args);

    res.json(response);
  })
);

// submit work
router.patch(
  "/submit-work/:order",
  verifyToken,
  upload(IMAGES_DIRECTORY).any(),
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { dropOffType } = req.query;
    const { order } = req.params;

    const images = req.files ? req.files.map((file) => path.basename(file.path)) : [];
    const { feedback } = req.body;

    const args = { user, order, feedback, images, dropOffType };

    const response = await laundererController.submitWork(args);

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
    const args = { month, year, user };

    const response = await laundererController.orderCountPerDay(args);
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
    const args = { day, month, year, user, page, limit };

    const response = await laundererController.ordersByDay(args);
    res.json(response);
  })
);

// list of in progress orders
router.get(
  "/in-progress-orders",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { page, limit } = req.query;
    const args = { user, page, limit };

    const response = await laundererController.inProgressOrders(args);
    res.json(response);
  })
);

// list of upcoming orders
router.get(
  "/upcoming-orders",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { page, limit } = req.query;
    const args = { user, page, limit };

    const response = await laundererController.upcomingOrders(args);
    res.json(response);
  })
);

// list of completed orders
router.get(
  "/completed-orders",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { page, limit } = req.query;
    const args = { user, page, limit };

    const response = await laundererController.completedOrders(args);
    res.json(response);
  })
);

// order logs
router.get(
  "/order-logs/:order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;

    const args = { user, order };

    const response = await laundererController.orderLogs(args);
    res.json(response);
  })
);

// list of canceled orders
router.get(
  "/cancelled-orders",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { page, limit } = req.query;
    const args = { user, page, limit };

    const response = await laundererController.cancelledOrders(args);
    res.json(response);
  })
);

// launderer profile of total orders and total earnings
router.get(
  "/my-launderer",
  verifyToken,
  asyncHandler(async (req, res) => {
    const { user } = req.user
    const args = { user };
    const response = await laundererController.laundererDetails(args);
    res.json(response);
  })
);



export default router;

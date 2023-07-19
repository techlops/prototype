import express from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import * as customerController from "../controllers/customer.js";
import { upload } from "../middlewares/uploader.js";
import directories from "../configs/directories.js";
import path from "path";
import { verifyToken, verifyUser } from "../middlewares/authenticator.js";

const { IMAGES_DIRECTORY } = directories;

// const { ATTACHMENTS_DIRECTORY } = directories;

const router = express.Router();

// CUSTOMER

// add customer location
router.post(
  "/customer-locations/add-new-location",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;

    const { zip, address, city, state, country, coordinates } = req.body;

    const args = { user, zip, address, city, state, country, coordinates };
    const response = await customerController.addCustomerLocation(args);
    res.json(response);
  })
);

// list of current locations
router.get(
  "/customer-locations",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const args = { user};

    const response = await customerController.listCustomerLocations(args);
    res.json(response);
  })
);

// set current location
router.patch(
  "/customer-locations/:location",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { location } = req.params;
    const customerLocation = location;

    const args = { user, customerLocation };

    const response = await customerController.setCurrentLocation(args);

    res.json(response);
  })
);

// get customer location
router.get(
  "/customer-locations/:location",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { location } = req.params;
    const customerLocation = location;

    const args = { user, customerLocation };

    const response = await customerController.getCustomerLocation(args);

    res.json(response);
  })
  
);

// edit existing location
router.put(
  "/customer-locations/:location",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { location } = req.params;
    const {zip, address, city, state, country, coordinates } = req.body;
    const customerLocation = location;

    const args = { user, customerLocation, zip, address, city, state, country, coordinates };

    const response = await customerController.editCustomerLocation(args);

    res.json(response);
  })


);

// delete customer location
router.delete(
  "/customer-locations/:location",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { location } = req.params;
    const customerLocation = location;

    const args = { user, customerLocation };

    const response = await customerController.deleteCustomerLocation(args);

    res.json(response);
  })

);

// get bag sizes & price
router.get(
  "/bag-sizes",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const args = { user };

    const response = await customerController.getBagSizes(args);
    res.json(response);
  })

)

// get totalAmount before order request
router.post(
  "/total-amount",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const {bagSizes, lflBagsCount}  = req.body;
    const args = { user, bagSizes, lflBagsCount };

    const response = await customerController.calculateTotalAmount(args);
    res.json(response);
  })


);

// request order service
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
      time,
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
      time,
    };
    const response = await customerController.requestServiceOrder(args);
    res.json(response);
  })
);

// feedback submit
router.patch(
  "/submit-feedback/:order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;
    const { review, rating, tip } = req.body;

    const args = { user, order, tip, review, rating };

    const response = await customerController.feedbackSubmit(args);

    res.json(response);
  })
);

// cancel order
router.patch(
  "/cancel-order/:order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.params;

    const args = { user, order };

    const response = await customerController.cancelOrder(args);

    res.json(response);
  })
);

// track order logs
router.get(
  "/track-your-order/:order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const {order} = req.params;
    const args = { order, user }

    const response = await customerController.trackOrder(args);
    res.json(response);
  })
);

router.get(
  "/current-orders",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const args = { user }

    const response = await customerController.currentOrders(args);
    res.json(response);
  })
);

router.get(
  "/previous-orders",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const args = { user }

    const response = await customerController.previousOrders(args);
    res.json(response);
  })
)

// // report order
router.post(
  "/report-order",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.query;
    const {complain} = req.body;

    const args = { user, order, complain };

    const response = await customerController.reportOrder(args);

    res.json(response);
  })
);

// faq
router.get(
  "/faq",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const args = user

    const response = await customerController.faq(args);
    res.json(response);
  })
)

// contact us
router.post(
  "/contact-us",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { order } = req.query;
    const {text} = req.body;

    const args = { user, text };

    const response = await customerController.contactUsMessage(args);

    res.json(response);
  })
);

// faq
router.get(
  "/:constant",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const {constant} = req.params;
    const args = {user, constant}

    console.log("constant : ",constant)

    const response = await customerController.termsAndConditions(args);
    res.json(response);
  })
)


// ///////////// THESE ARE LEFT /////////////////////////////





// // order details
// router.get();


// // get launderer's current location after order status is changed to coming for pickup or coming for deliver
// router.get();



export default router;

// module imports
import express from "express";
import * as usersController from "../controllers/users.js";
import * as authController from "../controllers/auth.js";
import * as notificationsController from "../controllers/notifications.js";
import directories from "../configs/directories.js";
import { upload } from "../middlewares/uploader.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import path from "path";
import { verifyToken } from "../middlewares/authenticator.js";

// destructuring assignments
const { IMAGES_DIRECTORY } = directories;

// variable initializations
const router = express.Router();

router.get(
  "/my-profile",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const args = { user };
    console.log("req.user : ", req.user);
    const response = await usersController.myProfile(args);
    res.json(response);
  })
);

// router.post(
//   "/password-reset",
//   asyncHandler(async (req, res) => {
//     const { email } = req.body;
//     const args = { email };
//     const response = await authController.emailResetPassword(args);
//     res.json(response);
//   })
// );


router.put(
  "/edit-profile",
  verifyToken,
  upload(IMAGES_DIRECTORY).single("image"),
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { firstName, lastName, phone, phoneCode, coordinates, address } =
      req.body;

    // Get the uploaded image path
    const imagePath =
      req.file && req.file.path ? path.basename(req.file.path) : null;

    const args = {
      firstName,
      lastName,
      phone,
      phoneCode,
      image: imagePath, // Assign the image path to the "image" field
      coordinates,
      address,
      user,
    };

    const response = await usersController.editProfile(args);
    res.json(response);
  })
);

router.patch(
  "/set-online-status",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { toggle } = req.body;
    console.log("toggle : ", toggle);
    console.log("user : ", user);
    const args = { user, toggle };
    const response = await usersController.laundererToggleSwitch(args);
    res.json(response);
  })
);

// // get notifications
// router.get(
//   "/notifications",
//   verifyToken,
//   asyncHandler(async (req, res) => {
//     const  user  = req.user;
//     const args = { user };
//     console.log("req.user : ", req.user)
//     const response = await usersController.myProfile(args);
//     res.json(response);
//   })
// );

// read notitications
router
  .route("/notifications")
  .all(verifyToken)
  .get(
    asyncHandler(async (req, res) => {
      const { _id: user } = req?.user;
      const { page, limit } = req.query;
      const args = {
        user,
        limit: Number(limit),
        page: Number(page),
      };
      const response = await notificationsController.getNotifications(args);
      res.json(response);
    })
  )
  .patch(
    asyncHandler(async (req, res) => {
      const user = req.user;
      const args = { user };
      const response = await notificationsController.readNotifications(args);
      res.json(response);
    })
  );

export default router;

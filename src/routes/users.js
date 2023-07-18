// module imports
import express from "express";

// file imports
// import * as authController from "../controllers/auth.js";
// import * as notificationsController from "../controllers/notifications.js";
import * as usersController from "../controllers/users.js";
// import TwilioManager from "../utils/twilio-manager.js";
import directories from "../configs/directories.js";
// import { upload } from "../middlewares/uploader.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import {
  verifyOTP,
  verifyToken,
  verifyUser,
  verifyAdmin,
  verifyUserToken,
} from "../middlewares/authenticator.js";

// destructuring assignments
const { IMAGES_DIRECTORY } = directories;

// variable initializations
const router = express.Router();

router.get(
  "/my-profile",
  verifyToken,
  asyncHandler(async (req, res) => {
    const  user  = req.user;
    const args = { user };
    console.log("req.user : ", req.user)
    const response = await usersController.myProfile(args);
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
      const { _id: user } = req?.user;
      const args = {
        user,
      };
      const response = await notificationsController.readNotifications(args);
      res.json(response);
    })
  );


export default router;

// module imports
import express from "express";

// file imports
import * as messagesController from "../controllers/messages.js";
import { verifyToken, verifyUser } from "../middlewares/authenticator.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { upload } from "../middlewares/uploader.js";
import directories from "../configs/directories.js";

// destructuring assignments
const { ATTACHMENTS_DIRECTORY } = directories;

// variable initializations
const router = express.Router();

router.post(
  "/sendMessage",
  verifyToken,
  upload(ATTACHMENTS_DIRECTORY).array("attachments", 8),
  asyncHandler(async (req, res) => {
    const {userTo} = req.query
    const userFrom = req.user;
    const {text} = req.body;
    const attachments = req.files || [];
    const arg = {
      text,
      attachments,
      userFrom,
      userTo,
      // conversation
    };

    console.log(arg)
    const response = await messagesController.sendMessage(arg)
    res.json(response)
  })
);

router.get(
  "/conversations",
  verifyToken,
  verifyUser,
  asyncHandler(async (req, res) => {
    const { _id: user } = req?.user;
    const { limit, page, q } = req.query;
    const args = {
      user,
      limit: Number(limit),
      page: Number(page),
      q,
    };
    const response = await messagesController.getConversations(args);
    res.json(response);
  })
);

export default router;

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

// send message
router.post(
  "/send-message",
  verifyToken,
  upload(ATTACHMENTS_DIRECTORY).array("attachments", 8),
  asyncHandler(async (req, res) => {
    const userFrom = req.user;
    const { userTo } = req.body;
    const { text } = req.body;
    const attachments = req.files || [];
    const arg = {
      text,
      attachments,
      userFrom,
      userTo,
      // conversation
    };

    console.log(" userTo : ", userTo);

    const response = await messagesController.sendMessage(arg);
    res.json(response);
  })
);

// get chat
router.get(
  "/chats",
  verifyToken,
  asyncHandler(async (req, res) => {
    // const { _id: user1 } = req.user;
    const { conversation, limit, page, user: user2 } = req.query;
    const user1 = req.user;
    const args = {
      conversation,
      user1,
      user2,
      limit: Number(limit),
      page: Number(page),
    };
    const response = await messagesController.getChat(args);
    res.json(response);
  })
);

router.patch(
  "/read-message",
  verifyToken,
  asyncHandler(async (req, res) => {
    const userTo = req.user;
    const { conversation } = req.query;
    const args = { conversation, userTo };
    console.log("userTo : ", userTo)
    console.log("conversation : ", conversation)

    const response = await messagesController.readMessages(args);
    res.json(response);
  })
);

// get conversation
router.get(
  "/conversations",
  verifyToken,
  asyncHandler(async (req, res) => {
    const  user  = req.user;
    const { limit, page,} = req.query;
    console.log("user : ", user)
    const args = {
      user,
      limit: Number(limit),
      page: Number(page)
    };
    const response = await messagesController.getConversations(args);
    res.json(response);
  })
);

export default router;

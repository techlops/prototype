// module imports
import { isValidObjectId, Types } from "mongoose";
import mongoose from "mongoose";


// file imports
import SocketManager from "../utils/socket-manager.js";
import FirebaseManager from "../utils/firebase-manager.js";
import * as notificationsController from "./notifications.js";
import models from "../models/index.js";
import {
  CONVERSATION_STATUSES,
  MESSAGE_STATUSES,
  NOTIFICATION_TYPES,
} from "../configs/enums.js";

// destructuring assignments
const { usersModel, messagesModel, conversationsModel } = models;
const { PENDING, ACCEPTED, REJECTED } = CONVERSATION_STATUSES;
const { NEW_MESSAGE } = NOTIFICATION_TYPES;
const { READ } = MESSAGE_STATUSES;
const { ObjectId } = Types;

/**
 * @description Add message
 * @param {String} userFrom sender user id
 * @param {String} userTo receiver user id
 * @param {String} text message text
 * @param {[object]} attachments message attachments
 * @returns {Object} message data
 */
export const getConversations = async (params) => {
  let { user, q } = params;
  user = mongoose.Types.ObjectId(user);
  // const ObjectId = mongoose.Types.ObjectId;



  console.log(" user : ", user)
  let { limit, page } = params;
  if (!limit) limit = 10;
  if (!page) page = 0;
  if (page) page = page - 1;
  const query = {};
  if (user) query.$or = [{ userTo: user }, { userFrom: user }];
  const keyword = q ? q.toString().trim() : "";

  const conversations = await conversationsModel.aggregate([
    { $match: query },
    {
      $lookup: {
        from: "messages",
        localField: "lastMessage",
        foreignField: "_id",
        as: "lastMessage",
        pipeline: [
          {
            $project: {
              text: 1,
              userFrom: 1,
              createdAt: 1,
              "attachments.type": 1,
            },
          },
        ],
      },
    },
    {
      $unwind: { path: "$lastMessage" },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
    {
      $project: {
        user: {
          $cond: {
            if: { $eq: ["$userTo", user] },
            then: "$userFrom",
            else: "$userTo",
          },
        },
        lastMessage: 1,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
        pipeline: [
          { $match: { name: { $regex: keyword, $options: "i" } } },
          {
            $project: {
              name: 1,
              image: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: { path: "$user" },
    },
    {
      $facet: {
        totalCount: [{ $count: "totalCount" }],
        data: [{ $skip: page * limit }, { $limit: limit }],
      },
    },
    { $unwind: "$totalCount" },
    {
      $project: {
        totalCount: "$totalCount.totalCount",
        totalPages: {
          $ceil: {
            $divide: ["$totalCount.totalCount", limit],
          },
        },
        data: 1,
      },
    },
  ]);
  return {
    success: true,
    data: [],
    totalCount: 0,
    totalPages: 0,
    ...conversations[0],
  };
};

export const getChat = async (params) => {
  const { conversation } = params;

  console.log("messagessss")
  let { page, limit, user1, user2 } = params;
  if (!limit) limit = 10;
  if (!page) page = 0;
  if (page) page = page - 1;

  const query = {};
  if (conversation) {
    query.conversation = mongoose.Types.ObjectId(conversation);
  } else {
    throw new Error("Please enter conversation id!|||400");
  }

  const totalCount = await messagesModel.countDocuments(query);

  console.log("query:", query);

  const data = await messagesModel
    .find(query)
    .sort({ createdAt: -1 })
    .skip(page * limit)
    .limit(limit)
    .select({ createdAt: 0, updatedAt: 0, __v: 0 });

  const totalPages = Math.ceil(totalCount / limit);

  return {
    success: true,
    data,
    totalCount,
    totalPages,
  };
};

export const sendMessage = async (params) => {
  const { text, attachments } = params;
  let { userTo, userFrom } = params;
  userTo = ObjectId(userTo);
  userFrom = ObjectId(userFrom);

  console.log("userTo : ", userTo);
  console.log("userFrom : ", userFrom);


  let conversation;

  let checkIfConversationExists = await conversationsModel.findOne({
    $or: [
      { userTo, userFrom },
      { userTo: userFrom, userFrom: userTo },
    ],
  });
  if (checkIfConversationExists) {
    conversation = checkIfConversationExists._id;
  } else {
    const conversationObj = {};
    conversationObj.userTo = userTo;
    conversationObj.userFrom = userFrom;
    checkIfConversationExists = await conversationsModel.create(
      conversationObj
    );
    conversation = checkIfConversationExists._id;
  }

  const messageObj = {};

  if (userFrom) messageObj.userFrom = userFrom;
  if (userTo) messageObj.userTo = userTo;
  if (conversation) messageObj.conversation = conversation;
  if (text) messageObj.text = text;

  if (attachments) {
    messageObj.attachments = [];
    attachments.forEach((attachment) => {
      if (attachment.path)
        messageObj.attachments.push({
          path: attachment.filename,
          type: attachment.mimetype,
        });
    });
  }

  const message = await messagesModel.create(messageObj);

  checkIfConversationExists.lastMessage = message._id;
  checkIfConversationExists.markModified("lastMessage");
  await checkIfConversationExists.save();

  console.log("message.userTo : ", message.userTo)

  // unread messages count increment
  const updateUserMessages = await usersModel.findByIdAndUpdate(
    { _id: message.userTo },
    { $inc: { unreadMessages: 1 } },
    { new: true }
  );

  // unread messages count socket emission
  await new SocketManager().emitEvent({
    to:  message.userTo.toString(),
    event: "unreadMessages_" +  message.userTo,
    data: updateUserMessages.unreadMessages,
  });


  // live chat incoming messages socket emission
  await new SocketManager().emitEvent({
    to: message.userTo.toString(),
    event: "newMessage_" + message.conversation,
    data: message
  });

  // const userToExists = await usersModel.findById(message.userTo).select("fcms");

  // const fam = userToExists.fcms

  // console.log("fammmmmmmmmmmmmmmmm",fam)

  // const fcmArray = fam.map((item) => item.fcm);

  // console.log("fcmArrayyyyyyyyyyyyyyyyyyyyyyy",fcmArray)


  // let fcms = []

  // fcms = fcmArray;


  // const title = "titleeeeeeeeee";
  // const body = `bodyyyyyyyyyyy`;
  // const type = NEW_MESSAGE;


  // // firebase notification emission
  // await new FirebaseManager().notify({
  //   fcms,
  //   title,
  //   body,
  //   data: {
  //     type,
  //   },
  // });


  return { success: true, data: message };
};

/**
 * @description read all messages
 * @param {String} conversation message id
 * @param {String} userTo user id
 * @returns {Object} message data
 */
export const readMessages = async (params) => {
  const { conversation, userTo } = params;
  const messageObj = { status: READ };
  if (userTo);
  else throw new Error("Please enter userTo id!|||400");
  if (await usersModel.exists({ _id: userTo }));
  else throw new Error("Please enter valid userTo id!|||400");
  if (conversation);
  else throw new Error("Please enter conversation id!|||400");
  if (await conversationsModel.exists({ _id: conversation }));
  else throw new Error("Please enter valid conversation id!|||400");
  await messagesModel.updateMany({ conversation, userTo }, messageObj);
  const updatedUser = await usersModel.findByIdAndUpdate(
    userTo,
    { unreadMessages: 0 },
    { new: true }
  );
  return {
    success: true,
    message: "messages read successfully!",
  };
};

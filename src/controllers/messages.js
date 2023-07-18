// module imports
import { isValidObjectId, Types } from "mongoose";

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
  const { user } = params;
  const objectId = mongoose.Types.ObjectId(user);

  const query = {
    $or: [{ userTo: { $eq: objectId } }, { userFrom: { $eq: objectId } }],
  };

  let { limit, page } = params;
  if (!limit) limit = 10;
  if (!page) page = 0;
  if (page) page = page - 1;

  const conversations = await conversationsModel.aggregate([
    { $match: query },
    {
      $lookup: {
        from: "messages",
        localField: "lastMessage",
        foreignField: "_id",
        as: "lastMessage",
      },
    },
    {
      $unwind: "$lastMessage",
    },
    {
      $project: {
        userId: {
          $cond: [{ $ne: ["$userTo", objectId] }, "$userTo", "$userFrom"],
        },
        lastMessage: {
          text: "$lastMessage.text",
        },
      },
    },
    {
      $lookup: {
        from: "profiles",
        localField: "userId",
        foreignField: "user",
        as: "profile",
      },
    },
    {
      $unwind: "$profile",
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        name: "$profile.name",
        lastMessage: "$lastMessage.text",
      },
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
    totalCount: conversations[0].totalCount,
    totalPages: conversations[0].totalPages,
    chats: conversations[0].data.map(({ _id, userId, name, lastMessage }) => ({
      _id,
      userId,
      name,
      lastMessage,
    })),
  };
};

export const getChat = async (params) => {
  const { conversation } = params;
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


  // socket event emission
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
  return {
    success: true,
    message: "messages read successfully!",
  };
};

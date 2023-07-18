// module imports
import mongoose from "mongoose";

// file imports
import { NOTIFICATION_TYPES, NOTIFICATION_STATUSES } from "../configs/enums.js";

// destructuring assignments
const { UNREAD, READ } = NOTIFICATION_STATUSES;
const {
  NEW_MESSAGE,
  NEW_ORDER_REQUEST,
  ORDER_REQUEST_ACCEPTED,
  ORDER_STARTED,
  LAUNDERER_COMING,
  LAUNDERER_REACHED,
  PICKUP_LOCATION_SELECTED,
  CLOTHES_IN_WASHER,
  CLOTHES_IN_DRYER,
  CLOTHES_FOLDING,
  CLOTHES_DELIVERY,
  ORDER_WORK_SUBMITTED,
  ORDER_FEEDBACK_SUBMITTED,
  ORDER_TIP_LEFT,
  ORDER_CANCELLED,
} = NOTIFICATION_TYPES;

// variable initializations
const Schema = mongoose.Schema;
const model = mongoose.model;

const notificationSchema = new Schema(
  {
    step: {
      type: String,
      enum: [
        NEW_MESSAGE,
        NEW_ORDER_REQUEST,
        ORDER_REQUEST_ACCEPTED,
        ORDER_STARTED,
        LAUNDERER_COMING,
        LAUNDERER_REACHED,
        PICKUP_LOCATION_SELECTED,
        CLOTHES_IN_WASHER,
        CLOTHES_IN_DRYER,
        CLOTHES_FOLDING,
        CLOTHES_DELIVERY,
        ORDER_WORK_SUBMITTED,
        ORDER_FEEDBACK_SUBMITTED,
        ORDER_TIP_LEFT,
        ORDER_CANCELLED,
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [READ, UNREAD],
      default: UNREAD,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "messages",
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orders",
      index: true,
    },
    launderer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      index: true,
    },
    messenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);
export default model("notifications", notificationSchema);

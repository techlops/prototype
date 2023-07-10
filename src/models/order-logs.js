// module imports
import mongoose from "mongoose";

// file imports
import { USER_TYPES, ORDER_STATUSES } from "../configs/enums.js";

// destructuring assignments
const { CUSTOMER, LAUNDERER } = USER_TYPES;
const {
  PENDING,
  CONFIRMED,
  STARTED,
  COMING_FOR_PICKUP,
  REACHED_LOCATION,
  PICKUP_LOCATION_SELECTED,
  CLOTHES_IN_WASHER,
  CLOTHES_IN_DRYER,
  CLOTHES_FOLDING,
  CLOTHES_DELIVERY,
  WORK_SUBMITTED,
  FEEDBACK_SUBMITTED,
  CANCELLED,
} = ORDER_STATUSES;

// variable initializations
const Schema = mongoose.Schema;
const model = mongoose.model;

const orderLogSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "orders",
      required: true,
      index: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    actorType: {
      type: String,
      enum: [CUSTOMER, LAUNDERER],
      required: true,
    },
    action: {
      type: String,
      enum: [
        PENDING,
        CONFIRMED,
        STARTED,
        COMING_FOR_PICKUP,
        REACHED_LOCATION,
        PICKUP_LOCATION_SELECTED,
        CLOTHES_IN_WASHER,
        CLOTHES_IN_DRYER,
        CLOTHES_FOLDING,
        CLOTHES_DELIVERY,
        WORK_SUBMITTED,
        FEEDBACK_SUBMITTED,
        CANCELLED,
      ],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
export default model("orderLogs", orderLogSchema);

// module imports
import mongoose from "mongoose";

import { ORDER_ACCEPTED_REJECTED } from "../configs/enums.js";

const { ACCEPTED, REJECTED, DEFAULT } = ORDER_ACCEPTED_REJECTED


// variable initializations
const Schema = mongoose.Schema;
const model = mongoose.model;


const ordersRequestSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "orders",
      required: true,
      index: true,
    },
    acceptedRejected: {
      enum: [ACCEPTED, REJECTED, DEFAULT],
      default: "default",
      required: true
    },
  },
  {
    timestamps: true,
  }
);

export default model("ordersRequest", ordersRequestSchema);

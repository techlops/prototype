// module imports
import mongoose from "mongoose";

import { ORDER_ACCEPTED_REJECTED } from "../configs/enums.js";

const { ACCEPTED, REJECTED, DEFAULT } = ORDER_ACCEPTED_REJECTED


// variable initializations
const Schema = mongoose.Schema;
const model = mongoose.model;


const ordersRequestDeclinesSchema = new Schema(
  {
    launderer: {
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
  },
  {
    timestamps: true,
  }
);

export default model("ordersRequestDeclines", ordersRequestDeclinesSchema);

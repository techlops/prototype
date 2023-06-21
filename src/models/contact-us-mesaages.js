// module imports
import mongoose from "mongoose";

// file imports
import { MESSAGE_STATUSES } from "../configs/enums.js";

// destructuring assignments
const { UNREAD, READ, DELETED } = MESSAGE_STATUSES;

// variable initializations
const Schema = mongoose.Schema;
const model = mongoose.model;

const contactUsMessageSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [UNREAD, READ, DELETED],
      default: UNREAD,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default model("contactUsMessages", contactUsMessageSchema);

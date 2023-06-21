// module imports
import mongoose from "mongoose";

// variable initializations
const Schema = mongoose.Schema;
const model = mongoose.model;

const conversationSchema = new Schema(
  {
    userTo: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    userFrom: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "messages",
      // required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default model("conversations", conversationSchema);

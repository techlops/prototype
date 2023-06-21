// module imports
import mongoose from "mongoose";


// variable initializations
const Schema = mongoose.Schema;
const model = mongoose.model;

const customerComplaintsSchema = new Schema(
  {
    customer: {
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
    problem: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);
export default model("customerComplaints", customerComplaintsSchema);

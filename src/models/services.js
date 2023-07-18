// module imports
import mongoose from "mongoose";

// variable initializations
const Schema = mongoose.Schema;
const model = mongoose.model;

const serviceSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    image: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { timestamps: true }
);

export default model("services", serviceSchema);

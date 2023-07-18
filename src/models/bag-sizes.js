// module imports
import mongoose from "mongoose";

// file imports

// destructuring assignments

// variable initializations
const Schema = mongoose.Schema;
const model = mongoose.model;

const bagSizeSchema = new Schema(
  {
    capacity: {
      type: Number,
      required: true,
      default: 0
    },
    price: {
      type: Number, 
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
export default model("bagSizes", bagSizeSchema);

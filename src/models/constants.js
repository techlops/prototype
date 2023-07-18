// module imports
import mongoose from "mongoose";

// file imports
import { APP_CONSTANTS } from "../configs/enums.js";

// destructuring assignments
const {
  ABOUT_US,
  TERMS_AND_CONDITIONS,
  PRIVACY_POLICY,
  LFL_BAG_PRICE,
  DELIVERY_FEE,
  APP_CHARGES_PERCENTAGE,
} = APP_CONSTANTS;

// variable initializations
const Schema = mongoose.Schema;
const model = mongoose.model;

const constantSchema = new Schema(
  {
    title: {
      type: String,
      enum: [
        ABOUT_US,
        TERMS_AND_CONDITIONS,
        PRIVACY_POLICY,
        LFL_BAG_PRICE,
        DELIVERY_FEE,
        APP_CHARGES_PERCENTAGE,
      ],
      index: true,
      unique: true,
      required: true,
    },
    description: {
      type: String,
    },
    value: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);
export default model("constants", constantSchema);

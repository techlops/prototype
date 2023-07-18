// module imports
import mongoose from "mongoose";

// file imports
import { GEO_JSON_TYPES } from "../configs/enums.js";

// destructuring assignments
const { POINT } = GEO_JSON_TYPES;

// variable initializations
const Schema = mongoose.Schema;
const model = mongoose.model;

const customerLocationSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: [POINT],
        default: POINT,
        // required: true,
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        // required: true,
      },
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    zip: {
      type: String,
      trim: true,
    },
    isSelected: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);
export default model("customerLocations", customerLocationSchema);

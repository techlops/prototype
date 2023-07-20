// module imports
import mongoose from "mongoose";

// file imports
import {
  ORDER_STATUSES,
  GEO_JSON_TYPES,
  PICKUP_LOCATION_TYPES,
  MAIN_STATUSESORDER
} from "../configs/enums.js";

// destructuring assignments
const { POINT } = GEO_JSON_TYPES;

// variable initializations
const Schema = mongoose.Schema;
const model = mongoose.model;

const ImageSchema = new Schema(
  {
    path: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const laundererSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    drivingLicense: ImageSchema,
    authorisedID: ImageSchema,
    w9Form: {
      type: String,
      trim: true,
    },
    serviceRadius: {
      // meters
      type: Number,
      default: 0,
    },
    avgRating: {
      type: Number,
      default: 0,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    location: {
      type: {
        type: String,
        enum: [POINT],
        default: POINT,
        required: true,
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        required: true,
      },
    },
    online: {
      type: Boolean,
      default: false,
    },
    radius: {
      type: Number,
      default: 0,
      required: true,
    },
    zip: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: [POINT],
        default: POINT,
        required: true,
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// laundererSchema.index({ location: "2dsphere" });


export default model("launderers", laundererSchema);

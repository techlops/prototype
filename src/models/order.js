import mongoose from "mongoose";

// file imports
import {
  ORDER_STATUSES,
  GEO_JSON_TYPES,
  PICKUP_LOCATION_TYPES,
  MAIN_STATUSESORDER
} from "../configs/enums.js";


// variable initializations
const Schema = mongoose.Schema;
const model = mongoose.model;

// destructuring assignments
const { POINT } = GEO_JSON_TYPES;
const { UPCOMING, IN_PROGRESS, COMPLETED } = MAIN_STATUSESORDER
const { DOOR, GARAGE, OTHER } = PICKUP_LOCATION_TYPES;
const {
  PENDING,
  CONFIRMED,
  STARTED,
  COMING_FOR_PICKUP,
  REACHED_LOCATION,
  PICKUP_LOCATION_SELECTED,
  CLOTHES_IN_WASHER,
  CLOTHES_IN_DRYER,
  CLOTHES_FOLDING,
  CLOTHES_DELIVERY,
  WORK_SUBMITTED,
  FEEDBACK_SUBMITTED,
  CANCELLED,
} = ORDER_STATUSES;

const pictureSchema = new Schema(
  {
    path: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const orderSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    launderer: {
      type: Schema.Types.ObjectId,
      ref: "users",
      index: true,
    },
    status: {
      type: String,
      enum: [
        UPCOMING,
        IN_PROGRESS,
        COMPLETED
      ]
    },
    subStatus: {
    type: String,
    enum: [
      PENDING,
      CONFIRMED,
      STARTED,
      COMING_FOR_PICKUP,
      REACHED_LOCATION,
      PICKUP_LOCATION_SELECTED,
      CLOTHES_IN_WASHER,
      CLOTHES_IN_DRYER,
      CLOTHES_FOLDING,
      CLOTHES_DELIVERY,
      WORK_SUBMITTED,
      FEEDBACK_SUBMITTED,
      CANCELLED,
    ],
    default: PENDING,
    required: true,
    index: true,
    },
    time: {
      type: Date,
    },
    orderBags: [
      {
        type: Schema.Types.ObjectId,
        ref: "orderBags", // Reference the "bag" model
        required: true
      },
    ],
    pickupLocation: {
      type: String,
      enum: [DOOR, GARAGE, OTHER],
    },
    dropOffLocation: {
      type: String,
      enum: [DOOR, GARAGE, OTHER],
    },
    beforeWorkPictures: [pictureSchema],
    afterWorkPictures: [pictureSchema],
    lflBagsCount: {
      type: Number,
      default: 0,
      required: true,
    },
    customerReview: {
      type: String,
      trim: true,
    },
    customerRating: {
      type: Number,
    },
    isTipped: {
      type: Boolean,
      default: false,
      required: true,
    },
    tipAmount: {
      type: Number,
    },
    customLocation: {
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
    totalAmount: {
      type: Number,
      index: true
    },
    deliveryFee: {
      type: Number,
      index: true
    },
    laundererFeedback: {
      type: String,
      index: true,
    }
  },
  {
    timestamps: true,
  }

);

orderSchema.index({ customLocation: "2dsphere" });


export default model("orders", orderSchema);

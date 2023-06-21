// module imports
import mongoose from "mongoose";
// file imports
import {
  GEO_JSON_TYPES,
} from "../configs/enums.js";

// destructuring assignments
const { POINT } = GEO_JSON_TYPES;

// variable initializations
const Schema = mongoose.Schema;
const model = mongoose.model;

const fcm = {
  device: { type: String, required: [true, "Please enter FCM device id!"] },
  token: { type: String, required: [true, "Please enter FCM token!"] },
  select: false,
};

const ImageSchema = new Schema(
  {
    path: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Please enter password!"],
      minlength: [6, "Password must be at least 6 characters"],
      maxlength: [1024, "Password cannot exceed 1024 characters"],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
    phoneCode: {
      type: String,
      trim: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    image: ImageSchema,
    fcms: [fcm],
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
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    isCustomer: {
      type: Boolean,
      select: false,
      default: false,
    },
    isLaunderer: {
      type: Boolean,
      select: false,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default model("users", userSchema);

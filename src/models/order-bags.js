import mongoose from "mongoose";


import { SPIN_SETTINGS, TEMPERATURE_SETTINGS } from "../configs/enums.js";
// variable initializations
const Schema = mongoose.Schema;
const model = mongoose.model;



// Destructuring objects
const { AIR_DRY, DRY_HIGH, DRY_LOW } = SPIN_SETTINGS;

const { COLD, HOT, WARM } = TEMPERATURE_SETTINGS;

const ImageSchema = new Schema(
  {
    path: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const bagSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "orders",
      required: true,
      index: true,
    },
    spinSettings: {
      type: String,
      enum: [AIR_DRY, DRY_HIGH, DRY_LOW],
      required: true,
    },
    bagSize: {
      type: Schema.Types.ObjectId,
      ref: "bagSizes",
      required: true,
      index: true,
    },
    temperature: {
      type: String,
      enum: [COLD, HOT, WARM],
      required: true,
    },
    images: [ImageSchema],
  },
  {
    timestamps: true,
  }
);

export default model("bags", bagSchema)
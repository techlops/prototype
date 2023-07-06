// module imports
import mongoose from "mongoose";

// file imports
import { PAYMENT_ACCOUNT_TYPES } from "../configs/enums.js";

// destructuring assignments
const { STRIPE_ACCOUNT, STRIPE_CUSTOMER } = PAYMENT_ACCOUNT_TYPES;

// variable initializations
const Schema = mongoose.Schema;

const constantsSchema = new Schema(
  {
    lflBagPrice: {
      type: Number
    },
    deliveryFee: {
      type: Number
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("constants", constantsSchema);

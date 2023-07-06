// module imports
import mongoose from "mongoose";

// file imports
import { PAYMENT_ACCOUNT_TYPES } from "../configs/enums.js";

// destructuring assignments
const { STRIPE_ACCOUNT, STRIPE_CUSTOMER } = PAYMENT_ACCOUNT_TYPES;

// variable initializations
const Schema = mongoose.Schema;

const paymentAccountSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    account: {
      type: Object,
      required: true,
    },
    isDefault: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("paymentAccounts", paymentAccountSchema);

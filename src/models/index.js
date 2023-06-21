import users from "./user.js";
import bags from "./order-bags.js";
import launderers from "./launderer.js";
import conversations from "./conversation.js";
import messages from "./message.js";
import orders from "./order.js";
import bagSizes from "./bag-sizes.js";
import paymentAccounts from "./payment-accounts.js";

export default {
  bagSizesModel: bagSizes,
  launderersModel: launderers,
  messagesModel: messages,
  conversationsModel: conversations,
  usersModel: users,
  ordersModel: orders,
  bagsModel: bags,
  paymentAccountsModel: paymentAccounts
};


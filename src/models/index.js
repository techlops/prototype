import users from "./user.js";
import orderBags from "./order-bags.js";
import launderers from "./launderer.js";
import conversations from "./conversation.js";
import messages from "./messages.js";
import orders from "./order.js";
import bagSizes from "./bag-sizes.js";
import paymentAccounts from "./payment-accounts.js";
import contactUsMessage from "./contact-us-mesaages.js";
import constants from "./constants.js";
import orderRequestDeclines from "./order-request-declines.js";

export default {
  bagSizesModel: bagSizes,
  launderersModel: launderers,
  messagesModel: messages,
  conversationsModel: conversations,
  usersModel: users,
  ordersModel: orders,
  orderBagsModel: orderBags,
  paymentAccountsModel: paymentAccounts,
  contactUsMessageModel: contactUsMessage,
  constantsModel: constants,
  orderRequestDeclinesModel: orderRequestDeclines
};


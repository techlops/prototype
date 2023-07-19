import models from "../models/index.js";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import { isValidObjectId, Types } from "mongoose";
import SocketManager from "../utils/socket-manager.js";
// import { getUserDetails } from "./launderer.js";
import { getToken } from "../middlewares/authenticator.js";
import mongoose from "mongoose";

const { ObjectId } = Types;

const {
  usersModel,
  launderersModel,
  ordersModel,
  bagSizesModel,
  orderBagsModel,
  constantsModel,
  orderRequestDeclinesModel,
  orderLogsModel,
  notificationsModel,
} = models;

// LAUNDERER

export const updateLaundererLocationGPT = async (params) => {
  const { coordinates, user, address, street } = params;

  const checkUser = await usersModel.aggregate([
    {
      $match: {
        _id: user,
        isLaunderer: true,
      },
    },
    {
      $addFields: {
        location: {
          coordinates: coordinates,
        },
      },
    },
    {
      $project: {
        _id: 1,
      },
    },
  ]);

  if (checkUser.length > 0) {
    await usersModel.updateOne(
      { _id: user },
      { $set: { location: { coordinates: coordinates } } }
    );
  }

  return {
    success: true,
    data: checkUser[0],
  };
};

export const updateLaundererLocation = async (params) => {
  const { coordinates, user, streetAdress, city, state, country, zipCode } =
    params;
  const checkUser = await usersModel.findOne({ _id: user, isLaunderer: true });

  if (checkUser) {
    if (coordinates) {
      checkUser.location = {
        coordinates: coordinates,
      };
    }
    await checkUser.save();
  }

  return {
    success: true,
    data: checkUser,
  };
};

export const updateLaundererLocationAggregate = async (params) => {
  const { coordinates, user } = params;

  const checkUser = await usersModel.aggregate([
    {
      $match: {
        _id: user,
        isLaunderer: true,
      },
    },
    {
      $addFields: {
        location: {
          coordinates: coordinates,
        },
      },
    },
    {
      $project: {
        _id: 1,
      },
    },
  ]);

  if (checkUser.length > 0) {
    await usersModel.updateOne(
      { _id: user },
      { $set: { location: { coordinates: coordinates } } }
    );
  }

  return {
    success: true,
    data: checkUser[0],
  };
};

export const laundererIdentityVerification = async (params) => {
  const { user } = params;
};

export const laundererToggleSwitch = async (params) => {
  const { toggle, user } = params;
  if ((toggle = true)) {
    let laundererStatus = await launderersModel.findByIdAndUpdate(user, {
      isOnline: true,
    });
  } else if ((toggle = false)) {
    laundererStatus = await launderersModel.findByIdAndUpdate(user, {
      isOnline: false,
    });
  }

  return {
    success: true,
  };
};

export const nearbyPendingOrderRequests = async (params) => {
  const { user } = params;
  console.log("user : ", user);

  // Fetch the location of the user from the usersModel collection
  const findUser = await launderersModel.findOne({ user: user });
  console.log("findUser Location : ", findUser.location.coordinates);

  const coordinates = findUser.location.coordinates;

  // Define the radius (in meters) for the search
  let radius = findUser.radius;
  console.log("radius : ", radius);
  radius = radius * 1609.34;

  // Fetch the IDs of orders declined by the launderer
  const declinedOrderIds = await orderRequestDeclinesModel
    .find({ launderer: user })
    .distinct("order");

  // Find nearby orders within the specified radius and not declined by the launderer

  // const nearbyOrders = await ordersModel.find(
  //   {
  //     customLocation: {
  //       $near: {
  //         $geometry: {
  //           type: "Point",
  //           coordinates: coordinates,
  //         },
  //         // $maxDistance: radius
  //       },
  //     },
  //     _id: { $nin: declinedOrderIds },
  //   },
  //   // Specify the fields to include in the response
  //   { address: 1, time: 1 }
  // );

  const nearbyOrders = await ordersModel.find(
    {
      customLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates,
          },
          // $maxDistance: radius
        },
      },
      _id: { $nin: declinedOrderIds },
      status: "pending", // Add this condition to find only orders with status "pending"
    },
    // Specify the fields to include in the response
    { address: 1, time: 1 }
  );

  return {
    success: true,
    data: nearbyOrders,
  };
};

export const laundererOrderRequestDecline = async (params) => {
  const { order, user } = params;

  const existingDecline = await orderRequestDeclinesModel.findOne({
    launderer: user,
    order: order,
  });

  if (existingDecline) {
    throw new Error("Order already declined by this launderer ||| 400");
  }

  const newDecline = await orderRequestDeclinesModel.create({
    launderer: user,
    order: order,
  });

  return {
    success: true,
    message: "Order declined successfully",
    data: newDecline,
  };
};

export const laundererOrderRequestAccept = async (params) => {
  const { order, user, accept } = params;

  // Check if the order substatus is 'pending'
  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "pending",
  });

  if (!checkOrder) {
    throw new Error("Invalid order or substatus is not pending ||| 400");
  }

  if (accept) {
    // Update the order status to 'confirmed' and assign the launderer
    const updatedOrder = await ordersModel.findByIdAndUpdate(order, {
      subStatus: "confirmed",
      status: "upcoming",
      launderer: user,
    });

    const notificationObj = {};

    notificationObj.user = updatedOrder.customer;
    notificationObj.step = "order_request_accepted";
    notificationObj.order = updatedOrder.order;
    notificationObj.status = "unread";

    const notification = await notificationsModel.create(notificationObj);

    const updateCustomerNotifications = await usersModel.findByIdAndUpdate(
      { _id: updatedOrder.customer },
      { $inc: { unreadNotifications: 1 } },
      { new: true }
    );

    console.log(
      "unreadNotifications : ",
      updateCustomerNotifications.unreadNotifications
    );
    // notifications count emit
    await new SocketManager().emitEvent({
      to: updatedOrder.customer.toString(),
      event: "unreadNotifications_" + updatedOrder.customer,
      data: updateCustomerNotifications.unreadNotifications,
    });

    return {
      success: true,
      message: "Order accepted successfully",
    };
  } else {
    throw new Error("Invalid operation. Accept parameter must be true ||| 400");
    // Create a document in orderRequestDeclinesModel to record the order rejection
    //  await orderRequestDeclinesModel.create({ launderer: user, order });
  }
};

export const startService = async (params) => {
  const { order, user } = params;

  // Check if the order substatus is 'pending'
  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "confirmed",
  });

  if (!checkOrder) {
    throw new Error("Invalid order or substatus is not confirmed ||| 403");
  }

  // Update the order status to 'confirmed' and assign the launderer
  const updatedOrder = await ordersModel.findByIdAndUpdate(order, {
    subStatus: "started",
    status: "in_progress",
  });

  const orderLog = new orderLogsModel({
    order: order,
    action: "started",
    actor: user,
    actorType: "launderer",
    createdAt: new Date(),
  });

  await orderLog.save();

  const notificationObj = {};

  notificationObj.user = updatedOrder.customer;
  notificationObj.step = "order_started";
  notificationObj.order = updatedOrder.order;
  notificationObj.status = "unread";

  const notification = await notificationsModel.create(notificationObj);

  const updateCustomerNotifications = await usersModel.findByIdAndUpdate(
    { _id: updatedOrder.customer },
    { $inc: { unreadNotifications: 1 } },
    { new: true }
  );

  console.log(
    "unreadNotifications : ",
    updateCustomerNotifications.unreadNotifications
  );
  // notifications count emit
  await new SocketManager().emitEvent({
    to: updatedOrder.customer.toString(),
    event: "unreadNotifications_" + updatedOrder.customer,
    data: updateCustomerNotifications.unreadNotifications,
  });

  return {
    success: true,
  };
};

export const laundererOnWay = async (params) => {
  const { order, user, coordinates } = params;

  // Check if the order substatus is 'pending'
  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "started",
  });

  if (!checkOrder) {
    throw new Error("Invalid order or substatus is not started ||| 400");
  }

  // Update the order status to 'confirmed' and assign the launderer
  const updatedOrder = await ordersModel.findByIdAndUpdate(order, {
    subStatus: "coming_for_pickup",
    status: "in_progress",
  });

  const orderLog = new orderLogsModel({
    order: order,
    action: "coming_for_pickup",
    actor: user,
    actorType: "launderer",
    createdAt: new Date(),
  });

  await orderLog.save();

  // sockets
  // send coordinates to customer id from orders table through sockets
  // make an event and have the customer listen to that event

  const notificationObj = {};

  notificationObj.user = updatedOrder.customer;
  notificationObj.step = "launderer_coming";
  notificationObj.order = updatedOrder.order;
  notificationObj.status = "unread";

  const notification = await notificationsModel.create(notificationObj);

  const updateCustomerNotifications = await usersModel.findByIdAndUpdate(
    { _id: updatedOrder.customer },
    { $inc: { unreadNotifications: 1 } },
    { new: true }
  );

  console.log(
    "unreadNotifications : ",
    updateCustomerNotifications.unreadNotifications
  );
  // notifications count emit
  await new SocketManager().emitEvent({
    to: updatedOrder.customer.toString(),
    event: "user_" + updatedOrder.customer,
    data: updateCustomerNotifications.unreadNotifications,
  });

  // socket orderlogs to customer

  return {
    success: true,
  };
};

export const laundererReachedLocation = async (params) => {
  const { order, user, coordinates } = params;

  // Check if the order substatus is 'pending'
  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "coming_for_pickup",
  });

  if (!checkOrder) {
    throw new Error(
      "Invalid order or substatus has not be updated to 'On My Way' ||| 403"
    );
  }

  // Update the order status to 'confirmed' and assign the launderer
  const updatedOrder = await ordersModel.findByIdAndUpdate(order, {
    subStatus: "reached_location",
    status: "in_progress",
  });

  const orderLog = new orderLogsModel({
    order: order,
    action: "reached_location",
    actor: user,
    actorType: "launderer",
    createdAt: new Date(),
  });

  await orderLog.save();

  const notificationObj = {};

  notificationObj.user = updatedOrder.customer;
  notificationObj.step = "launderer_reached";
  notificationObj.order = updatedOrder.order;
  notificationObj.status = "unread";

  const notification = await notificationsModel.create(notificationObj);

  const updateCustomerNotifications = await usersModel.findByIdAndUpdate(
    { _id: updatedOrder.customer },
    { $inc: { unreadNotifications: 1 } },
    { new: true }
  );

  console.log(
    "unreadNotifications : ",
    updateCustomerNotifications.unreadNotifications
  );
  // notifications count emit
  await new SocketManager().emitEvent({
    to: updatedOrder.customer.toString(),
    event: "unreadNotifications_" + updatedOrder.customer,
    data: updateCustomerNotifications.unreadNotifications,
  });

  return {
    success: true,
  };
};

export const pickupLocationSelect = async (params) => {
  const { order, user, images, pickUpType } = params;

  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "reached_location",
  });

  if (!checkOrder) {
    throw new Error(
      "Invalid order or substatus has not be updated to 'Location Reached' by User ||| 403"
    );
  }

  const beforeWorkPictures = []; // Create an array to store the images

  for (let i = 0; i < images.length; i++) {
    const bagImagePath = images[i];
    beforeWorkPictures.push({ path: bagImagePath }); // Push the image path into the array
  }

  const updateOrder = await ordersModel.findByIdAndUpdate(
    order,
    {
      $set: {
        beforeWorkPictures, // Update the beforeWorkPictures field
        subStatus: "pickup_location_selected",
        status: "in_progress",
        pickupLocation: pickUpType,
      },
    },
    { new: true }
  );

  const orderLog = new orderLogsModel({
    order: order,
    action: "pickup_location_selected",
    actor: user,
    actorType: "launderer",
    createdAt: new Date(),
  });

  await orderLog.save();

  const notificationObj = {};

  notificationObj.user = updateOrder.customer;
  notificationObj.step = "pickup_location_selected";
  notificationObj.order = updateOrder.order;
  notificationObj.status = "unread";

  const notification = await notificationsModel.create(notificationObj);

  const updateCustomerNotifications = await usersModel.findByIdAndUpdate(
    { _id: updateOrder.customer },
    { $inc: { unreadNotifications: 1 } },
    { new: true }
  );

  console.log(
    "unreadNotifications : ",
    updateCustomerNotifications.unreadNotifications
  );
  // notifications count emit
  await new SocketManager().emitEvent({
    to: updatedOrder.customer.toString(),
    event: "unreadNotifications_" + updateOrder.customer,
    data: updateCustomerNotifications.unreadNotifications,
  });

  return {
    success: true,
  };
};

export const clothesInWasher = async (params) => {
  const { order, user } = params;

  // Check if the order substatus is 'pickup_location_selected'
  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "pickup_location_selected",
  });

  if (!checkOrder) {
    throw new Error(
      "Invalid order or substatus has not be updated to 'pickup_location_selected' ||| 403"
    );
  }

  // Update the order status to 'clothes_in_dryer' and assign the launderer
  const updatedOrder = await ordersModel.findByIdAndUpdate(order, {
    subStatus: "clothes_in_washer",
    status: "in_progress",
  });

  const orderLog = new orderLogsModel({
    order: order,
    action: "clothes_in_washer",
    actor: user,
    actorType: "launderer",
    createdAt: new Date(),
  });

  await orderLog.save();

  const notificationObj = {};

  notificationObj.user = updatedOrder.customer;
  notificationObj.step = "clothes_in_washer";
  notificationObj.order = updatedOrder.order;
  notificationObj.status = "unread";

  const notification = await notificationsModel.create(notificationObj);

  const updateCustomerNotifications = await usersModel.findByIdAndUpdate(
    { _id: updatedOrder.customer },
    { $inc: { unreadNotifications: 1 } },
    { new: true }
  );

  console.log(
    "unreadNotifications : ",
    updateCustomerNotifications.unreadNotifications
  );
  // notifications count emit
  await new SocketManager().emitEvent({
    to: updatedOrder.customer.toString(),
    event: "unreadNotifications_" + updatedOrder.customer,
    data: updateCustomerNotifications.unreadNotifications,
  });

  return {
    success: true,
  };
};

export const clothesInDryer = async (params) => {
  const { order, user } = params;

  // Check if the order substatus is 'pickup_location_selected'
  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "clothes_in_washer",
  });

  if (!checkOrder) {
    throw new Error(
      "Invalid order or substatus has not be updated to 'clothes in washer' ||| 403"
    );
  }

  // Update the order status to 'clothes_in_dryer' and assign the launderer
  const updatedOrder = await ordersModel.findByIdAndUpdate(order, {
    subStatus: "clothes_in_dryer",
    status: "in_progress",
  });

  const orderLog = new orderLogsModel({
    order: order,
    action: "clothes_in_dryer",
    actor: user,
    actorType: "launderer",
    createdAt: new Date(),
  });

  await orderLog.save();

  const notificationObj = {};

  notificationObj.user = updatedOrder.customer;
  notificationObj.step = "clothes_in_dryer";
  notificationObj.order = updatedOrder.order;
  notificationObj.status = "unread";

  const notification = await notificationsModel.create(notificationObj);

  const updateCustomerNotifications = await usersModel.findByIdAndUpdate(
    { _id: updatedOrder.customer },
    { $inc: { unreadNotifications: 1 } },
    { new: true }
  );

  console.log(
    "unreadNotifications : ",
    updateCustomerNotifications.unreadNotifications
  );
  // notifications count emit
  await new SocketManager().emitEvent({
    to: updatedOrder.customer.toString(),
    event: "unreadNotifications_" + updatedOrder.customer,
    data: updateCustomerNotifications.unreadNotifications,
  });

  return {
    success: true,
  };
};

export const clothesFolding = async (params) => {
  const { order, user } = params;

  // Check if the order substatus is 'pending'
  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "clothes_in_dryer",
  });

  if (!checkOrder) {
    throw new Error(
      "Invalid order or current substatus is not 'clothes in dryer' ||| 403"
    );
  }

  // Update the order status to 'confirmed' and assign the launderer
  const updatedOrder = await ordersModel.findByIdAndUpdate(order, {
    subStatus: "clothes_folding",
    status: "in_progress",
  });

  const orderLog = new orderLogsModel({
    order: order,
    action: "clothes_folding",
    actor: user,
    actorType: "launderer",
    createdAt: new Date(),
  });

  await orderLog.save();

  const notificationObj = {};

  notificationObj.user = updatedOrder.customer;
  notificationObj.step = "clothes_folding";
  notificationObj.order = updatedOrder.order;
  notificationObj.status = "unread";

  const notification = await notificationsModel.create(notificationObj);

  const updateCustomerNotifications = await usersModel.findByIdAndUpdate(
    { _id: updatedOrder.customer },
    { $inc: { unreadNotifications: 1 } },
    { new: true }
  );

  console.log(
    "unreadNotifications : ",
    updateCustomerNotifications.unreadNotifications
  );
  // notifications count emit
  await new SocketManager().emitEvent({
    to: updatedOrder.customer.toString(),
    event: "unreadNotifications_" + updatedOrder.customer,
    data: updateCustomerNotifications.unreadNotifications,
  });

  return {
    success: true,
  };
};

export const clothesDelivery = async (params) => {
  const { order, user } = params;

  // Check if the order substatus is 'clothes_folding'
  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "clothes_folding",
  });

  if (!checkOrder) {
    throw new Error(
      "Invalid order or current substatus is not 'clothes_folding' ||| 403"
    );
  }

  // Update the order status to 'clothes_delivery' and assign the launderer
  const updatedOrder = await ordersModel.findByIdAndUpdate(order, {
    subStatus: "clothes_delivery",
    status: "in_progress",
  });

  const orderLog = new orderLogsModel({
    order: order,
    action: "clothes_delivery",
    actor: user,
    actorType: "launderer",
    createdAt: new Date(),
  });

  await orderLog.save();

  const notificationObj = {};

  notificationObj.user = updatedOrder.customer;
  notificationObj.step = "clothes_delivery";
  notificationObj.order = updatedOrder.order;
  notificationObj.status = "unread";

  const notification = await notificationsModel.create(notificationObj);

  const updateCustomerNotifications = await usersModel.findByIdAndUpdate(
    { _id: updatedOrder.customer },
    { $inc: { unreadNotifications: 1 } },
    { new: true }
  );

  console.log(
    "unreadNotifications : ",
    updateCustomerNotifications.unreadNotifications
  );
  // notifications count emit
  await new SocketManager().emitEvent({
    to: updatedOrder.customer.toString(),
    event: "unreadNotifications_" + updatedOrder.customer,
    data: updateCustomerNotifications.unreadNotifications,
  });

  return {
    success: true,
  };
};

export const submitWork = async (params) => {
  const { order, user, feedback, images, dropOffType } = params;

  // Check if the order substatus is 'pending'
  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "clothes_delivery",
  });

  if (!checkOrder) {
    throw new Error(
      "Invalid order or current substatus is not 'clothes_delivery' ||| 403"
    );
  }

  const afterWorkPictures = []; // Create an array to store the images

  for (let i = 0; i < images.length; i++) {
    const bagImagePath = images[i];
    afterWorkPictures.push({ path: bagImagePath }); // Push the image path into the array
  }

  const updatedOrder = await ordersModel.findByIdAndUpdate(
    order,
    {
      $set: {
        afterWorkPictures, // Update the beforeWorkPictures field
        subStatus: "work_submitted",
        status: "completed",
        dropOffLocation: dropOffType,
        laundererFeedback: feedback,
      },
    },
    { new: true }
  );

  const orderLog = new orderLogsModel({
    order: order,
    action: "work_submitted",
    actor: user,
    actorType: "launderer",
    createdAt: new Date(),
  });

  await orderLog.save();

  const notificationObj = {};

  notificationObj.user = updatedOrder.customer;
  notificationObj.step = "order_work_submitted";
  notificationObj.order = updatedOrder.order;
  notificationObj.status = "unread";

  const notification = await notificationsModel.create(notificationObj);

  const updateCustomerNotifications = await usersModel.findByIdAndUpdate(
    { _id: updatedOrder.customer },
    { $inc: { unreadNotifications: 1 } },
    { new: true }
  );

  console.log(
    "unreadNotifications : ",
    updateCustomerNotifications.unreadNotifications
  );
  // notifications count emit
  await new SocketManager().emitEvent({
    to: updatedOrder.customer.toString(),
    event: "unreadNotifications_" + updatedOrder.customer,
    data: updateCustomerNotifications.unreadNotifications,
  });

  return {
    success: true,
  };
};

// retrieve only count of all orders of per day in a given month and year which are assigned to launderer.
// should return count by each day for example it should return the count of orders on 12th July, the count of order on 13th July so on and so forth from the first of the month till the last day of the month
export const orderCountPerDay = async (params) => {
  const { user, year, month } = params;

  const startDate = new Date(year, month - 1, 1); // Create a start date for the given year and month
  const endDate = new Date(year, month, 0); // Create an end date for the given year and month

  const query = [
    {
      $match: {
        launderer: mongoose.Types.ObjectId(user),
        time: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: { $dayOfMonth: "$time" },
        count: { $sum: 1 },
      },
    },
  ];

  const result = await ordersModel.aggregate(query);

  console.log("result : ", result);

  // const data = result.reduce((acc, { _id, count }) => {
  //   acc.push({ [_id.toString()]: count });
  //   return acc;
  // }, []);

  return {
    success: true,
    result,
  };
};

export const ordersByDay = async (params) => {
  const { user, year, month, day } = params;
  let { limit, page } = params;
  if (!limit) limit = 10;
  if (!page) page = 0;
  if (page) page = page - 1;
  const startDate = new Date(year, month - 1, day, 0, 0, 0);
  const endDate = new Date(year, month - 1, day, 23, 59, 59);

  let query = [
    {
      $match: {
        launderer: mongoose.Types.ObjectId(user),
        time: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    { $skip: page * limit },
    { $limit: limit },
  ];

  const [orders, totalCount] = await Promise.all([
    ordersModel.aggregate(query),
    ordersModel.countDocuments({
      launderer: mongoose.Types.ObjectId(user),
      time: {
        $gte: startDate,
        $lte: endDate,
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  const orderDetails = orders.map((order) => {
    return { order };
  });

  return {
    success: true,
    data: {
      orderDetails,
      totalCount,
      totalPages,
    },
  };
};

export const inProgressOrders = async (params) => {
  const { user } = params;
  let { page, limit } = params;

  if (!limit) limit = 10;
  if (!page) page = 1;

  const query = {
    launderer: user,
    status: "in_progress",
  };

  const totalCount = await ordersModel.countDocuments(query);
  const totalPages = Math.ceil(totalCount / limit);
  const skipCount = (page - 1) * limit;

  const orders = await ordersModel
    .find(query)
    .select("totalAmount status address time")
    .skip(skipCount)
    .limit(limit);

  return {
    success: true,
    data: {
      orders,
      totalCount,
      totalPages,
    },
  };
};

export const upcomingOrders = async (params) => {
  const { user } = params;
  let { page, limit } = params;

  if (!limit) limit = 10;
  if (!page) page = 1;

  const query = {
    launderer: user,
    status: "upcoming",
  };

  const totalCount = await ordersModel.countDocuments(query);
  const totalPages = Math.ceil(totalCount / limit);
  const skipCount = (page - 1) * limit;

  const orders = await ordersModel
    .find(query)
    .select("totalAmount status address time")
    .skip(skipCount)
    .limit(limit);

  return {
    success: true,
    data: {
      orders,
      totalCount,
      totalPages,
    },
  };
};

export const completedOrders = async (params) => {
  const { user } = params;
  let { page, limit } = params;

  if (!limit) limit = 10;
  if (!page) page = 1;

  const query = {
    launderer: user,
    status: "completed",
  };

  const totalCount = await ordersModel.countDocuments(query);
  const totalPages = Math.ceil(totalCount / limit);
  const skipCount = (page - 1) * limit;

  const orders = await ordersModel
    .find(query)
    .select("totalAmount status address time")
    .skip(skipCount)
    .limit(limit);

  return {
    success: true,
    data: {
      orders,
      totalCount,
      totalPages,
    },
  };
};

export const cancelledOrders = async (params) => {
  const { user } = params;
  let { page, limit } = params;

  if (!limit) limit = 10;
  if (!page) page = 1;

  const query = {
    launderer: user,
    status: "cancelled",
  };

  const totalCount = await ordersModel.countDocuments(query);
  const totalPages = Math.ceil(totalCount / limit);
  const skipCount = (page - 1) * limit;

  const orders = await ordersModel
    .find(query)
    .select("totalAmount status address time")
    .skip(skipCount)
    .limit(limit);

  return {
    success: true,
    data: {
      orders,
      totalCount,
      totalPages,
    },
  };
};

export const orderLogs = async (params) => {
  const { order, user } = params;
  // Fetch all order logs for the specified order
  const logs = await orderLogsModel
    .find({ order: order })
    .select("order actor actorType action createdAt");

  return {
    success: true,
    data: logs,
  };
};

export const laundererDetails = async (params) => {
  const { user } = params;
  const objectId = mongoose.Types.ObjectId(user);
  const userDetails = await usersModel.aggregate([
    { $match: { _id: objectId } }, // Match the user by id
    {
      $lookup: {
        from: "orders", // join with order collection
        localField: "_id",
        foreignField: "launderer",
        as: "orders",
      },
    },
    {
      $lookup: {
        from: "launderers", // join with order collection
        localField: "_id",
        foreignField: "user",
        as: "launderers",
      },
    },
    {
      $addFields: {
        earnedThisMonth: {
          $map: {
            input: {
              $filter: {
                input: "$orders",
                as: "order",
                cond: {
                  $and: [
                    { $eq: ["$$order.subStatus", "feedback_submitted"] },
                    {
                      $gte: [
                        { $toDate: "$$order.time" },
                        new Date(
                          new Date().getFullYear(),
                          new Date().getMonth() - 1,
                          1
                        ),
                      ],
                    },
                  ],
                },
              },
            },
            as: "filteredOrder",
            in: {
              $add: [
                "$$filteredOrder.laundererTotal",
                "$$filteredOrder.tipAmount",
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        user: {
          name: "$name",
          image: "$image",
          _id: "$_id",
        },
        avgRating: { $avg: "$launderers.avgRating" },
        ratingsCount: { $sum: "$launderers.ratingsCount" },
        recievedOrders: { $size: "$orders" }, // Count the size of the orders array
        completedOrders: {
          $size: {
            $filter: {
              input: "$orders",
              cond: { $eq: ["$$this.subStatus", "feedback_submitted"] },
            },
          },
        },
        // checking total earnings of this month
        earnedOverall: {
          $sum: {
            $map: {
              input: "$orders",
              as: "order",
              in: {
                $cond: [
                  { $eq: ["$$order.launderer", "$_id"] }, // Check if the launderer ID matches
                  { $add: ["$$order.laundererTotal", "$$order.tipAmount"] }, // Add laundererTotal and tipAmount
                  0, // Otherwise, add 0
                ],
              },
            },
          },
        },
        earnedThisMonth: { $sum: "$earnedThisMonth" },
      },
    },
  ]);

  const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  console.log("gteeeeeeeeeeeeeeeeeee", month);

  console.log(user, "i am hereeeeee");

  return userDetails; // Return the first (and only) result
};

export const updateRealTimeLocation = async (params) => {
  const { country, state, city, zip, coordinates, address, user, order } = params;

  const orderCustomer = await ordersModel.findOne({_id: order})

  const updateObj = {
    state,
    city,
    country,
    zip,
    address,
  };

  if (coordinates) {
    updateObj.location = {
      coordinates: coordinates,
    };
  }

  const profileUpdate = await launderersModel.findOneAndUpdate({_id: user}, updateObj, {
    new: true,
  });

  await new SocketManager().emitEvent({
    to: orderCustomer.customer.toString(),
    event: "laundererCoordinates_" + orderCustomer.customer,
    data: coordinates,
  });

  console.log("profile update : ", profileUpdate);

  return {
    success: true,
    data: {
      coordinates,
      state,
      city,
      country,
      zip,
      address,
    },
  };

};

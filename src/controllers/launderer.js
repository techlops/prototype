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
  notificationsModel
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

export const nearbyPendingOrderRequests = async (params) => {
  const { user } = params;
  console.log("user : ", user);

  // Fetch the location of the user from the usersModel collection
  const findUser = await usersModel.findOne({ _id: user });
  console.log("findUser Location : ", findUser.location.coordinates);

  const coordinates = findUser.location.coordinates;

  // Define the radius (in meters) for the search
  const radius = 20 * 1609.34; // 20 miles converted to meters

  // Fetch the IDs of orders declined by the launderer
  const declinedOrderIds = await orderRequestDeclinesModel
    .find({ launderer: user })
    .distinct("order");

  // Find nearby orders within the specified radius and not declined by the launderer
  const nearbyOrders = await ordersModel
    .find({
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
    })
    .populate("orderBags");

  return {
    success: true,
    data: nearbyOrders,
  };
};

export const laundererOrderRequestAcceptOriginal = async (params) => {
  const { order, user, accept } = params;

  // Check if the order substatus is 'pending'
  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "pending",
  });

  if (!checkOrder) {
    throw new Error("Invalid order or substatus is not pending");
  }

  try {
    if (accept) {
      // Update the order status to 'confirmed' and assign the launderer
      const accept = await ordersModel.findByIdAndUpdate(order, {
        subStatus: "confirmed",
        status: "upcoming",
        launderer: user,
      });

      const customer = checkOrder.customer;
      console.log("customer : ", customer)

      const notificationObj = {};

      if (user) notificationObj.user = user;
      notificationObj.step = "order_request_accepted"
      if (message) notificationObj.message = message;
      if (messenger) notificationObj.messenger = messenger;
    
      const notification = await notificationsModel.create(notificationObj);
      // return { success: true, data: notification };

      await new SocketManager().emitEvent({
        to: customer.toString(),
        event: "user_" + accept._id,
        data: accept
      });



      return {
        success: true,
        message: "Order accepted successfully",
      };
    } else {
      throw new Error("Invalid operation. Accept parameter must be true.");
      // Create a document in orderRequestDeclinesModel to record the order rejection
      //  await orderRequestDeclinesModel.create({ launderer: user, order });
    }
  } catch (error) {
    throw new Error("Error updating order status: " + error.message);
  }
};

export const laundererOrderRequestDecline = async (params) => {
  const { order, user } = params;

  try {
    const existingDecline = await orderRequestDeclinesModel.findOne({
      launderer: user,
      order: order,
    });

    if (existingDecline) {
      throw new Error("Order already declined by this launderer");
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
  } catch (error) {
    throw new Error("Error declining order: " + error.message);
  }
};

export const laundererOrderRequestAccept = async (params) => {
  const { order, user, accept } = params;

  // Check if the order substatus is 'pending'
  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "pending",
  });

  if (!checkOrder) {
    throw new Error("Invalid order or substatus is not pending");
  }

  try {
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

      const notification = await notificationsModel.create(notificationObj);
      const unreadCount = await notificationsModel.count({
        user: updatedOrder.customer,
        status: "unread",
      });

      // notifications count emit 
      await new SocketManager().emitEvent({
        to: updatedOrder.customer.toString(),
        event: "user_" + updatedOrder.customer,
        data: unreadCount
      });



      return {
        success: true,
        message: "Order accepted successfully",
      };
    } else {
      throw new Error("Invalid operation. Accept parameter must be true.");
      // Create a document in orderRequestDeclinesModel to record the order rejection
      //  await orderRequestDeclinesModel.create({ launderer: user, order });
    }
  } catch (error) {
    throw new Error("Error updating order status: " + error.message);
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
    throw new Error("Invalid order or substatus is not confirmed");
  }

  try {
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

    const notification = await notificationsModel.create(notificationObj);
    await notification.save();
    const unreadCount = await notificationsModel.count({
      user: updatedOrder.customer,
      status: "unread",
    });

    console.log("UNREAD COUNT AT START SERVICE: ", unreadCount)

    // notifications count emit 
    await new SocketManager().emitEvent({
      to: updatedOrder.customer.toString(),
      event: "user_" + updatedOrder.customer,
      data: unreadCount
    });

    return {
      success: true,
      message: "Order started successfully",
      data: updatedOrder,
      orderLog,
    };
  } catch (error) {
    throw new Error("Error starting order: " + error.message);
  }
};



export const laundererOnWay = async (params) => {
  const { order, user, coordinates } = params;

  // Check if the order substatus is 'pending'
  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "started",
  });

  if (!checkOrder) {
    throw new Error("Invalid order or substatus is not started");
  }

  try {
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

    const notification = await notificationsModel.create(notificationObj);
    await notification.save();
    const unreadCount = await notificationsModel.count({
      user: updatedOrder.customer,
      status: "unread",
    });

    console.log("UNREAD COUNT AT ON MY WAY : ", unreadCount)
    
    // notifications count emit 
    await new SocketManager().emitEvent({
      to: updatedOrder.customer.toString(),
      event: "user_" + updatedOrder.customer,
      data: unreadCount
    });
 

    // socket orderlogs to customer

    return {
      success: true,
      message: "Order status updated successfully to 'On My Way'",
      data: updatedOrder,
    };
  } catch (error) {
    throw new Error("Error starting order: " + error.message);
  }
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
      "Invalid order or substatus has not be updated to 'On My Way'"
    );
  }

  try {
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
    notificationObj.step = "llaunderer_reached";
    notificationObj.order = updatedOrder.order;

    const notification = await notificationsModel.create(notificationObj);
    await notification.save();
    const unreadCount = await notificationsModel.count({
      user: updatedOrder.customer,
      status: "unread",
    });


    

    // notifications count emit 
    await new SocketManager().emitEvent({
      to: updatedOrder.customer.toString(),
      event: "user_" + updatedOrder.customer,
      data: unreadCount
    });

    return {
      success: true,
      message: "Order status updated successfully to 'Location Reached'",
      data: updatedOrder,
      orderLog,
    };
  } catch (error) {
    throw new Error("Error starting order: " + error.message);
  }
};


export const pickupLocationSelect = async (params) => {
  const { order, user, images, pickUpType } = params;

  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "reached_location",
  });

  if (!checkOrder) {
    throw new Error(
      "Invalid order or substatus has not be updated to 'Location Reached' by User"
    );
  }

  try {
    const updateOrder = await ordersModel.findByIdAndUpdate(order, {
      subStatus: "pickup_location_selected",
      status: "in_progress",
      beforeWorkPictures: images,
      pickupLocation: pickUpType,
    });

    const orderLog = new orderLogsModel({
      order: order,
      action: "pickup_location_selected",
      actor: user,
      actorType: "launderer",
      createdAt: new Date(),
    });

    await orderLog.save();

    return {
      success: true,
      message:
        "Pick up location successfully added & Images before starting work successfully added",
      data: updateOrder,
      orderLog,
    };
  } catch (error) {
    throw new Error("Error starting order: " + error.message);
  }
};

export const clothesInDryer = async (params) => {
  const { order, user } = params;

  // Check if the order substatus is 'pending'
  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "pickup_location_selected",
  });

  if (!checkOrder) {
    throw new Error(
      "Invalid order or substatus has not be updated to 'pickup_location_selected'"
    );
  }

  try {
    // Update the order status to 'confirmed' and assign the launderer
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

    return {
      success: true,
      message:
        "Order status updated successfully updated to 'clothes_in_dryer'",
      data: updatedOrder,
      orderLog,
    };
  } catch (error) {
    throw new Error("Error updating order: " + error.message);
  }
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
      "Invalid order or substatus has not be updated to 'pickup_location_selected'"
    );
  }

  try {
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

    return {
      success: true,
      message: "Order status successfully updated to 'clothes_folding'",
      data: updatedOrder,
      orderLog,
    };
  } catch (error) {
    throw new Error("Error updating order: " + error.message);
  }
};

export const clothesDelivery = async (params) => {
  const { order, user } = params;

  // Check if the order substatus is 'pending'
  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "clothes_folding",
  });

  if (!checkOrder) {
    throw new Error(
      "Invalid order or substatus has not be updated to 'pickup_location_selected'"
    );
  }

  try {
    // Update the order status to 'confirmed' and assign the launderer
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

    return {
      success: true,
      message: "Order status successfully updated to 'clothes_delivery'",
      data: updatedOrder,
      orderLog,
    };
  } catch (error) {
    throw new Error("Error updating order: " + error.message);
  }
};

export const submitWork = async (params) => {
  const { order, user, feedback, images } = params;

  // Check if the order substatus is 'pending'
  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "clothes_delivery",
  });

  if (!checkOrder) {
    throw new Error(
      "Invalid order or substatus has not be updated to 'clothes_delivery'"
    );
  }

  try {
    // Update the order status to 'confirmed' and assign the launderer
    const updatedOrder = await ordersModel.findByIdAndUpdate(order, {
      subStatus: "work_submitted",
      status: "completed",
      laundererFeedback: feedback,
      afterWorkPictures: images,
    });

    const orderLog = new orderLogsModel({
      order: order,
      action: "work_submitted",
      actor: user,
      actorType: "launderer",
      createdAt: new Date(),
    });

    await orderLog.save();

    return {
      success: true,
      message: "Order status successfully updated to 'work_submitted'",
      data: updatedOrder,
      orderLog,
    };
  } catch (error) {
    throw new Error("Error updating order: " + error.message);
  }
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

  try {
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
  } catch (error) {
    throw new Error("Error fetching in-progress orders: " + error.message);
  }
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

  try {
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
  } catch (error) {
    throw new Error("Error fetching upcoming orders: " + error.message);
  }
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

  try {
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
  } catch (error) {
    throw new Error("Error fetching completed orders: " + error.message);
  }
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

  try {
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
  } catch (error) {
    throw new Error("Error fetching completed orders: " + error.message);
  }
};

export const orderLogs = async (params) => {
  const { order, user } = params;

  try {
    // Fetch all order logs for the specified order
    const logs = await orderLogsModel
      .find({ order: order })
      .select("order actor actorType action createdAt");

    return {
      success: true,
      data: logs,
    };
  } catch (error) {
    throw new Error("Error fetching order logs: " + error.message);
  }
};

export const laundererDetails = async (params) => {
  const {user} = params
  const objectId = mongoose.Types.ObjectId(user);
  try {
    const user = await usersModel.aggregate([
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
                      { $eq: ["$$order.status", "feedback_submitted"] },
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
                cond: { $eq: ["$$this.status", "feedback_submitted"] },
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

    return user; // Return the first (and only) result
  } catch (error) {
    throw new Error("Failed to retrieve user details.");
  }
};
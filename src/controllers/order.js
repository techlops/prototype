import models from "../models/index.js";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import { isValidObjectId, Types } from "mongoose";
import { getUserDetails } from "./launderer.js";
import { getToken } from "../middlewares/authenticator.js";
import mongoose from "mongoose";
import path from "path";
import orderBags from "../models/order-bags.js";

const { ObjectId } = Types;

const {
  usersModel,
  launderersModel,
  ordersModel,
  bagSizesModel,
  orderBagsModel,
  constantsModel,
  orderRequestDeclinesModel,
  orderLogsModel
} = models;

export const addBagSize = async (params) => {
  const { bagSize } = params;

  const orderBag = new orderBagsModel({
    bagSize,
  });

  await orderBag.save();

  const order = new ordersModel({
    bags: [orderBag._id],
  });

  await ordersModel.save();

  return {
    success: true,
    order: order,
  };
};

export const calculateTotalAmount = async (params) => {
  try {
    const { prices, lflBags } = params;

    // Validate input
    if (!Array.isArray(prices) || prices.length === 0) {
      throw new Error("Invalid prices. Prices must be a non-empty array.");
    }
    if (typeof lflBags !== "number" || lflBags < 0) {
      throw new Error(
        "Invalid lflBags. lflBags must be a non-negative number."
      );
    }

    // Retrieve lflBagPrice and deliveryFee from constants collection
    const constants = await constantsModel.find({});
    const lflBagPrice =
      constants.find((constant) => constant.name === "lflBagPrice")?.value || 0;
    const deliveryFee =
      constants.find((constant) => constant.name === "deliveryFee")?.value || 0;

    // Calculate the total amount
    const bagPricesTotal = prices.reduce((total, price) => total + price, 0);
    const lflBagsTotal = lflBags * lflBagPrice;
    const totalAmountBeforeDeliveryFee = bagPricesTotal + lflBagsTotal;
    const totalAmount = bagPricesTotal + lflBagsTotal + deliveryFee;

    return {
      success: true,
      totalAmountBeforeDeliveryFee,
      deliveryFee,
      totalAmount,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export const requestServiceOrdereq = async (params) => {
  const {
    bags,
    totalAmount,
    coordinates,
    lflBagsCount,
    deliveryFee,
    user,
    zip,
    address,
    city,
    state,
    country,
  } = params;

  // console.log("bags : ",bags)
  console.log("params : ", params);

  // Validate input data
  if (!Array.isArray(bags) || bags.length === 0) {
    return {
      success: false,
      message: "Invalid bags data",
    };
  }
  // if (typeof totalAmount !== "number") {
  //   return {
  //     success: false,
  //     message: "Invalid totalAmount",
  //   };
  // }
  // if (lflBagsCount < 0) {
  //   return {
  //     success: false,
  //     message: "Invalid lflBagsCount",
  //   };
  // }

  const orderBagIds = [];

  // Create orderBags and store their IDs
  for (const bag of bags) {
    const { price, images, temperatureSettings, spinSettings } = bag;

    const orderBag = new orderBagsModel({
      price,
      images,
      temperature: temperatureSettings,
      spinSettings,
    });

    await orderBag.save();
    orderBagIds.push(orderBag._id);
  }

  const customer = mongoose.Types.ObjectId(user);

  const orderObj = {
    customer: customer,
    orderBags: orderBagIds,
    date: new Date(),
    totalAmount,
    deliveryFee,
    lflBagsCount,
    zip,
    address,
    city,
    state,
    country,
  };

  if (coordinates) {
    orderObj.customLocation = {
      coordinates: coordinates,
    };
  }

  const order = await ordersModel.create(orderObj);

  return {
    success: true,
    order,
  };
};

export const requestServiceOrder = async (params) => {
  const {
    bags,
    totalAmount,
    coordinates,
    lflBagsCount,
    deliveryFee,
    user,
    zip,
    address,
    city,
    state,
    country,
    bagImages,
    time,
  } = params;

  // Iterate over the bags and bagImages simultaneously
  for (let i = 0; i < bags.length; i++) {
    const bag = bags[i];
    const bagImagePaths = bagImages[i];

    // Create a new orderBagsModel document
    const orderBag = await orderBagsModel.create({
      images: bagImagePaths.map((path) => ({ path })),
      temperatureSettings: bag.temperatureSettings,
      spinSettings: bag.spinSettings,
      price: bag.price,
    });

    // Store the orderBag._id in the bags array of the ordersModel document
    bags[i] = orderBag._id;
  }

  // Create the ordersModel document
  const order = await ordersModel.create({
    customer: user,
    orderBags: bags,
    date: new Date(),
    customLocation: {
      coordinates: coordinates,
    },
    totalAmount,
    deliveryFee,
    lflBagsCount,
    zip,
    address,
    city,
    state,
    country,
    time,
  });

  await orderBagsModel.updateMany({ _id: { $in: bags } }, { order: order._id });

  return {
    success: true,
    data: order,
  };
};

export const updateLaundererLocationGPT = async (params) => {
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
      await ordersModel.findByIdAndUpdate(order, {
        subStatus: "confirmed",
        status: "upcoming",
        launderer: user,
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
    const updatedOrder  = await ordersModel.findByIdAndUpdate(order, {
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


    return {
      success: true,
      message: "Order started successfully",
      data: updatedOrder,
      orderLog
    };
  } catch (error) {
    throw new Error("Error starting order: " + error.message);
  }
};

export const laundererOnWay = async (params) => {
  const { order, user } = params;

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
  const { order, user } = params;

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

    return {
      success: true,
      message: "Order status updated successfully to 'Location Reached'",
      data: updatedOrder,
    };
  } catch (error) {
    throw new Error("Error starting order: " + error.message);
  }
};

export const beforeWorkPictures = async (params) => {
  const { order, user, images } = params;

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
      images: images,
    });

    return {
      success: true,
      message:
        "Order status updated successfully to 'Location Reached' & Images before starting work successfully added",
      data: updateOrder,
    };
  } catch (error) {
    throw new Error("Error starting order: " + error.message);
  }
};

// retrieve only count of all orders of per day in a given month and year which are assigned to launderer.
// should return count by each day for example it should return the count of orders on 12th July, the count of order on 13th July so on and so forth from the first of the month till the last day of the month

export const orderCountPerDayArray = async (params) => {
  const { user, year, month } = params;

  const startDate = new Date(year, month - 1, 1); // Create a start date for the given year and month
  const endDate = new Date(year, month, 0); // Create an end date for the given year and month

  const query = {
    launderer: user, // Filter by the specified launderer
    time: { $gte: startDate, $lte: endDate }, // Filter by the time range between the start and end dates
  };

  const orders = await ordersModel.find(query); // Find the orders that match the query

  const orderCount = orders.reduce((countObj, order) => {
    const day = order.time.getDate(); // Get the day from the order's time field
    countObj[day] = (countObj[day] || 0) + 1; // Increment the count for the corresponding day
    return countObj;
  }, {});

  const dataArray = Object.entries(orderCount); // Convert the orderCount object into an array

  return {
    success: true,
    data: dataArray,
  };
};

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
      totalPages
    },
  };
};

export const ordersByDay1 = async (params) => {
  const { user, year, month, day } = params;
  let { limit, page } = params;
  if (!limit) limit = 10;
  if (!page) page = 0;
  if (page) page = page - 1;

  const startDate = new Date(year, month - 1, day, 0, 0, 0);
  const endDate = new Date(year, month - 1, day, 23, 59, 59);

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
      $facet: {
        orderDetails: [
          { $skip: page * limit },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              order: "$$ROOT",
            },
          },
        ],
        totalCount: [
          {
            $count: "count",
          },
        ],
      },
    },
  ];

  const [result] = await ordersModel.aggregate(query);

  const { orderDetails, totalCount } = result;
  const total = totalCount.length > 0 ? totalCount[0].count : 0;

  return {
    success: true,
    data: {
      orderDetails,
      totalCount: total,
    },
  };
};




import models from "../models/index.js";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import { isValidObjectId, Types } from "mongoose";
import { getUserDetails } from "./launderer.js";
import { getToken } from "../middlewares/authenticator.js";
import mongoose from 'mongoose';
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
  orderRequestDeclinesModel
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
    const lflBagPrice = constants.find((constant) => constant.name === "lflBagPrice")?.value || 0;
    const deliveryFee = constants.find((constant) => constant.name === "deliveryFee")?.value || 0;

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
  const { bags, totalAmount, coordinates, lflBagsCount, deliveryFee, user, zip, address, city, state, country } = params;

  // console.log("bags : ",bags)
  console.log("params : ", params)

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
    country
  }

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
  const { bags, totalAmount, coordinates, lflBagsCount, deliveryFee, user, zip, address, city, state, country, bagImages } = params;

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
    country
    // Other fields
  });

  await orderBagsModel.updateMany({ _id: { $in: bags } }, { order: order._id });

  return{
    success: true,
    data: order
  }
};

// export const nearbyPendingOrderRequests = async (params) => {
//   const {location, laundererId} = params;
// };

export const updateLaundererLocationGPT = async (params) => {
  const { coordinates, user } = params;
  
  const checkUser = await usersModel.aggregate([
    {
      $match: {
        _id: user,
        isLaunderer: true
      }
    },
    {
      $addFields: {
        location: {
          coordinates: coordinates
        }
      }
    },
    {
      $project: {
        _id: 1
      }
    }
  ]);

  if (checkUser.length > 0) {
    await usersModel.updateOne(
      { _id: user },
      { $set: { location: { coordinates: coordinates } } }
    );
  }

  return {
    success: true,
    data: checkUser[0]
  };
};

export const laundererOrderRequestsDecision = async (params) => {
  const {order, user, decision} = params;

  // 1. take orderId from params and check in ordersModel that it already doesn't have a launderer assigned
  // like this and is pending
  //  if decision 'accept' then{  
  //   checkOrder = await ordersModel.findOne({_id: order})
  //  if(!checkOrder.launderer && ) updateOrder = await ordersModel.update({launderer: user})
  
} 

export const updateLaundererLocation = async (params) => {
  const {coordinates, user} = params;
  const checkUser = await usersModel.findOne({_id: user, isLaunderer: true});

  if (checkUser) {
    if (coordinates) {
      checkUser.location = {
        coordinates: coordinates,
      };
    }
    await checkUser.save();
  }

  return{
    success: true,
    data: checkUser
  }
}


export const updateLaundererLocationAggregate = async (params) => {
  const { coordinates, user } = params;
  
  const checkUser = await usersModel.aggregate([
    {
      $match: {
        _id: user,
        isLaunderer: true
      }
    },
    {
      $addFields: {
        location: {
          coordinates: coordinates
        }
      }
    },
    {
      $project: {
        _id: 1
      }
    }
  ]);

  if (checkUser.length > 0) {
    await usersModel.updateOne(
      { _id: user },
      { $set: { location: { coordinates: coordinates } } }
    );
  }

  return {
    success: true,
    data: checkUser[0]
  };
};


export const nearbyPendingOrderRequests1 = async (params) => {
  const { user, coordinates, radius, zipCode } = params;

  // Get the launderer's declined order IDs
  const declinedOrderIds = await orderRequestDeclinesModel
    .find({ launderer: user })
    .distinct("order");

  // Find nearby pending order requests
  const nearbyOrders = await ordersModel.find({
    status: "pending", 
    _id: { $nin: declinedOrderIds }, // Exclude declined order IDs
    "location.coordinates": {
      $geoWithin: {
        $centerSphere: [coordinates, radius / 3963.2], // Convert miles to radians
      },
    },
  });

  return {
    success: true,
    data: nearbyOrders,
  };
};


export const nearbyPendingOrderRequests = async (params) => {
  const { user } = params;
  console.log("user : ", user)

  // Fetch the location of the user from the usersModel collection
  const findUser = await usersModel.findOne({_id: user})
  console.log("findUser Location : ", findUser.location.coordinates)

  const coordinates = findUser.location.coordinates

  // Define the radius (in meters) for the search
  const radius = 20 * 1609.34; // 20 miles converted to meters

  // Fetch the IDs of orders declined by the launderer
  const declinedOrderIds = await orderRequestDeclinesModel.find({ launderer: user }).distinct('order');

  // Find nearby orders within the specified radius and not declined by the launderer
  const nearbyOrders = await ordersModel.find({
    customLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        // $maxDistance: radius
      }
    },
    _id: { $nin: declinedOrderIds }
  }).populate('orderBags');
  

  return {
    success: true,
    data: nearbyOrders
  };
};


export const nearbyPendingOrderRequestsOld = async (params) => {
  const {user, coordinates, radius, zipCode} = params;
  const laundererIds = await launderersModel.find({}, 'userId');

  const userIds = laundererIds.map((launderer) => launderer.userId);

  const orderRequestDecline = await orderRequestDeclinesModel.findAll({
    
  })
  const nearbyOrders = await ordersModel.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: laundererLocation,
        },
        $maxDistance: 20000, // Maximum distance in meters (20 miles)
      },
    },
    status: 'pending', // Assuming 'status' is the field representing the order status
    customer: { $in: userIds }, // Filter orders from specific customers (launderers)
  }); 

  return {
    success: true,
    data: nearbyOrders,
  };
};



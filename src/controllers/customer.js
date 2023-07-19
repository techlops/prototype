import models from "../models/index.js";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import { isValidObjectId, Types } from "mongoose";
import SocketManager from "../utils/socket-manager.js";
import { getToken } from "../middlewares/authenticator.js";
import mongoose from "mongoose";
// file imports
import { APP_CONSTANTS } from "../configs/enums.js";

// destructuring assignments
const {
  ABOUT_US,
  TERMS_AND_CONDITIONS,
  PRIVACY_POLICY,
  LFL_BAG_PRICE,
  DELIVERY_FEE,
  APP_CHARGES_PERCENTAGE,
} = APP_CONSTANTS;

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
  customerLocationsModel,
  faqModel,
  customerComplaintsModel
} = models;

// add new locations
export const addCustomerLocation = async (params) => {
  const { user, zip, address, city, state, country, coordinates } = params;

  const customerLocation = await customerLocationsModel.create({
    customer: user,
    location: {
      coordinates: coordinates,
    },
    zip,
    address,
    city,
    state,
    country,
    isSelected: false,
  });

  return {
    success: true,
    zip,
    address,
    city,
    state,
    country,
  };
};

// get all locations of customer
export const listCustomerLocations = async (params) => {
  const { user } = params;
  let { limit, page } = params;
  if (!limit) limit = 10;
  if (!page) page = 1;
  if (page) page = page - 1;

  const skip = page * limit;

  const locationsPromise = customerLocationsModel
    .find(
      { customer: user },
      {
        country: 1,
        city: 1,
        zip: 1,
        state: 1,
        address: 1,
        location: 1,
        _id: 1,
      }
    )
    .skip(skip)
    .limit(limit);

  const countPromise = customerLocationsModel.countDocuments({
    customer: user,
  });

  const [locations, totalCount] = await Promise.all([
    locationsPromise,
    countPromise,
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    success: true,
    data: locations,
    totalPages,
    totalCount,
  };
};

//  customer location
export const editCustomerLocation = async (params) => {
  const {
    user,
    customerLocation,
    zip,
    address,
    city,
    state,
    country,
    coordinates,
  } = params;

  console.log("I AM HERE");

  const updatedLocation = await customerLocationsModel.findByIdAndUpdate(
    customerLocation,
    {
      zip,
      address,
      city,
      state,
      country,
      location: {
        coordinates: coordinates,
      },
    }
  );

  if (!updatedLocation) {
    throw new Error("Customer location not found ||| 400");
  }

  return {
    success: true,
    zip,
    address,
    city,
    state,
    country,
    location: {
      coordinates: coordinates,
    },
  };
};

// get customer location
export const getCustomerLocation = async (params) => {
  const { customerLocation } = params;

  const location = await customerLocationsModel.findById(customerLocation, {
    location: 1,
    address: 1,
    city: 1,
    state: 1,
    country: 1,
    zip: 1,
    isSelected: 1,
  });

  if (!location) {
    throw new Error("Customer location not found ||| 400");
  }

  return {
    success: true,
    data: location,
  };
};

// set as current customer location
export const setCurrentLocation = async (params) => {
  const { user, customerLocation } = params;

  // Set the selected customer location to isSelected: true
  const updatedLocation = await customerLocationsModel.findByIdAndUpdate(
    customerLocation,
    { $set: { isSelected: true } },
    { new: true }
  );

  if (!updatedLocation) {
    throw new Error("Customer location not found ||| 400");
  }

  // Update all customer locations for the user to isSelected: false (except the selected one)
  const otherLocations = await customerLocationsModel.updateMany(
    { _id: { $ne: customerLocation } },
    { $set: { isSelected: false } }
  );

  return {
    success: true,
  };
};

// delete customer location
export const deleteCustomerLocation = async (params) => {
  const { customerLocation } = params;

  const deletedLocation = await customerLocationsModel.findByIdAndDelete(
    customerLocation
  );

  if (!deletedLocation) {
    throw new Error("Customer location not found ||| 400");
  }

  return {
    success: true,
  };
};

// get bag sizes
export const getBagSizes = async (params) => {
  const bagSizes = await bagSizesModel.find();

  return {
    success: true,
    data: bagSizes,
  };
};

// total amount calculate before order placing
export const calculateTotalAmount = async (params) => {
  const { bagSizes, lflBagsCount } = params;

  console.log("params : ", params);

  const [lflBagAndDeliveryFee] = await constantsModel.aggregate([
    { $match: { title: { $in: [LFL_BAG_PRICE, DELIVERY_FEE] } } },
    {
      $group: {
        _id: "$title",
        value: { $first: "$value" },
      },
    },
    {
      $facet: {
        lflBagPrice: [
          { $match: { _id: LFL_BAG_PRICE } },
          { $project: { _id: 0, lflBagPrice: "$value" } },
        ],
        deliveryFeePrice: [
          { $match: { _id: DELIVERY_FEE } },
          { $project: { _id: 0, deliveryFeePrice: "$value" } },
        ],
      },
    },
    {
      $project: {
        lflBagPrice: { $arrayElemAt: ["$lflBagPrice.lflBagPrice", 0] },
        deliveryFeePrice: {
          $arrayElemAt: ["$deliveryFeePrice.deliveryFeePrice", 0],
        },
      },
    },
  ]);

  const lflBagPrice = lflBagAndDeliveryFee
    ? lflBagAndDeliveryFee.lflBagPrice
    : 0;
  const deliveryFeePrice = lflBagAndDeliveryFee
    ? lflBagAndDeliveryFee.deliveryFeePrice
    : 0;

  console.log("lfl bag price : ", lflBagPrice);
  console.log("deliveryFeePrice : ", deliveryFeePrice);

  let finalPrice = 0;

  for (let i = 0; i < bagSizes.length; i++) {
    const bagId = bagSizes[i];

    // Fetch bag price from the bagsModel for the current ID in the bags array
    const bagPrice = await bagSizesModel.findOne({ _id: bagId });

    if (bagPrice) {
      const price = bagPrice.price;
      finalPrice += price;
    }
  }

  const lflBagsPrice = lflBagPrice * lflBagsCount;

  const totalPriceBeforeDeliveryFee = finalPrice + lflBagsPrice;

  const finalAmount = totalPriceBeforeDeliveryFee + deliveryFeePrice;

  return {
    success: true,
    deliveryFee: deliveryFeePrice,
    totalPriceBeforeDelivery: totalPriceBeforeDeliveryFee,
    totalAmount: finalAmount,
  };
};

// place order request
export const requestServiceOrder = async (params) => {
  const {
    bags,
    coordinates,
    lflBagsCount,
    user,
    zip,
    address,
    city,
    state,
    country,
    bagImages,
    time,
  } = params;

  const bagSizes = [];

  // Iterate over the bags and bagImages simultaneously
  for (let i = 0; i < bags.length; i++) {
    const bag = bags[i];
    const bagImagePaths = bagImages[i];

    // Create a new orderBagsModel document
    const orderBag = await orderBagsModel.create({
      images: bagImagePaths.map((path) => ({ path })),
      temperatureSettings: bag.temperatureSettings,
      spinSettings: bag.spinSettings,
      bagSize: bag.bagSize,
    });

    // Store the orderBag._id in the bags array of the ordersModel document
    bags[i] = orderBag._id;

    // pushing bagsize values into an array to use later to calculat total amount
    bagSizes.push(bag.bagSize);
  }

  const calculateTotalParams = {
    bagSizes: bagSizes,
    lflBagsCount: lflBagsCount,
  };

  // Call calculateTotalAmount function using the params object
  const totalAmountResponse = await calculateTotalAmount(calculateTotalParams);

  const totalAmount = totalAmountResponse.totalAmount;
  const deliveryFee = totalAmountResponse.deliveryFee;

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
  const radius = 20;

  const usersWithinRadius = await usersModel.find(
    {
      customLocation: {
        $geoWithin: {
          $centerSphere: [coordinates, radius / 3963.2], // radius in miles divided by the Earth's radius in miles (3963.2 miles)
        },
      },
      isLaunderer: true,
    },
    { _id: 1 } // Projection to return only the _id field
  );

  for (const user of usersWithinRadius) {
    console.log("launderers within 20 miles ", user);
  }

  return {
    success: true,
  };
};

// track your order
export const trackOrder = async (params) => {
  const { order, user } = params;
    // Find the order and fetch the status
    const trackedOrder = await ordersModel.findById(order, "status");

    if (!trackedOrder) {
      throw new Error("Order not found ||| 400");
    }

    return {
      success: true,
      data: trackedOrder.status,
    };
};

// cancel order
export const cancelOrder = async (params) => {
  const { user, order } = params;

  // Find the order and update the status to 'cancelled'
  const cancelledOrder = await ordersModel.findOneAndUpdate(
    {
      _id: order,
      status: { $nin: ["completed", "cancelled"] }
    },
    { $set: { status: "cancelled" } },
    { new: true }
  );
  

  // Check if the order has a launderer
  if (!cancelledOrder) {
    throw new Error ("Cannot cancel a completed or already cancelled order ||| 403")
  }

  return {
    success: true,
  };
};

// give feedback to launderer on order
export const feedbackSubmit = async (params) => {
  const { order, user, tip, review, rating } = params;

  // Check if the order substatus is 'pending'
  const checkOrder = await ordersModel.findOne({
    _id: order,
    subStatus: "work_submitted",
  });

  if (!checkOrder) {
    throw new Error(
      "Invalid order or substatus has not be updated to 'work_submitted' ||| 403"
    );
  }

  // Update the order status to 'confirmed' and assign the launderer
  const updatedOrder = await ordersModel.findByIdAndUpdate(order, {
    subStatus: "feedback_submitted",
    status: "completed",
    customerReview: review,
    customerRating: rating,
    isTipped: true,
    tipAmount: tip,
  });

  const orderLog = new orderLogsModel({
    order: order,
    action: "feedback_submitted",
    actor: user,
    actorType: "customer",
    createdAt: new Date(),
  });

  await orderLog.save();

  return {
    success: true,
    customerReview: review,
    customerRating: rating,
  };
};

export const faq = async (params) => {
  const faq = await faqModel.find({}, { question: 1, answer: 1, _id: 0 });

  return {
    success: true,
    data: faq,
  };
};


export const reportOrder = async (params) => {

  const{order, user, complain} = params;

  const report = await customerComplaintsModel.create({
    customer: user,
    order: order,
    problem: complain
  });

  return {
    success: true,
    problem: complain
  };
};

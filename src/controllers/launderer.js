// module imports
import { isValidObjectId, mongoose } from "mongoose";

// file imports
import models from "../models/index.js";
import FilesDeleter from "../utils/files-deleter.js";
import { USER_TYPES } from "../configs/enums.js";

// destructuring assignments
const { ADMIN } = USER_TYPES;
const {
  usersModel,
  customersModel,
  adminsModel,
  launderersModel,
  ordersModel,
} = models;

export const getUser = async (params) => {
  const { user } = params;
  const query = {};
  if (user) query._id = user;
  if (Object.keys(query).length === 0) query._id = null;

  let userExists = await usersModel
    .findOne(query)
    .select("-createdAt -updatedAt -__v -fcms");
  if (userExists) userExists = await userExists.populate(userExists.type);
  return {
    success: !!userExists,
    data: userExists,
  };
};

export const getUserDetails = async (id) => {
  console.log("hellooooooooooooooooooo");
  const objectId = mongoose.Types.ObjectId(id);

  console.log("iddddddddddddddd", typeof objectId, objectId);
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

// export const getLaundererReviews = async (id) => {
//   console.log("looking for reviews")
//   const objectId = mongoose.Types.ObjectId(id);
//   const findReviews = await ordersModel.findById(objectId)
//   console.log(objectId)
//   console.log(findReviews)

//   return findReviews;
// };

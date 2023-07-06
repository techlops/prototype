// module imports
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


import { isValidObjectId, Types } from "mongoose";

const { ObjectId } = Types;

// file imports
import { asyncHandler } from "./async-handler.js";
import models from "../models/index.js";
import { USER_STATUSES, USER_TYPES } from "../configs/enums.js";

// destructuring assignments
const { JWT_SECRET } = process.env;
const { usersModel } = models;
const { ACTIVE, DELETED } = USER_STATUSES;
const { CUSTOMER, ADMIN, SUPER_ADMIN } = USER_TYPES;

/**
 * @description Get JWT token
 * @param {String} _id user id
 * @param {String} phone user phone number
 * @param {String} otp OTP code
 * @param {String} shouldValidateOTP OTP validation check
 * @param {string | boolean } variable any variable
 * @returns {Object} JWT token
 */
export const getToken = function (user, otp) {


  return jwt.sign({ id: user, otp: otp }, process.env.JWT_SECRET);
};

export const verifyToken = async (
  req,
  res,
  next
  // shouldReturnUserOnFailure = false
) => {
  try {
    let token = req.headers.authorization;
    if (token) {
      token = token.split(" ")[1];
      let checkToken = jwt.verify(token, JWT_SECRET);

      const user = checkToken.id;

      const userExists = await usersModel.findOne({_id: user });
      if (!userExists) {
        next(new Error("Invalid token!|||403"));
      } else {
        req.user = user;
        return next();
      }
    }
    else if(!token){
      return next(new Error("No authentication token!|||401"));
    }

    // const token =
    //   (req.headers.authorization &&
    //     req.headers.authorization.split("Bearer")[1]) ||
    //   (req.signedCookies && req.signedCookies.jwt) ||
    //   (req.cookies && req.cookies.jwt);
    // if (token) {
    //   const verificationObject = jwt.verify(token.trim(), JWT_SECRET);
    //   req.user = verificationObject.id
    //   console.log("hereeeee", verificationObject.id);

    //   if (verificationObject.shouldValidateOTP) {
    //     req.user = verificationObject;
    //     return next();
    //   }
    //   const user = await usersModel
    //     .findOne({ _id: verificationObject._id })
    //     .select("-createdAt -updatedAt -__v -fcms");
    //   if (user) {
    //     if (user.status === DELETED)
    //       next(new Error("User account deleted!|||403"));
    //     req.user = user;
    //     return next();
    //   }
    // }
    // if (shouldReturnUserOnFailure) {
    //   req.user = null;
    //   return next();
    // }
    // next(new Error("Invalid token!|||403"));
  } catch (error) {
    return next(new Error("Unauthorized!|||401"));
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { otp } = req?.user;
    const { code } = req.body;
    if (Number(code) === Number(otp)) next();
    else return next(new Error("Invalid Code!|||400"));
  } catch (error) {
    return next(error);
  }
};

export const verifyAdmin = (req, res, next) => {
  if (
    (req?.user?.type === ADMIN || req?.user?.type === SUPER_ADMIN) &&
    req?.user?.status === ACTIVE
  )
    next();
  else return next(new Error("Unauthorized as admin!|||403"));
};

export const verifySuperAdmin = (req, res, next) => {
  if (req?.user?.type === SUPER_ADMIN && req?.user?.status === ACTIVE) next();
  else return next(new Error("Unauthorized as super-admin!|||403"));
};

export const verifyCustomer = (req, res, next) => {
  if (req?.user?.type === CUSTOMER && req?.user?.status === ACTIVE) next();
  else return next(new Error("Unauthorized as customer!|||403"));
};

export const verifyUser = (req, res, next) => {
  if (req?.user && req?.user?.status === ACTIVE) next();
  else return next(new Error("Unauthorized as user!|||403"));
};

export const verifyUserToken = async (req, res, next) => {
  if (req?.user?._id) next();
  else return next(new Error("Invalid user token!|||400"));
};

export const checkUserPhoneExists = asyncHandler(async (req, res, next) => {
  const userExists = await usersModel.exists({ phone: req.body.phone });
  if (userExists) next();
  else next(new Error("User not found!|||404"));
});

// next(new Error("Invalid token!|||403"));

import models from "../models/index.js";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import { isValidObjectId, Types } from "mongoose";
import { getUserDetails } from "./launderer.js";

const { ObjectId } = Types;

// import  TwilioManager from "../utils/twilio-manager.js";

// importing models
const { usersModel, launderersModel } = models;

export const registerUser = async (params) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    image,
    coordinates,
    address
  } = params;
  const userExists = await usersModel.findOne({ email });

  if (userExists) {
    return {
      success: false,
      message: "Email already exists",
    };
  }

  // Encrypt the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate a random OTP
  const otp = otpGenerator.generate(6, {
    digits: true,
    upperCase: false,
    specialChars: false,
  });

  // Create a new user
  const newUser = {
    email,
    password: hashedPassword,
    firstName,
    lastName,
    phone,
    otp,
    address,
    isCustomer: true,
  };

  if (image) {
    newUser.image = {
      path: image,
    };
  }

  if (coordinates) {
    console.log(coordinates);
    newUser.location = {
      coordinates: coordinates,
    };
  }

  // Save new user to the database
  const savedUser = await usersModel.create(newUser);

  return {
    success: true,
    data: {
      user: { _id: savedUser._id, ...savedUser._doc },
    },
  };
};

export const registerLaunderer = async (params) => {
  const {
    email,
    password,
    phone,
    firstName,
    lastName,
    service,
    image,
    coordinates,
    address
  } = params;

  const userExists = await usersModel.findOne({ email });

  if (userExists) {
    return {
      success: false,
      message: "Email already exists",
    };
  }

    // Encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a random OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCase: false,
      specialChars: false,
    });

  // Create a new user
  const newUser = {
    email,
    password: hashedPassword,
    firstName,
    lastName,
    phone,
    otp,
    address,
    isLaunderer: true,
  };

  if (image) {
    newUser.image = {
      path: image,
    };
  }

  if (coordinates) {
    console.log(coordinates);
    newUser.location = {
      coordinates: coordinates,
    };
  }

  const savedUser = await usersModel.create(newUser);

  const laundererObj = {};

  if (savedUser._id) {
    laundererObj.user = savedUser._id;
  }

  const addLaunderer = await launderersModel.create(laundererObj);

  console.log(addLaunderer);

  return {
    addLaunderer,
  };
};

export const sendAgainOTP = async (params) => {
  // 1. check is userId exists
  // 2. generate a new OTP and update that in the database of that user
  // 3. send that new OTP in response

  const { user } = params;

  const newOTP = otpGenerator.generate(6, {
    digits: true,
    upperCase: false,
    specialChars: false,
  });

  const updatedUser = await usersModel.findOneAndUpdate(
    { _id: user },
    { $set: { otp: newOTP } },
    { new: true, projection: { otp: 1 } }
  );

  return {
    success: true,
    updatedUser,
  };
};

export const login = async (params) => {
  const { email, password } = params;

  const user = await usersModel.findOne({ email });

  if (!user) {
    return {
      success: false,
      message: "User not found",
    };
  }

  // Verify the password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return {
      success: false,
      message: "Invalid password",
    };
  }

  // Password is valid, return user data
  return {
    success: true,
    data: user,
  };
};

export const verifyOTP = async (params) => {
  // 1. recieve OTP and userId from frontend
  // 2. check if userId exists
  // 3. check if OTP from frontend matches OTP stored in the document of that user
  // return success if matches, else return fals with message "invalid OTP"

  const { otp, user } = params;

  const userId = ObjectId(user);

  console.log(user);
  console.log(userId);

  const checkUser = await usersModel.findOne({ _id: user });

  if (!checkUser) {
    return {
      success: false,
      message: "User not found",
    };
  }

  if (checkUser.otp !== otp) {
    return {
      success: false,
      message: "Invalid OTP",
    };
  }

  return {
    success: true,
    message: "OTP verified successfully",
  };
};

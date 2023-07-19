import models from "../models/index.js";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import { isValidObjectId, Types } from "mongoose";
// import { getUserDetails } from "./launderer.js";
import { getToken } from "../middlewares/authenticator.js";

const { ObjectId } = Types;

// import  TwilioManager from "../utils/twilio-manager.js";

// importing models
const { usersModel, launderersModel } = models;

// CUSTOMER

export const basicRegistrationCustomer = async (params) => {
  const { email, password } = params;
  const userExists = await usersModel.findOne({ email });
  if (userExists) {
    throw new Error("User already exists ||| 400");
  }

  // Encrypt the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    email,
    password: hashedPassword,
    isCustomer: true,
    authStepsCompleted: "basic_registration",
  };

  // Save new user to the database
  const savedUser = await usersModel.create(newUser);

  const user = savedUser._id;
  const token = getToken(user);

  savedUser.token = token;
  await savedUser.save();

  return {
    success: true,
    data: {
      user: savedUser.email,
    },
    token: token,
  };
};

export const profileCompletionCustomer = async (params) => {
  const {
    user,
    firstName,
    lastName,
    phone,
    phoneCode,
    image,
    coordinates,
    address,
  } = params;

  const name = `${firstName} ${lastName}`;

  // Generate a random OTP
  const otp = otpGenerator.generate(4, {
    digits: true,
    upperCase: false,
    specialChars: false,
    alphabets: false,
  });

  const updateObj = {
    authStepsCompleted: "profile_completion",
    firstName,
    lastName,
    name,
    phoneCode,
    phone,
    otp,
    address,
    isCustomer: true,
  };

  if (image) {
    updateObj.image = {
      path: image,
    };
  }

  if (coordinates) {
    console.log(coordinates);
    updateObj.location = {
      coordinates: coordinates,
    };
  }

  const profileUpdate = await usersModel.findByIdAndUpdate(user, updateObj, {
    new: true,
  });

  console.log("OTP  ------------------------> : ", otp);

  return {
    success: true,
  };
};

export const phoneVerificationCustomer = async (params) => {
  const { otp, user } = params;

  const existingUser = await usersModel.findById(user);

  if (existingUser.otp !== otp) {
    throw new Error("Invalid OTP ||| 400");
  }

  existingUser.isPhoneVerified = true;
  existingUser.authStepsCompleted = "phone_verification";

  const updatedUser = await existingUser.save();

  return {
    success: true,
    message: "OTP verification successful",
  };
};

// LAUNDERER

export const basicRegistrationLaunderer = async (params) => {
  const { email, password } = params;
  const userExists = await usersModel.findOne({ email });
  if (userExists) {
    throw new Error("User already exists ||| 400");
  }

  // Encrypt the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    email,
    password: hashedPassword,
    isLaunderer: true,
    authStepsCompleted: "basic_registration",
  };

  // Save new user to the database
  const savedUser = await usersModel.create(newUser);

  const user = savedUser._id;
  const token = getToken(user);

  savedUser.token = token;
  await savedUser.save();

  // Create a launderer using the saved user's _id
  const createLaunderer = await launderersModel.create({ user: user });

  return {
    success: true,
    data: {
      user: savedUser.email,
    },
    token: token,
  };
};

export const profileCompletionLaunderer = async (params) => {
  const {
    user,
    firstName,
    lastName,
    phone,
    phoneCode,
    image,
    coordinates,
    address,
  } = params;

  const name = `${firstName} ${lastName}`;


  // Generate a random OTP
  const otp = otpGenerator.generate(4, {
    digits: true,
    upperCase: false,
    specialChars: false,
    alphabets: false,
  });

  // console.log("params : ", params);

  const updateObj = {
    authStepsCompleted: "profile_completion",
    firstName,
    lastName,
    name,
    phoneCode,
    phone,
    otp,
    address,
    isLaunderer: true,
  };

  if (image) {
    updateObj.image = {
      path: image,
    };
  }

  if (coordinates) {
    console.log(coordinates);
    updateObj.location = {
      coordinates: coordinates,
    };
  }

  const profileUpdate = await usersModel.findByIdAndUpdate(user, updateObj, {
    new: true,
  });

  console.log("OTP ----------------------->    ", otp);

  return {
    success: true,
  };
};

export const phoneVerificationLaunderer = async (params) => {
  const { otp, user } = params;

  console.log("params : ", params);

  const existingUser = await usersModel.findById(user);

  console.log("existingUser : ", existingUser);

  if (existingUser.otp !== otp) {
    throw new Error("Invalid OTP ||| 400");
  }

  existingUser.isPhoneVerified = true;
  existingUser.authStepsCompleted = "phone_verification";

  const updatedUser = await existingUser.save();

  return {
    success: true,
    message: "OTP verification successful",
  };
};

export const locationAddition = async (params) => {
  const { user, coordinates, state, city, country, zip, address } = params;

  const updateObj = {
    authStepsCompleted: "location_addition",
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

  const profileUpdate = await usersModel.findByIdAndUpdate(user, updateObj, {
    new: true,
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

export const identityVerification = async (params) => {
  const { drivingLicense, authorizedId, user } = params;

  const laundererObj = {};

  if (drivingLicense) {
    laundererObj.drivingLicense = {
      path: drivingLicense,
    };
  } else {
    throw new Error("please upload driver's license ||| 400");
  }

  if (authorizedId) {
    laundererObj.authorisedID = {
      path: authorizedId,
    };
  } else {
    throw new Error("please upload government authorized ID ||| 400");
  }

  console.log("laundererObj : ", laundererObj);

  const launderer = await launderersModel.findOne({ user: user });

  if (!launderer) {
    throw new Error("Launderer does not exist ||| 400");
  }

  const updatedLaunderer = await launderersModel.findOneAndUpdate(
    { user: user },
    laundererObj,
    { new: true }
  );

  console.log("updatedLaunderer: ", updatedLaunderer);

  const updateObj = {
    authStepsCompleted: "identity_verification",
  };

  const profileUpdate = await usersModel.findByIdAndUpdate(user, updateObj, {
    new: true,
  });

  return {
    success: true,
  };
};

export const serviceAreaSelection = async (params) => {
  const { user, zip, coordinates, radius } = params;

  // Update the laundererModel
  const updatedLaunderer = await launderersModel.findOneAndUpdate(
    { user: user },
    { zip: zip, coordinates: coordinates, radius: radius },
    { new: true }
  );

  // Update the usersModel
  const updatedUser = await usersModel.findOneAndUpdate(
    { _id: user },
    { authStepsCompleted: "service_areas_selection" },
    { new: true }
  );

  return {
    success: true,
    radius: radius,
    coordinates: coordinates,
    zip: zip,
  };
};

export const w9FormSubmission = async (params) => {
  const { user, image } = params;

  const launderer = await launderersModel.findOne({ user: user });

  if (!launderer) {
    throw new Error("Launderer does not exist ||| 400");
  }

  const laundererObj = {};

  if (image) {
    laundererObj.w9Form = {
      path: image,
    };
  } else {
    throw new Error("Please upload filled w9 form ||| 400");
  }

  console.log("laundererObj : ", laundererObj);

  const updatedLaunderer = await launderersModel.findOneAndUpdate(
    { user: user },
    { w9Form: image },
    { new: true }
  );

  console.log("updatedLaunderer : ", updatedLaunderer);

  const updateObj = {
    authStepsCompleted: "w9_form_submission",
  };

  const profileUpdate = await usersModel.findByIdAndUpdate(user, updateObj, {
    new: true,
  });

  return {
    success: true,
  };
};

export const login = async (params) => {
  const { email, password } = params;

  const user = await usersModel.findOne({ email }).select("+password");

  console.log("USER : ", user);

  if (!user) {
    throw new Error("User doesn't exist ||| 400");
  }

  // Verify the password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log(password, user.password, isPasswordValid);

  if (!isPasswordValid) {
    throw new Error("Incorrect password ||| 400");
  }

  // Password is valid, return user data
  return {
    success: true,
    token: user.token,
  };
};

export const sendAgainOTP = async (params) => {
  const { user } = params;

  const existingUser = await usersModel.findById(user);

  const otp = otpGenerator.generate(4, {
    digits: true,
    upperCase: false,
    specialChars: false,
    alphabets: false,
  });

  // Update the OTP in the user object
  existingUser.otp = otp;

  // Save the updated user object to the database
  const updatedUser = await existingUser.save();

  console.log("updatedUser otp --------------> ", otp);

  return {
    success: true,
  };
};

export const verifyOTP = async (params) => {
  // 1. recieve OTP and from frontend
  // 2. check if userId exists
  // 3. check if OTP from frontend matches OTP stored in the document of that user
  // return success if matches, else return fals with message "invalid OTP"

  const { otp, user } = params;

  const userId = ObjectId(user);

  console.log(user);

  const checkUser = await usersModel.findOne({ _id: user });

  if (!checkUser) {
    throw new Error("User not found ||| 400");
  }

  if (checkUser.otp !== otp) {
    throw new Error("Invalid OTP ||| 400");
  }

  return {
    success: true,
    message: "OTP verified successfully",
  };
};

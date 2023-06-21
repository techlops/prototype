import models from "../models/index.js";
import bcrypt from "bcryptjs";
import  TwilioManager from "../utils/twilio-manager.js";

// importing models
const { usersModel } = models;


export const registerUser = async (params) => {
  const { email, password, name, phone } = params;
  const userExists = await usersModel.findOne({ email });

  if (userExists) {
    return {
      success: false,
      message: 'Email already exists',
    };
  }

  // Encrypt the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new user
  const newUser = {
    email,
    password: hashedPassword,
    name,
    phone
  };

  // Save new user to the database
  const savedUser = await usersModel.create(newUser);

  return {
    success: true,
    data: savedUser,
  };
};

export const registerLaunderer = async (params) => {
  const {email, password, phone, location, firstName, lastName, service} = params

  const userExists = await usersModel.findOne({ email });

  if (userExists) {
    return {
      success: false,
      message: 'Email already exists',
    };
  }

  const newUser = {
    email,
    password,
    firstName,
    lastName,
    phone,
    location
  };

  const savedUser = await usersModel.create(newUser);

  const laundererObj = {};

  if(savedUser._id){
    laundererObj.user = savedUser._id
  }
  

  const addLaunderer = await launderersModel.create(laundererObj);

  console.log(addLaunderer);

  return {
    addLaunderer
  }
}

export const login = async (params) => {
  const { email, password } = params;

  const user = await usersModel.findOne({ email });

  if (!user) {
    return {
      success: false,
      message: 'User not found',
    };
  }

  // Verify the password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return {
      success: false,
      message: 'Invalid password',
    };
  }

  // Password is valid, return user data
  return {
    success: true,
    data: user,
  };
};

export const verifyOTP = (inputOTP, expectedOTP) => {
  if (inputOTP === expectedOTP){
    return {
      success: true
    }
  }
  else{
    return{
      success: false,
      message: 'Ivalid OTP'
    }
  }
};




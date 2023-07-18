import express from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import * as authController from "../controllers/auth.js";
import directories from "../configs/directories.js";
import { upload } from "../middlewares/uploader.js";
import { verifyToken } from "../middlewares/authenticator.js";
import path from "path";

const { IMAGES_DIRECTORY } = directories;

const router = express.Router();

// GENERAL AUTH

// login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const args = {
      email,
      password,
    };
    const response = await authController.login(args);
    res.json(response);
  })
);

// verifyOTP
router.post(
  "/verifyOTP",
  verifyToken,
  asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const { user } = req.query;
    const args = { user, otp };
    const response = await authController.verifyOTP(args);
    res.json(response);
  })
);

// send OTP again
router.get(
  "/sendAgainOTP",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const args = { user };
    const response = await authController.sendAgainOTP(args);
    res.json(response);
  })
);

// LAUNDERER REGISTRATION

// basic registration
router.post(
  "/launderer/basic-registration",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const args = {
      email,
      password,
    };

    const response = await authController.basicRegistrationLaunderer(args);
    res.json(response);
  })
);

// profile completion
router.put(
  "/launderer/profile-completion",
  verifyToken,
  upload(IMAGES_DIRECTORY).single("image"),
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { firstName, lastName, phone, phoneCode, coordinates, address } =
      req.body;

    console.log("req.user in routes : ", req.user);
    console.log("user in routes : ", user);

    // Get the uploaded image path
    const imagePath =
    req.file && req.file.path ? path.basename(req.file.path) : null;

    const args = {
      firstName,
      lastName,
      phone,
      phoneCode,
      image: imagePath, // Assign the image path to the "image" field
      coordinates,
      address,
      user,
    };

    const response = await authController.profileCompletionLaunderer(args);
    res.json(response);
  })
);

// phone verification
router.patch(
  "/launderer/phone-verification",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { otp } = req.body;

    console.log("req.body in routes : ", req.body);
    console.log("otp in routes : ", otp);

    const args = {
      otp,
      user,
    };

    const response = await authController.phoneVerificationLaunderer(args);
    res.json(response);
  })
);

// location addition
router.post(
  "/launderer/location-addition",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { country, state, city, zip, coordinates, address } = req.body;

    const args = {
      country,
      state,
      city,
      zip,
      coordinates,
      address,
      user,
    };

    const response = await authController.locationAddition(args);
    res.json(response);
  })
);

// identity verification
router.put(
  "/launderer/identity-verification",
  verifyToken,
  upload(IMAGES_DIRECTORY).fields([
    { name: "authorizedId", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
  ]),
  asyncHandler(async (req, res) => {
    const user = req.user;

    // Get the uploaded files
    const authorizedIdFile = req.files["authorizedId"]
      ? req.files["authorizedId"][0]
      : null;
    const drivingLicenseFile = req.files["drivingLicense"]
      ? req.files["drivingLicense"][0]
      : null;

    // Store the filenames without the absolute path
    const authorizedIdFilename = authorizedIdFile
      ? authorizedIdFile.filename
      : null;
    const drivingLicenseFilename = drivingLicenseFile
      ? drivingLicenseFile.filename
      : null;

    const args = {
      user,
      authorizedId: authorizedIdFilename,
      drivingLicense: drivingLicenseFilename,
    };

    console.log(args);

    const response = await authController.identityVerification(args);

    res.json(response);
  })
);

// services areas selection
router.post(
  "/launderer/service-areas-selection",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { zip, coordinates, radius } = req.body;

    const args = {
      user,
      zip,
      coordinates,
      radius,
    };

    const response = await authController.serviceAreaSelection(args);
    res.json(response);
  })
);

// w9 form
router.post(
  "/launderer/w9-form",
  verifyToken,
  upload(IMAGES_DIRECTORY).single("image"),
  asyncHandler(async (req, res) => {
    const user = req.user;

    // Get the uploaded image path
    const imagePath =
      req.file && req.file.path ? path.basename(req.file.path) : null;

    const args = {
      user,
      image: imagePath, // Assign the image path to the "image" field
    };

    console.log("image : ", args);

    const response = await authController.w9FormSubmission(args);
    res.json(response);
  })
);

// CUSTOMER REGISTRATION

// basic registration
router.post(
  "/customer/basic-registration",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const args = {
      email,
      password,
    };

    const response = await authController.basicRegistrationCustomer(args);
    res.json(response);
  })
);

// profile completion launderer
router.put(
  "/customer/profile-completion",
  verifyToken,
  upload(IMAGES_DIRECTORY).single("image"),
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { firstName, lastName, phone, phoneCode, coordinates, address } =
      req.body;

    console.log("req.user in routes : ", req.user);
    console.log("user in routes : ", user);

    // Get the uploaded image path
    const imagePath =
    req.file && req.file.path ? path.basename(req.file.path) : null;

    const args = {
      firstName,
      lastName,
      phone,
      phoneCode,
      image: imagePath, // Assign the image path to the "image" field
      coordinates,
      address,
      user,
    };

    const response = await authController.profileCompletionCustomer(args);
    res.json(response);
  })
);

// phone verification
router.patch(
  "/customer/phone-verification",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const { otp } = req.body;

    console.log("req.body in routes : ", req.body);
    console.log("otp in routes : ", otp);

    const args = {
      otp,
      user,
    };

    const response = await authController.phoneVerificationCustomer(args);
    res.json(response);
  })
);

export default router;

import express from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import * as authController from "../controllers/auth.js";

const router = express.Router();

router.post(
  "/registerUser",
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, phone } = req.body;
    const args = {
      email,
      password,
      firstName,
      lastName, 
      phone 
    };
    const response = await authController.registerUser(args);
    res.json(response);
  })
  )

  router.post(
    "/registerLaunderer",
    asyncHandler(async (req, res) => {
      const { email, password, firstName, lastName, phone, location } = req.body;
      const args = {
        email,
        password,
        firstName,
        lastName, 
        phone,
        location
      };
      const response = await authController.registerLaunderer(args);
      res.json(response);
    })
    )
    
  router.post(
    "/login",
    asyncHandler( async (req, res) => {
      const {email, password} = req.body;
      const args = {
        email,
        password
      };
      const response = await authController.login(args);
      res.json(response);
    })
  )

  export default router;
import express from "express";
import { asyncHandler } from "./async-handler.js";
import { getUserDetails } from "../controllers/userController.js";

const router = express.Router();

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userDetails = await getUserDetails(id);
    res.json(userDetails);
  })
);

export default router;

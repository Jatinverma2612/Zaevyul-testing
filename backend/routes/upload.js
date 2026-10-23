import express from "express";
import { uploadImage } from "../controllers/upload.js";

const router = express.Router();

// Upload image endpoint
router.post("/", uploadImage);

export default router;

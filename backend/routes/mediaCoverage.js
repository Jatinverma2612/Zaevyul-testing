import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getMediaCoverages,
  getMediaCoverageById,
  createMediaCoverage,
  updateMediaCoverage,
  deleteMediaCoverage,
} from "../controllers/mediaCoverage.js";

const router = express.Router();

// GET /api/admin/media-coverage
router.get("/", requireAuth, getMediaCoverages);

// GET /api/admin/media-coverage/:id
router.get("/:id", requireAuth, getMediaCoverageById);

// POST /api/admin/media-coverage
router.post("/", requireAuth, createMediaCoverage);

// PUT /api/admin/media-coverage/:id
router.put("/:id", requireAuth, updateMediaCoverage);

// DELETE /api/admin/media-coverage/:id
router.delete("/:id", requireAuth, deleteMediaCoverage);

export default router;

import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getTaxRules,
  getTaxRuleById,
  createTaxRule,
  updateTaxRule,
  deleteTaxRule,
} from "../controllers/taxRules.js";

const router = express.Router();

// All tax rule routes require admin authentication and authorization
router.use(requireAuth);
router.use(requireRole(["super_admin", "admin"]));

router.get("/", getTaxRules);
router.get("/:id", getTaxRuleById);
router.post("/", createTaxRule);
router.put("/:id", updateTaxRule);
router.delete("/:id", deleteTaxRule);

export default router;

import express from "express";
import {
  requireCustomerAuth,
  optionalCustomerAuth,
} from "../middleware/customerAuth.js";
import {
  getCustomerOrders,
  placeCustomerOrder,
  cancelCustomerOrder,
  calculateTaxForCart,
  getCustomerOrderById,
  requestCustomerOrderReturn,
  downloadCustomerInvoice,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/customerOrders.js";

const router = express.Router();

// Customer order routes — require requireCustomerAuth
router.get("/", requireCustomerAuth, getCustomerOrders);
router.get("/:id/invoice", optionalCustomerAuth, downloadCustomerInvoice);
router.get("/:id", getCustomerOrderById);
router.post("/", requireCustomerAuth, placeCustomerOrder);
router.post("/create-razorpay-order", optionalCustomerAuth, createRazorpayOrder);
router.post("/verify-razorpay-payment", optionalCustomerAuth, verifyRazorpayPayment);
router.post("/calculate-tax", optionalCustomerAuth, calculateTaxForCart);
router.post("/:id/cancel", optionalCustomerAuth, cancelCustomerOrder);
router.post("/:id/return", optionalCustomerAuth, requestCustomerOrderReturn);

export default router;

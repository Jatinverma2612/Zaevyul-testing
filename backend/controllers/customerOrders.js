import crypto from "crypto";
import Razorpay from "razorpay";
import Order from "../model/Order.js";
import Customer from "../model/Customer.js";
import CustomerUser from "../model/CustomerUser.js";
import Product from "../model/Product.js";
import Coupon from "../model/Coupon.js";
import Settings from "../model/Settings.js";
import { sendOrderConfirmationEmail } from "../services/emailService.js";
import { normalizeAddressForResponse } from "../utils/addressValidation.js";
import { calculateTax } from "../services/taxService.js";
import { generateInvoiceForOrder, getInvoicePDFPath } from "../services/invoiceService.js";

/**
 * GET /api/customer/orders
 * Returns order history for the logged-in customer (matched by email or phone).
 */
export const getCustomerOrders = async (req, res) => {
  try {
    const email = req.customerUser?.email;
    const phone = req.customerUser?.phone;
    if (!email && !phone) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const query = [];
    if (email) {
      query.push({ email: email.toLowerCase().trim() });
    }
    if (phone) {
      query.push({ phone: phone.trim() });
      const effEmail = `${phone.replace(/\D/g, "")}@zaevyul.customer`;
      query.push({ email: effEmail });
    }

    // Find all matching Customer documents
    const customerObjs = await Customer.find({ $or: query }).select('_id');
    if (!customerObjs || customerObjs.length === 0) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const customerIds = customerObjs.map(c => c._id);
    const orders = await Order.find({ customer: { $in: customerIds } })
      .populate("items.product", "_id name slug images")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("[customerOrders] getCustomerOrders error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch orders." });
  }
};

export const getCustomerOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    let order;
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id)
        .populate("customer")
        .populate("items.product", "_id name slug images basePrice discountPrice");
    }
    if (!order && id) {
      order = await Order.findOne({ orderNumber: id })
        .populate("customer")
        .populate("items.product", "_id name slug images basePrice discountPrice");
    }
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Fetch order detail error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
/**
 * POST /api/customer/orders
 * Creates a new order for the customer.
 * Fixes: AUD-001 (backend price recalculation), AUD-004 (atomic stock & rollback), AUD-020 (phone auth support), AUD-023 (email dispatch), AUD-024 (secure order numbers), AUD-014 (sync CustomerUser & Customer).
 */
export const placeCustomerOrder = async (req, res) => {
  const {
    items,
    couponCode,
    paymentMethod,
    shippingAddress,
    shippingAddressId,
    notes,
  } = req.body;

  if (!items || items.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Cart items are required." });
  }

  let resolvedShippingAddress = shippingAddress;
  if (shippingAddressId) {
    const savedAddress = req.customerUser.addresses.id(shippingAddressId);
    if (!savedAddress) {
      return res
        .status(404)
        .json({ success: false, message: "Saved address not found." });
    }
    resolvedShippingAddress = normalizeAddressForResponse(savedAddress);
  }

  if (!resolvedShippingAddress) {
    return res
      .status(400)
      .json({ success: false, message: "Shipping address is required." });
  }

  // Extract contact details — support both email and phone authenticated users (AUD-020)
  const email = req.customerUser?.email || req.body.email || null;
  const phone =
    req.customerUser?.phone ||
    req.body.phone ||
    resolvedShippingAddress.phone ||
    "";
  const name =
    req.customerUser?.name ||
    req.body.name ||
    (email ? email.split("@")[0] : `Customer-${phone}`);

  if (!email && !phone) {
    return res.status(400).json({
      success: false,
      message: "Either email or phone number is required to place an order.",
    });
  }

  const effectiveEmail = email
    ? email.toLowerCase().trim()
    : `${phone.replace(/\D/g, "")}@zaevyul.customer`;

  try {
    // Synchronize Customer and CustomerUser models (AUD-014)
    let customerObj = await Customer.findOne({
      $or: [
        { email: effectiveEmail },
        ...(phone ? [{ phone: phone.trim() }] : []),
      ],
    });

    if (!customerObj) {
      customerObj = await Customer.create({
        name,
        email: effectiveEmail,
        phone: phone || "",
        city: resolvedShippingAddress.city || "",
        country: resolvedShippingAddress.country || "India",
        status: "active",
      });
    }

    // Cryptographically secure random order number generation (AUD-024)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const orderNumber = `ZAE-${dateStr}-${randomHex}`;

    // Call tax service to calculate tax, subtotal, and pricing mode
    let taxCalculation;
    try {
      taxCalculation = await calculateTax({
        items,
        shippingAddress: resolvedShippingAddress,
      });
    } catch (taxErr) {
      return res.status(400).json({ success: false, message: taxErr.message });
    }

    const calculatedSubtotal = taxCalculation.subtotal;
    const calculatedTaxAmount = taxCalculation.taxAmount;
    const pricingMode = taxCalculation.pricingMode;

    // Verify products exist, verify stock, and calculate authoritative subtotal (AUD-001)
    const orderItems = [];
    for (const item of items) {
      const productId = item.product || item._id || item.id;
      const strId = String(productId);
      const prod = mongoose.Types.ObjectId.isValid(strId)
        ? await Product.findById(strId)
        : await Product.findOne({
            $or: [{ id: strId }, { slug: strId }, { sku: strId }],
          });

      const qty = Math.max(1, parseInt(item.qty || item.quantity || 1, 10));

      let stock = 99;
      let unitPrice = Number(item.price || item.unitPrice || 0);
      let prodName = item.name || `Product (${strId})`;
      let targetProductId = mongoose.Types.ObjectId.isValid(strId)
        ? strId
        : new mongoose.Types.ObjectId();

      if (prod) {
        targetProductId = prod._id;
        prodName = prod.name;
        stock = prod.quantity;
        unitPrice =
          prod.discountPrice > 0 && prod.discountPrice < prod.basePrice
            ? prod.discountPrice
            : prod.basePrice;

        if (item.size && prod.sizes && prod.sizes.length > 0) {
          const matchedSize = prod.sizes.find((s) => s.size === item.size);
          if (matchedSize) {
            stock = matchedSize.quantity;
            unitPrice =
              matchedSize.discountPrice > 0 &&
              matchedSize.discountPrice < matchedSize.price
                ? matchedSize.discountPrice
                : matchedSize.price;
          }
        }
      }

      if (stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${prodName} (Available: ${stock})`,
        });
      }

      const itemImg =
        item.image ||
        item.img ||
        item.imageVal ||
        (prod && prod.images && prod.images[0]?.url) ||
        "/storefront/prod-1.png";

      orderItems.push({
        product: targetProductId,
        name: prodName,
        qty: qty,
        price: unitPrice,
        size: item.size || "",
        color: item.color || "",
        image: itemImg,
        img: itemImg,
      });
    }

    // Authoritative Coupon Validation (AUD-001, AUD-012)
    let calculatedDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
        active: true,
      });
      if (coupon) {
        const expiresAt = coupon.expiresAt || coupon.expiry;
        const minOrderAmount =
          coupon.minOrderAmount ?? coupon.minOrderValue ?? 0;
        const discountType = coupon.discountType || coupon.type;
        const discountValue = coupon.discountValue ?? coupon.value ?? 0;
        const maxDiscountAmount = coupon.maxDiscountAmount ?? null;
        const isNotExpired = !expiresAt || new Date(expiresAt) > new Date();
        const meetsMinAmount =
          !minOrderAmount || calculatedSubtotal >= minOrderAmount;
        if (isNotExpired && meetsMinAmount) {
          if (discountType === "percentage") {
            calculatedDiscount = Math.round(
              (calculatedSubtotal * discountValue) / 100,
            );
            if (maxDiscountAmount && calculatedDiscount > maxDiscountAmount) {
              calculatedDiscount = maxDiscountAmount;
            }
          } else {
            calculatedDiscount = discountValue;
          }
          calculatedDiscount = Math.min(calculatedDiscount, calculatedSubtotal);
          // Increment coupon usage count
          await Coupon.findByIdAndUpdate(coupon._id, {
            $inc: { usedCount: 1 },
          });
        }
      }
    }

    // Authoritative Shipping Fee Calculation from Settings
    let storeSettings = await Settings.findOne();
    const freeShippingThreshold =
      storeSettings?.freeShippingThreshold ||
      storeSettings?.freeShippingAbove ||
      5000;
    const standardShippingFee = storeSettings?.standardShippingFee || 250;
    const calculatedShipping =
      calculatedSubtotal >= freeShippingThreshold ? 0 : standardShippingFee;

    const calculatedTotal =
      pricingMode === "inclusive"
        ? Math.max(
            0,
            calculatedSubtotal + calculatedShipping - calculatedDiscount,
          )
        : Math.max(
            0,
            calculatedSubtotal +
              calculatedShipping -
              calculatedDiscount +
              calculatedTaxAmount,
          );

    // Atomic Stock Decrement & Transaction Rollback handling (AUD-004)
    const decrementedItems = [];
    for (const item of orderItems) {
      let updatedProd;
      const prod = await Product.findById(item.product);
      if (prod && prod.sizes && prod.sizes.length > 0 && item.size) {
        updatedProd = await Product.findOneAndUpdate(
          {
            _id: item.product,
            "sizes.size": item.size,
            "sizes.quantity": { $gte: item.qty },
          },
          { $inc: { "sizes.$.quantity": -item.qty, quantity: -item.qty } },
          { new: true },
        );
      } else {
        updatedProd = await Product.findOneAndUpdate(
          { _id: item.product, quantity: { $gte: item.qty } },
          { $inc: { quantity: -item.qty } },
          { new: true },
        );
      }

      if (!updatedProd) {
        // Stock check failed concurrently — rollback all previously decremented items!
        for (const rolled of decrementedItems) {
          const rProd = await Product.findById(rolled.product);
          if (rolled.size && rProd && rProd.sizes && rProd.sizes.length > 0) {
            await Product.updateOne(
              { _id: rolled.product, "sizes.size": rolled.size },
              {
                $inc: { "sizes.$.quantity": rolled.qty, quantity: rolled.qty },
              },
            );
          } else {
            await Product.findByIdAndUpdate(rolled.product, {
              $inc: { quantity: rolled.qty },
            });
          }
        }
        return res.status(400).json({
          success: false,
          message: `Stock ran out for item: ${item.name}. Please try again.`,
        });
      }
      decrementedItems.push(item);
    }

    // Create Order Document with authoritative backend calculations (AUD-001)
    let newOrder;
    try {
      newOrder = await Order.create({
        orderNumber,
        customer: customerObj._id,
        customerName: name,
        status: "pending",
        items: orderItems,
        subtotal: calculatedSubtotal,
        taxAmount: calculatedTaxAmount,
        taxRate: taxCalculation.taxRate,
        taxName: taxCalculation.taxName,
        taxType: taxCalculation.taxType,
        taxJurisdiction: taxCalculation.taxJurisdiction,
        shipping: calculatedShipping,
        discount: calculatedDiscount,
        total: calculatedTotal,
        currency: req.body.currency || "INR",
        paymentMethod: paymentMethod || "UPI",
        paymentStatus: "pending",
        shippingAddress: {
          line1:
            resolvedShippingAddress.line1 ||
            resolvedShippingAddress.addressLine1 ||
            resolvedShippingAddress.addressLine ||
            resolvedShippingAddress.address ||
            "",
          line2:
            resolvedShippingAddress.line2 ||
            resolvedShippingAddress.addressLine2 ||
            "",
          city: resolvedShippingAddress.city || "",
          state: resolvedShippingAddress.state || "",
          stateCode: resolvedShippingAddress.stateCode || "",
          country: resolvedShippingAddress.country || "India",
          countryCode: resolvedShippingAddress.countryCode || "",
          zip:
            resolvedShippingAddress.zip ||
            resolvedShippingAddress.postalCode ||
            "",
          phone: resolvedShippingAddress.phone || phone || "",
          phoneCountryCode:
            resolvedShippingAddress.phoneCountryCode ||
            req.customerUser?.phoneCountryCode ||
            "",
          recipientName:
            resolvedShippingAddress.recipientName ||
            resolvedShippingAddress.name ||
            name,
          landmark: resolvedShippingAddress.landmark || "",
        },
        notes: notes || "",
      });
    } catch (orderError) {
      // Rollback stock decrements if order creation fails! (AUD-004)
      for (const rolled of decrementedItems) {
        const rProd = await Product.findById(rolled.product);
        if (rolled.size && rProd && rProd.sizes && rProd.sizes.length > 0) {
          await Product.updateOne(
            { _id: rolled.product, "sizes.size": rolled.size },
            { $inc: { "sizes.$.quantity": rolled.qty, quantity: rolled.qty } },
          );
        } else {
          await Product.findByIdAndUpdate(rolled.product, {
            $inc: { quantity: rolled.qty },
          });
        }
      }
      throw orderError;
    }

    // Update customer statistics
    const customerOrders = await Order.find({
      customer: customerObj._id,
      status: "delivered",
    });
    customerObj.orderCount = customerOrders.length;
    customerObj.totalSpent = customerOrders.reduce(
      (sum, o) => sum + o.total,
      0,
    );
    customerObj.avgOrderValue =
      customerObj.orderCount > 0
        ? Math.round(customerObj.totalSpent / customerObj.orderCount)
        : 0;
    customerObj.lastOrder = newOrder.createdAt;
    await customerObj.save();

    // Automatically generate invoice snapshot and PDF for successful order
    try {
      await generateInvoiceForOrder(newOrder._id);
      const reloadedOrder = await Order.findById(newOrder._id);
      if (reloadedOrder) newOrder = reloadedOrder;
    } catch (invErr) {
      console.error("[customerOrders] Invoice auto-generation warning:", invErr.message);
    }

    // Dispatch order confirmation email asynchronously (AUD-023)
    if (email && !email.endsWith("@zaevyul.customer")) {
      sendOrderConfirmationEmail(newOrder, email).catch((err) =>
        console.error("[customerOrders] Email dispatch error:", err),
      );
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order: newOrder,
    });
  } catch (error) {
    console.error("[customerOrders] placeCustomerOrder error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to place order." });
  }
};

/**
 * POST /api/customer/orders/:id/cancel
 * Allows customers to cancel pending orders (AUD-026).
 */
export const cancelCustomerOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findById(id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is currently ${order.status}.`,
      });
    }

    order.status = "cancelled";
    await order.save();

    // Restock product quantities
    for (const item of order.items) {
      const prod = await Product.findById(item.product);
      if (item.size && prod && prod.sizes && prod.sizes.length > 0) {
        await Product.updateOne(
          { _id: item.product, "sizes.size": item.size },
          { $inc: { "sizes.$.quantity": item.qty, quantity: item.qty } },
        );
      } else {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: item.qty },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order has been cancelled successfully.",
      order,
    });
  } catch (error) {
    console.error("[customerOrders] cancelCustomerOrder error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to cancel order." });
  }
};

/**
 * POST /api/customer/orders/:id/return
 * Allows customers to request returns for delivered orders within 7 days.
 */
export const requestCustomerOrderReturn = async (req, res) => {
  const { id } = req.params;
  const { reason, details } = req.body;
  try {
    let order;
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    } else {
      order = await Order.findOne({ orderNumber: id });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: `Returns can only be requested for delivered orders. Current status: ${order.status}.`
      });
    }

    // Enforce 7-day return window rule
    const deliveryDate = order.updatedAt || order.createdAt;
    const daysSinceDelivery = (Date.now() - new Date(deliveryDate).getTime()) / (1000 * 3600 * 24);
    if (daysSinceDelivery > 7) {
      return res.status(400).json({
        success: false,
        message: "The 7-day return window for this order has elapsed."
      });
    }

    order.status = "return_requested";
    order.returnRequest = {
      reason: reason || "Exchanged or Return Requested",
      details: details || "",
      requestedAt: new Date(),
      status: "pending"
    };
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Return request received successfully. Our concierge team will reach out within 24 hours.",
      order
    });
  } catch (error) {
    console.error("[customerOrders] requestCustomerOrderReturn error:", error);
    return res.status(500).json({ success: false, message: "Failed to process return request." });
  }
};

/**
 * POST /api/customer/orders/calculate-tax
 * Previews tax, shipping, discounts, and order totals dynamically without placing an order.
 */
export const calculateTaxForCart = async (req, res) => {
  const { items, shippingAddressId, shippingAddress, couponCode } = req.body;

  if (!items || items.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Cart items are required." });
  }

  let resolvedShippingAddress = shippingAddress;
  if (shippingAddressId && req.customerUser) {
    const savedAddress = req.customerUser.addresses.id(shippingAddressId);
    if (savedAddress) {
      resolvedShippingAddress = normalizeAddressForResponse(savedAddress);
    }
  }

  try {
    const taxCalculation = await calculateTax({
      items,
      shippingAddress: resolvedShippingAddress,
    });

    const calculatedSubtotal = taxCalculation.subtotal;
    const calculatedTaxAmount = taxCalculation.taxAmount;
    const pricingMode = taxCalculation.pricingMode;

    // Authoritative Coupon Validation
    let calculatedDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
        active: true,
      });
      if (coupon) {
        const expiresAt = coupon.expiresAt || coupon.expiry;
        const minOrderAmount =
          coupon.minOrderAmount ?? coupon.minOrderValue ?? 0;
        const discountType = coupon.discountType || coupon.type;
        const discountValue = coupon.discountValue ?? coupon.value ?? 0;
        const maxDiscountAmount = coupon.maxDiscountAmount ?? null;
        const isNotExpired = !expiresAt || new Date(expiresAt) > new Date();
        const meetsMinAmount =
          !minOrderAmount || calculatedSubtotal >= minOrderAmount;
        if (isNotExpired && meetsMinAmount) {
          if (discountType === "percentage") {
            calculatedDiscount = Math.round(
              (calculatedSubtotal * discountValue) / 100,
            );
            if (maxDiscountAmount && calculatedDiscount > maxDiscountAmount) {
              calculatedDiscount = maxDiscountAmount;
            }
          } else {
            calculatedDiscount = discountValue;
          }
          calculatedDiscount = Math.min(calculatedDiscount, calculatedSubtotal);
        }
      }
    }

    // Authoritative Shipping Fee Calculation from Settings
    let storeSettings = await Settings.findOne();
    const freeShippingThreshold =
      storeSettings?.freeShippingThreshold ||
      storeSettings?.freeShippingAbove ||
      5000;
    const standardShippingFee = storeSettings?.standardShippingFee || 250;
    const calculatedShipping =
      calculatedSubtotal >= freeShippingThreshold ? 0 : standardShippingFee;

    const calculatedTotal =
      pricingMode === "inclusive"
        ? Math.max(
            0,
            calculatedSubtotal + calculatedShipping - calculatedDiscount,
          )
        : Math.max(
            0,
            calculatedSubtotal +
              calculatedShipping -
              calculatedDiscount +
              calculatedTaxAmount,
          );

    return res.status(200).json({
      success: true,
      subtotal: calculatedSubtotal,
      taxAmount: calculatedTaxAmount,
      taxRate: taxCalculation.taxRate,
      taxName: taxCalculation.taxName,
      taxType: taxCalculation.taxType,
      taxJurisdiction: taxCalculation.taxJurisdiction,
      shippingAmount: calculatedShipping,
      discountAmount: calculatedDiscount,
      total: calculatedTotal,
      pricingMode,
    });
  } catch (error) {
    console.error("[customerOrders] calculateTaxForCart error:", error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/customer/orders/:id/invoice
 * Secure customer invoice download.
 * Authorizes that the requesting customer owns the order.
 */
export const downloadCustomerInvoice = async (req, res) => {
  const { id } = req.params;
  try {
    let order;
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id).populate("customer");
    }
    if (!order && id) {
      order = await Order.findOne({ orderNumber: id }).populate("customer");
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Authorize Customer Ownership
    const reqEmail = req.customerUser?.email?.toLowerCase()?.trim();
    const reqPhone = req.customerUser?.phone?.trim();
    const orderCustomerObj = order.customer;

    let isAuthorized = false;

    if (orderCustomerObj) {
      if (reqEmail && orderCustomerObj.email?.toLowerCase()?.trim() === reqEmail) {
        isAuthorized = true;
      }
      if (reqPhone && orderCustomerObj.phone?.trim() === reqPhone) {
        isAuthorized = true;
      }
    }

    // Fallback match check
    if (!isAuthorized && reqEmail && order.shippingAddress?.phone) {
      if (reqPhone && order.shippingAddress.phone.includes(reqPhone)) {
        isAuthorized = true;
      }
    }

    // If order was created by this logged-in customer user
    if (!isAuthorized && req.customerUser && String(order.customer) === String(req.customerUser._id)) {
      isAuthorized = true;
    }

    // For Guest check: if unauthenticated request or no match, reject
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: You can only download your own order invoices.",
      });
    }

    // Retrieve or generate PDF file
    const { filePath, invoiceNumber } = await getInvoicePDFPath(order._id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${invoiceNumber}.pdf"`
    );

    return res.sendFile(filePath);
  } catch (error) {
    console.error("[customerOrders] downloadCustomerInvoice error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to download invoice. Please try again later.",
    });
  }
};

/**
 * POST /api/customer/orders/create-razorpay-order
 * Creates a Razorpay Order ID for online checkout.
 */
export const createRazorpayOrder = async (req, res) => {
  const { items, shippingAddress, shippingAddressId, couponCode } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: "Cart items are required." });
  }

  try {
    let resolvedShippingAddress = shippingAddress;
    if (shippingAddressId && req.customerUser) {
      const savedAddress = req.customerUser.addresses.id(shippingAddressId);
      if (savedAddress) {
        resolvedShippingAddress = normalizeAddressForResponse(savedAddress);
      }
    }

    // Calculate tax, subtotal, and shipping
    const taxCalculation = await calculateTax({
      items,
      shippingAddress: resolvedShippingAddress || {},
    });

    const calculatedSubtotal = taxCalculation.subtotal;
    const calculatedTaxAmount = taxCalculation.taxAmount;
    const pricingMode = taxCalculation.pricingMode;

    let calculatedDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
        active: true,
      });
      if (coupon) {
        const minOrderAmount = coupon.minOrderAmount ?? coupon.minOrderValue ?? 0;
        const discountType = coupon.discountType || coupon.type;
        const discountValue = coupon.discountValue ?? coupon.value ?? 0;
        const maxDiscountAmount = coupon.maxDiscountAmount ?? null;
        if (calculatedSubtotal >= minOrderAmount) {
          if (discountType === "percentage") {
            calculatedDiscount = Math.round((calculatedSubtotal * discountValue) / 100);
            if (maxDiscountAmount && calculatedDiscount > maxDiscountAmount) {
              calculatedDiscount = maxDiscountAmount;
            }
          } else {
            calculatedDiscount = discountValue;
          }
          calculatedDiscount = Math.min(calculatedDiscount, calculatedSubtotal);
        }
      }
    }

    let storeSettings = await Settings.findOne();
    const freeShippingThreshold = storeSettings?.freeShippingThreshold || storeSettings?.freeShippingAbove || 5000;
    const standardShippingFee = storeSettings?.standardShippingFee || 250;
    const calculatedShipping = calculatedSubtotal >= freeShippingThreshold ? 0 : standardShippingFee;

    const calculatedTotal =
      pricingMode === "inclusive"
        ? Math.max(0, calculatedSubtotal + calculatedShipping - calculatedDiscount)
        : Math.max(0, calculatedSubtotal + calculatedShipping - calculatedDiscount + calculatedTaxAmount);

    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID ||
      storeSettings?.paymentGateways?.razorpay?.keyId ||
      "rzp_test_1DP5mmOlF5G5ag";
    const razorpayKeySecret =
      process.env.RAZORPAY_KEY_SECRET ||
      storeSettings?.paymentGateways?.razorpay?.keySecret ||
      "w2F9tH87ZkPqX3mN0vL4R5sT";

    const instance = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const receipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const amountInPaise = Math.max(100, Math.round(calculatedTotal * 100)); // Minimum ₹1

    const razorpayOrder = await instance.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        customerEmail: req.body.email || req.customerUser?.email || "",
      },
    });

    return res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: razorpayKeyId,
      orderAmount: calculatedTotal,
    });
  } catch (error) {
    console.error("[customerOrders] createRazorpayOrder error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to initialize Razorpay payment.",
    });
  }
};

/**
 * POST /api/customer/orders/verify-razorpay-payment
 * Verifies Razorpay HMAC SHA256 signature and creates paid order.
 */
export const verifyRazorpayPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderPayload,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderPayload) {
    return res.status(400).json({
      success: false,
      message: "Missing Razorpay verification payment details.",
    });
  }

  try {
    let storeSettings = await Settings.findOne();
    const razorpayKeySecret =
      process.env.RAZORPAY_KEY_SECRET ||
      storeSettings?.paymentGateways?.razorpay?.keySecret ||
      "w2F9tH87ZkPqX3mN0vL4R5sT";

    // Verify HMAC-SHA256 signature
    const hmac = crypto.createHmac("sha256", razorpayKeySecret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    const isSignatureValid = generatedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay payment signature verification failed.",
      });
    }

    // Pass request with updated payment method and status
    req.body = {
      ...orderPayload,
      paymentMethod: "Razorpay",
      paymentStatus: "paid",
      notes: `${orderPayload.notes || ''} [Razorpay Payment ID: ${razorpay_payment_id}]`.trim(),
    };

    // Invoke placeCustomerOrder logic to create order & invoice
    return placeCustomerOrder(req, res);
  } catch (error) {
    console.error("[customerOrders] verifyRazorpayPayment error:", error);
    return res.status(500).json({
      success: false,
      message: "Razorpay payment verification failed.",
    });
  }
};



import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import Order from "../model/Order.js";
import Invoice from "../model/Invoice.js";
import Settings from "../model/Settings.js";
import Product from "../model/Product.js";
import { getNextSequence } from "../model/Counter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_BASE_DIR = path.join(process.cwd(), "storage", "invoices");

// Brand fonts (Cormorant Garamond = serif/display, Manrope = sans/body).
// PDFKit only ships the 14 standard PDF fonts (Helvetica/Times/Courier) —
// these .ttf files must be embedded to match the on-screen invoice design.
// Place the files in a `fonts/` folder next to this service file.
const FONTS_DIR = path.join(__dirname, "fonts");
const FONT_FILES = {
  "CG-Light": "CormorantGaramond-Light.ttf",
  "CG-Medium": "CormorantGaramond-Medium.ttf",
  "CG-SemiBold": "CormorantGaramond-SemiBold.ttf",
  "CG-Bold": "CormorantGaramond-Bold.ttf",
  "Manrope-Light": "Manrope-Light.ttf",
  Manrope: "Manrope-Regular.ttf",
  "Manrope-SemiBold": "Manrope-SemiBold.ttf",
  "Manrope-Bold": "Manrope-Bold.ttf",
};

/**
 * Format currency helper for PDF generation
 */
const formatPDFPrice = (amount, symbol = "₹") => {
  const num = Number(amount || 0);
  const pdfSymbol = symbol === "₹" || !symbol ? "Rs. " : `${symbol} `;
  return `${pdfSymbol}${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Render the invoice PDF document onto a file stream using PDFKit.
 */
const buildPDFFile = (invoiceData, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        bufferPages: true,
      });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Register brand fonts
      Object.entries(FONT_FILES).forEach(([name, file]) => {
        doc.registerFont(name, path.join(FONTS_DIR, file));
      });

      const { snapshot, invoiceNumber } = invoiceData;
      const { seller, customer, order, items, totals } = snapshot;
      const symbol = totals.currencySymbol || "₹";

      // Color Palette - Matching Zaevyul Brand
      const primaryColor = "#1C1916"; // Dark Charcoal
      const accentColor = "#B58A5B"; // Warm Gold / Bronze
      const textMuted = "#6B6560"; // Warm Gray
      const lightBg = "#FAF8F5"; // Off-white / Cream
      const borderColor = "#E6DED4"; // Soft Tan Border

      // ── Header Section (Centered Logo) ────────────────────────────────────────
      doc
        .fillColor(primaryColor)
        .fontSize(26)
        .font("CG-Light")
        .text((seller.storeName || "ZAEVYUL").split("").join("  "), 40, 36, {
          align: "center",
          width: 515,
        });

      doc
        .fontSize(8)
        .font("Manrope-SemiBold")
        .fillColor(primaryColor)
        .text("P A S H M I N A", 40, 68, { align: "center", width: 515 });

      // Divider Line
      doc
        .moveTo(40, 85)
        .lineTo(555, 85)
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .stroke();

      // ── Invoice Title & Metadata ─────────────────────────────────────────────────
      doc
        .fillColor(primaryColor)
        .fontSize(34)
        .font("CG-Light")
        .text("INVOICE", 40, 96);

      const metaY = 100;
      doc.fontSize(8.5);
      doc
        .font("Manrope-SemiBold")
        .fillColor(primaryColor)
        .text("INVOICE #", 330, metaY, { width: 90, align: "right" })
        .font("Manrope")
        .text(invoiceNumber, 430, metaY, { width: 125, align: "right" })
        .font("Manrope-SemiBold")
        .text("DATE", 330, metaY + 14, { width: 90, align: "right" })
        .font("Manrope")
        .text(
          new Date(order.invoiceDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          430,
          metaY + 14,
          { width: 125, align: "right" },
        )
        .font("Manrope-SemiBold")
        .text("ORDER #", 330, metaY + 28, { width: 90, align: "right" })
        .font("Manrope")
        .text(
          order.orderId ? `ZP-${order.orderId}` : invoiceNumber,
          430,
          metaY + 28,
          { width: 125, align: "right" },
        );

      doc
        .moveTo(40, 145)
        .lineTo(555, 145)
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .stroke();

      // ── Customer & Shipping Details (Two Columns) ──────────────────────────────
      const colTop = 160;

      // BILLED TO Column
      doc
        .font("Manrope-SemiBold")
        .fontSize(8.5)
        .fillColor(primaryColor)
        .text("BILLED TO", 40, colTop);

      doc
        .font("CG-SemiBold")
        .fontSize(12)
        .fillColor(primaryColor)
        .text(customer.name || "Ananya Sharma", 40, colTop + 14);

      const shipAddr = customer.shippingAddress || {};
      const addrLines = [
        shipAddr.line1 || "12 Maple Drive, Green Park",
        shipAddr.line2,
        `${shipAddr.city || "New Delhi"}, ${shipAddr.state || ""} ${shipAddr.zip || "110016"}`.trim(),
        shipAddr.country || "India",
      ].filter(Boolean);

      let lineY = colTop + 30;
      doc.font("Manrope").fontSize(9).fillColor(primaryColor);
      addrLines.forEach((line) => {
        doc.text(line, 40, lineY, { width: 230 });
        lineY += 13;
      });
      if (shipAddr.phone || customer.phone) {
        doc.text(
          shipAddr.phone || customer.phone || "+91 98765 43210",
          40,
          lineY,
          { width: 230 },
        );
        lineY += 13;
      }
      if (customer.email) {
        doc.text(customer.email, 40, lineY, { width: 230 });
        lineY += 13;
      }

      // SHIP TO Column (Right)
      doc
        .font("Manrope-SemiBold")
        .fontSize(8.5)
        .fillColor(primaryColor)
        .text("SHIP TO", 310, colTop);

      doc
        .font("CG-SemiBold")
        .fontSize(12)
        .fillColor(primaryColor)
        .text(
          shipAddr.recipientName || customer.name || "Ananya Sharma",
          310,
          colTop + 14,
        );

      let shipLineY = colTop + 30;
      doc.font("Manrope").fontSize(9).fillColor(primaryColor);
      addrLines.forEach((line) => {
        doc.text(line, 310, shipLineY, { width: 230 });
        shipLineY += 13;
      });
      if (shipAddr.phone || customer.phone) {
        doc.text(
          shipAddr.phone || customer.phone || "+91 98765 43210",
          310,
          shipLineY,
          { width: 230 },
        );
      }

      // ── Products Table ────────────────────────────────────────────────────────
      const tableTop = Math.max(lineY + 20, shipLineY + 20, 275);

      // Table Header Row Background (#FAF6F0)
      doc.rect(40, tableTop, 515, 22).fill("#FAF6F0");

      doc
        .fillColor(primaryColor)
        .font("Manrope-SemiBold")
        .fontSize(8.5)
        .text("ITEM", 48, tableTop + 7, { width: 45 })
        .text("DESCRIPTION", 100, tableTop + 7, { width: 200 })
        .text("QTY", 310, tableTop + 7, { width: 40, align: "center" })
        .text("UNIT PRICE", 360, tableTop + 7, { width: 90, align: "right" })
        .text("TOTAL", 460, tableTop + 7, { width: 90, align: "right" });

      doc
        .moveTo(40, tableTop + 22)
        .lineTo(555, tableTop + 22)
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .stroke();

      let currentY = tableTop + 28;

      // Table Rows
      items.forEach((item, index) => {
        // Page Break Check
        if (currentY > 700) {
          doc.addPage();
          currentY = 40;
        }

        const variantInfo = [
          item.color ? `Color: ${item.color}` : "Color: Sand Beige",
          item.size ? `Size: ${item.size}` : "",
          item.sku ? `SKU: ${item.sku}` : `SKU: HW-PASH-0${index + 1}`,
        ]
          .filter(Boolean)
          .join("  |  ");

        doc
          .fillColor(primaryColor)
          .font("CG-SemiBold")
          .fontSize(10.5)
          .text(item.name, 100, currentY, {
            width: 205,
            height: 14,
            ellipsis: true,
          })
          .font("Manrope")
          .fontSize(7.5)
          .fillColor(textMuted)
          .text(variantInfo, 100, currentY + 14, {
            width: 205,
            height: 14,
            ellipsis: true,
          })
          .fillColor(primaryColor)
          .fontSize(9)
          .text(`${item.qty}`, 310, currentY + 4, {
            width: 40,
            align: "center",
          })
          .text(formatPDFPrice(item.unitPrice, symbol), 360, currentY + 4, {
            width: 90,
            align: "right",
          })
          .font("Manrope-SemiBold")
          .text(formatPDFPrice(item.lineTotal, symbol), 460, currentY + 4, {
            width: 90,
            align: "right",
          });

        currentY += 36;
        doc
          .moveTo(40, currentY - 6)
          .lineTo(555, currentY - 6)
          .strokeColor(borderColor)
          .lineWidth(0.5)
          .stroke();
      });

      currentY += 10;

      // ── Totals Summary Block ─────────────────────────────────────────────────
      if (currentY > 660) {
        doc.addPage();
        currentY = 40;
      }

      const summaryLeft = 330;
      const totalsRows = [
        { label: "SUBTOTAL", val: formatPDFPrice(totals.subtotal, symbol) },
        {
          label: "SHIPPING",
          val:
            totals.shipping === 0
              ? "FREE"
              : formatPDFPrice(totals.shipping, symbol),
        },
        ...(totals.discount > 0
          ? [
              {
                label: "DISCOUNT",
                val: `-${formatPDFPrice(totals.discount, symbol)}`,
              },
            ]
          : []),
        { label: "TAX (18% GST)", val: formatPDFPrice(totals.tax, symbol) },
      ];

      doc.fontSize(8.5);
      totalsRows.forEach((row) => {
        doc
          .font("Manrope-SemiBold")
          .fillColor(primaryColor)
          .text(row.label, summaryLeft, currentY, { width: 100, align: "left" })
          .font("Manrope")
          .fillColor(primaryColor)
          .text(row.val, summaryLeft + 100, currentY, {
            width: 125,
            align: "right",
          });
        currentY += 16;
      });

      // Total Line & Amount
      doc
        .moveTo(summaryLeft, currentY + 4)
        .lineTo(555, currentY + 4)
        .strokeColor(primaryColor)
        .lineWidth(1)
        .stroke();
      currentY += 12;

      doc
        .font("CG-Light")
        .fontSize(18)
        .fillColor(primaryColor)
        .text("TOTAL", summaryLeft, currentY + 4, { width: 80, align: "left" })
        .font("CG-SemiBold")
        .fontSize(22)
        .text(
          formatPDFPrice(totals.grandTotal, symbol),
          summaryLeft + 80,
          currentY,
          { width: 145, align: "right" },
        )
        .font("Manrope")
        .fontSize(7.5)
        .fillColor(textMuted)
        .text("(INR)", summaryLeft + 80, currentY + 24, {
          width: 145,
          align: "right",
        });

      currentY += 45;

      // ── Payment Method & Note Bar ─────────────────────────────────────────────
      if (currentY > 720) {
        doc.addPage();
        currentY = 40;
      }

      doc
        .moveTo(40, currentY)
        .lineTo(555, currentY)
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .stroke();
      currentY += 15;

      doc
        .font("Manrope-SemiBold")
        .fontSize(8.5)
        .fillColor(primaryColor)
        .text("PAYMENT METHOD", 40, currentY)
        .font("Manrope")
        .fontSize(8.5)
        .fillColor(textMuted)
        .text(
          `${order.paymentMethod?.toUpperCase() === "COD" ? "Cash on Delivery" : "Ending with 4242"} · Paid on ${new Date(order.orderDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
          40,
          currentY + 12,
        );

      doc
        .moveTo(290, currentY)
        .lineTo(290, currentY + 28)
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .stroke();

      doc
        .font("CG-SemiBold")
        .fontSize(10)
        .fillColor(primaryColor)
        .text("Thank you for shopping with ZAEVYUL.", 310, currentY)
        .font("Manrope")
        .fontSize(8.5)
        .fillColor(textMuted)
        .text("We truly appreciate your order.", 310, currentY + 12);

      currentY += 42;

      // ── Footer Links & Computer Generated Disclaimer ─────────────────────────
      if (currentY > 740) {
        doc.addPage();
        currentY = 40;
      }

      doc
        .moveTo(40, currentY)
        .lineTo(555, currentY)
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .stroke();
      currentY += 12;

      doc
        .font("CG-SemiBold")
        .fontSize(11)
        .fillColor(primaryColor)
        .text((seller.storeName || "ZAEVYUL").toUpperCase(), 40, currentY)
        .font("Manrope-SemiBold")
        .fontSize(7)
        .fillColor(textMuted)
        .text("PASHMINA", 40, currentY + 13)

        .font("Manrope-SemiBold")
        .fontSize(8)
        .fillColor(primaryColor)
        .text("REACH US", 150, currentY)
        .font("Manrope")
        .fontSize(7.5)
        .fillColor(textMuted)
        .text(
          `${seller.email || "hello@zaevyul.com"}\n${seller.phone || "+91 98765 43210"}`,
          150,
          currentY + 10,
        )

        .font("Manrope-SemiBold")
        .fontSize(8)
        .fillColor(primaryColor)
        .text("ADDRESS", 290, currentY)
        .font("Manrope")
        .fontSize(7.5)
        .fillColor(textMuted)
        .text(
          seller.address ||
            "ZAEVYUL Pashmina\nB-12, Hauz Khas, New Delhi 110016",
          290,
          currentY + 10,
          { width: 145 },
        )

        .font("Manrope-SemiBold")
        .fontSize(8)
        .fillColor(primaryColor)
        .text("CONNECT", 450, currentY)
        .font("Manrope")
        .fontSize(7.5)
        .fillColor(textMuted)
        .text("Instagram  ·  Facebook", 450, currentY + 10);

      currentY += 40;
      doc
        .font("Manrope-SemiBold")
        .fontSize(7.5)
        .fillColor(textMuted)
        .text(
          "THIS IS A COMPUTER GENERATED INVOICE AND DOES NOT REQUIRE A SIGNATURE.",
          40,
          currentY,
          { align: "center", width: 515 },
        );

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate PDF Invoice for an Order.
 * Idempotent: returns existing invoice if already generated.
 */
export const generateInvoiceForOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate("customer");
    if (!order) {
      throw new Error(`Order not found for ID: ${orderId}`);
    }

    // Idempotency check: Return existing invoice if already successfully generated (re-rendering to update template)
    const existingInvoice = await Invoice.findOne({
      order: order._id,
      status: "generated",
    });
    if (
      existingInvoice &&
      existingInvoice.pdfPath &&
      fs.existsSync(existingInvoice.pdfPath)
    ) {
      try {
        await buildPDFFile(
          {
            snapshot: existingInvoice.snapshot,
            invoiceNumber: existingInvoice.invoiceNumber,
          },
          existingInvoice.pdfPath,
        );
      } catch (e) {
        console.error(
          "[InvoiceService] Re-render error in generateInvoiceForOrder:",
          e.message,
        );
      }
      return existingInvoice;
    }

    // Fetch store settings for seller metadata
    const settings = (await Settings.findOne()) || {};

    const year = new Date().getFullYear();
    const counterName = `invoice_${year}`;
    const seq = await getNextSequence(counterName);
    const invoiceNumber = `INV-${year}-${String(seq).padStart(6, "0")}`;

    // Itemized products preparation
    const itemSnapshots = [];
    for (const item of order.items) {
      let sku = "";
      if (item.product) {
        const prod =
          typeof item.product === "object" && item.product.sku
            ? item.product
            : await Product.findById(item.product).select("sku");
        if (prod) sku = prod.sku || "";
      }

      const unitPrice = item.price || 0;
      const qty = item.qty || 1;
      const lineTotal = unitPrice * qty;

      itemSnapshots.push({
        product: item.product,
        name: item.name || "Product",
        sku,
        size: item.size || "",
        color: item.color || "",
        qty,
        unitPrice,
        discount: 0,
        taxRate: order.taxRate || 0,
        taxAmount: Math.round(
          (order.taxAmount || 0) / (order.items.length || 1),
        ),
        lineTotal,
      });
    }

    // Assemble Data Snapshot
    const snapshot = {
      seller: {
        storeName: settings.storeName || "Zaevyul",
        tagline: settings.tagline || "Timeless · Authentic · Handcrafted",
        email: settings.email || "hello@zaevyul.com",
        phone: settings.phone || "+91 194 123 4567",
        address:
          settings.address ||
          "Residency Road, Srinagar, Jammu & Kashmir 190001",
        gstin: settings.gstin || "22AAAAA0000A1Z5",
        currencySymbol: settings.currencySymbol || "₹",
        currency: settings.currency || "INR",
      },
      customer: {
        name:
          order.customerName ||
          (order.customer && order.customer.name) ||
          "Valued Customer",
        email: (order.customer && order.customer.email) || "",
        phone:
          (order.customer && order.customer.phone) ||
          order.shippingAddress?.phone ||
          "",
        shippingAddress: {
          recipientName:
            order.shippingAddress?.recipientName || order.customerName || "",
          line1: order.shippingAddress?.line1 || "",
          line2: order.shippingAddress?.line2 || "",
          city: order.shippingAddress?.city || "",
          state: order.shippingAddress?.state || "",
          country: order.shippingAddress?.country || "India",
          zip: order.shippingAddress?.zip || "",
          phone: order.shippingAddress?.phone || "",
        },
        billingAddress: {
          recipientName:
            order.shippingAddress?.recipientName || order.customerName || "",
          line1: order.shippingAddress?.line1 || "",
          line2: order.shippingAddress?.line2 || "",
          city: order.shippingAddress?.city || "",
          state: order.shippingAddress?.state || "",
          country: order.shippingAddress?.country || "India",
          zip: order.shippingAddress?.zip || "",
          phone: order.shippingAddress?.phone || "",
        },
      },
      order: {
        orderId: order.orderNumber,
        orderDate: order.createdAt,
        invoiceDate: new Date(),
        paymentMethod: order.paymentMethod || "Online",
        paymentStatus: order.paymentStatus || "paid",
      },
      items: itemSnapshots,
      totals: {
        subtotal: order.subtotal || 0,
        discount: order.discount || 0,
        shipping: order.shipping || 0,
        tax: order.taxAmount || 0,
        grandTotal: order.total || 0,
        currency: order.currency || "INR",
        currencySymbol: settings.currencySymbol || "₹",
      },
    };

    // Ensure output directory exists
    const yearDir = path.join(STORAGE_BASE_DIR, String(year));
    if (!fs.existsSync(yearDir)) {
      fs.mkdirSync(yearDir, { recursive: true });
    }

    const filePath = path.join(yearDir, `${invoiceNumber}.pdf`);

    // Render PDF Document
    await buildPDFFile({ snapshot, invoiceNumber }, filePath);

    // Persist Invoice document
    const invoiceDoc = await Invoice.create({
      order: order._id,
      orderNumber: order.orderNumber,
      invoiceNumber,
      sequenceNumber: seq,
      year,
      snapshot,
      pdfPath: filePath,
      status: "generated",
      generatedAt: new Date(),
    });

    // Update Order reference
    order.invoice = {
      invoiceNumber,
      invoiceId: invoiceDoc._id,
      generatedAt: invoiceDoc.generatedAt,
      pdfUrl: `/api/customer/orders/${order._id}/invoice`,
      status: "generated",
    };
    await order.save();

    console.log(
      `[InvoiceService] Invoice ${invoiceNumber} generated successfully for Order #${order.orderNumber}`,
    );
    return invoiceDoc;
  } catch (error) {
    console.error(
      `[InvoiceService] Error generating invoice for Order ID ${orderId}:`,
      error,
    );

    // Update Order invoice status to 'failed' without breaking order lifecycle
    try {
      await Order.findByIdAndUpdate(orderId, {
        "invoice.status": "failed",
      });
    } catch (e) {
      /* ignore */
    }

    throw error;
  }
};

/**
 * Retrieve invoice file path for an order, regenerating if file is missing.
 */
export const getInvoicePDFPath = async (orderId) => {
  let invoiceDoc = await Invoice.findOne({
    order: orderId,
    status: "generated",
  });

  if (
    !invoiceDoc ||
    !invoiceDoc.pdfPath ||
    !fs.existsSync(invoiceDoc.pdfPath)
  ) {
    invoiceDoc = await generateInvoiceForOrder(orderId);
  } else {
    // Re-render PDF file on disk with latest luxury template and dynamic settings
    try {
      await buildPDFFile(
        {
          snapshot: invoiceDoc.snapshot,
          invoiceNumber: invoiceDoc.invoiceNumber,
        },
        invoiceDoc.pdfPath,
      );
    } catch (e) {
      console.error("[InvoiceService] Re-render error:", e.message);
    }
  }

  if (
    !invoiceDoc ||
    !invoiceDoc.pdfPath ||
    !fs.existsSync(invoiceDoc.pdfPath)
  ) {
    throw new Error("Invoice PDF file not available.");
  }

  return {
    filePath: invoiceDoc.pdfPath,
    invoiceNumber: invoiceDoc.invoiceNumber,
  };
};

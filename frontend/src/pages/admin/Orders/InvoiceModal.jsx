import { useState, useEffect, useRef } from "react";
import { X, Printer, Download, FileText } from "lucide-react";
import { formatCurrency, formatDate } from "../../../lib/mockData";
import { api } from "../../../lib/api";
import Logo from "../../../components/Logo";

// Ensures the Cormorant Garamond / Manrope Google Fonts used throughout this
// invoice are actually loaded in the app (previously they were only linked
// inside the separate print popup window, so the on-screen modal silently
// fell back to system fonts — which also broke the letter-spacing-heavy
// headers and threw off spacing everywhere).
function useInvoiceFonts() {
  useEffect(() => {
    const id = "invoice-modal-fonts";
    if (document.getElementById(id)) return;

    const preconnect1 = document.createElement("link");
    preconnect1.rel = "preconnect";
    preconnect1.href = "https://fonts.googleapis.com";

    const preconnect2 = document.createElement("link");
    preconnect2.rel = "preconnect";
    preconnect2.href = "https://fonts.gstatic.com";
    preconnect2.crossOrigin = "anonymous";

    const fontLink = document.createElement("link");
    fontLink.id = id;
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Manrope:wght@300;400;500;600;700&display=swap";

    document.head.appendChild(preconnect1);
    document.head.appendChild(preconnect2);
    document.head.appendChild(fontLink);
  }, []);
}

export default function InvoiceModal({
  order,
  isOpen,
  onClose,
  onDownload,
  downloading,
}) {
  const printRef = useRef(null);
  const [storeSettings, setStoreSettings] = useState(null);

  useInvoiceFonts();

  useEffect(() => {
    let active = true;
    if (isOpen) {
      api.settings
        .getPublic()
        .then((data) => {
          if (active) setStoreSettings(data);
        })
        .catch((err) =>
          console.error("Error loading store settings for invoice:", err),
        );
    }
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const invoiceNumber =
    order.invoice?.invoiceNumber || `INV-${order.orderNumber || order._id}`;
  const invoiceDate = order.invoice?.generatedAt || order.createdAt;

  // Math breakdown
  const subtotal = order.subtotal || 0;
  const shipping = order.shipping || 0;
  const discount = order.discount || 0;
  const total = order.total || 0;

  // Tax calculation
  const calculatedTax =
    order.taxAmount ?? Math.max(0, total - (subtotal + shipping - discount));
  const taxLabel = order.taxName
    ? `${order.taxName}${order.taxRate ? ` (${order.taxRate}%)` : ""}`
    : order.taxRate
      ? `TAX (${order.taxRate}% GST)`
      : "TAX (18% GST)";

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const windowUrl = "about:blank";
    const printWindow = window.open(
      windowUrl,
      "_blank",
      "left=50,top=50,width=880,height=950",
    );

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoiceNumber}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { font-family: 'Manrope', sans-serif; color: #1C1916; background: #fff; margin: 0; padding: 24px; }
            .font-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
            .font-sans { font-family: 'Manrope', sans-serif; }
            @media print {
              body { padding: 0; background: #fff; }
              @page { size: auto; margin: 12mm; }
            }
          </style>
        </head>
        <body>
          <div style="max-width: 820px; margin: 0 auto; background: #fff; padding: 10px;">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 350);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FAF8F5",
          borderRadius: 8,
          width: "100%",
          maxWidth: 900,
          maxHeight: "94vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
          border: "1px solid #E6DED4",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            padding: "14px 24px",
            background: "#ffffff",
            borderBottom: "1px solid #E6DED4",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileText size={18} className="text-[#B58A5B]" />
            <h3
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: "#1C1916",
                letterSpacing: "0.02em",
              }}
            >
              Invoice Preview — {invoiceNumber}
            </h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                padding: "7px 16px",
                fontSize: 12,
              }}
            >
              <Printer size={14} /> Print
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={downloading}
              onClick={onDownload}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                padding: "7px 16px",
                fontSize: 12,
                backgroundColor: "#1C1916",
                color: "#fff",
              }}
            >
              <Download size={14} />{" "}
              {downloading ? "Downloading..." : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 6,
                color: "#6B6560",
                borderRadius: 4,
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Invoice Body Canvas — 100% Exact Replica of Luxury Reference Image */}
        <div
          style={{
            padding: "48px 56px",
            overflowY: "auto",
            flex: 1,
            background: "#ffffff",
          }}
        >
          <div
            ref={printRef}
            style={{
              background: "#ffffff",
              color: "#1C1916",
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {/* 1. Header Centered Brand Logo */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 36,
                paddingBottom: 24,
                borderBottom: "1px solid #ECE7E1",
              }}
            >
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 34,
                  letterSpacing: "0.45em",
                  fontWeight: 300,
                  color: "#1C1916",
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
                Z A E V Y U L
              </h1>
              <p
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: 9.5,
                  letterSpacing: "0.55em",
                  fontWeight: 600,
                  color: "#1C1916",
                  margin: "6px 0 0 0",
                  textTransform: "uppercase",
                }}
              >
                P A S H M I N A
              </p>
            </div>

            {/* 2. Title & Metadata Header Block */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 36,
                paddingBottom: 28,
                borderBottom: "1px solid #ECE7E1",
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 38,
                    fontWeight: 300,
                    color: "#1C1916",
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    lineHeight: 1,
                  }}
                >
                  INVOICE
                </h2>
              </div>

              <div
                style={{
                  textAlign: "right",
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 24,
                    fontSize: 11,
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: "#1C1916",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      minWidth: 90,
                      textAlign: "right",
                    }}
                  >
                    INVOICE #
                  </span>
                  <span
                    style={{
                      fontWeight: 500,
                      color: "#1C1916",
                      letterSpacing: "0.04em",
                      minWidth: 100,
                      textAlign: "right",
                    }}
                  >
                    {invoiceNumber}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 24,
                    fontSize: 11,
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: "#1C1916",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      minWidth: 90,
                      textAlign: "right",
                    }}
                  >
                    DATE
                  </span>
                  <span
                    style={{
                      fontWeight: 500,
                      color: "#1C1916",
                      letterSpacing: "0.04em",
                      minWidth: 100,
                      textAlign: "right",
                    }}
                  >
                    {formatDate(invoiceDate)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 24,
                    fontSize: 11,
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: "#1C1916",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      minWidth: 90,
                      textAlign: "right",
                    }}
                  >
                    ORDER #
                  </span>
                  <span
                    style={{
                      fontWeight: 500,
                      color: "#1C1916",
                      letterSpacing: "0.04em",
                      minWidth: 100,
                      textAlign: "right",
                    }}
                  >
                    {order.orderNumber
                      ? `ZP-${order.orderNumber}`
                      : invoiceNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Billed To & Ship To 2-Column Section */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 48,
                marginBottom: 40,
              }}
            >
              {/* BILLED TO */}
              <div>
                <h4
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    color: "#1C1916",
                    margin: "0 0 12px 0",
                  }}
                >
                  BILLED TO
                </h4>
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 16,
                    fontWeight: 500,
                    color: "#1C1916",
                    margin: "0 0 4px 0",
                  }}
                >
                  {order.customerName ||
                    order.customer?.name ||
                    "Ananya Sharma"}
                </p>
                <p
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 12,
                    fontWeight: 300,
                    lineHeight: 1.65,
                    color: "#3D3833",
                    margin: 0,
                  }}
                >
                  {order.shippingAddress?.line1 || "12 Maple Drive, Green Park"}
                  {order.shippingAddress?.line2
                    ? `, ${order.shippingAddress.line2}`
                    : ""}
                  <br />
                  {order.shippingAddress?.city || "New Delhi"},{" "}
                  {order.shippingAddress?.zip || "110016"}
                  <br />
                  {order.shippingAddress?.country || "India"}
                </p>
                <p
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 12,
                    fontWeight: 300,
                    color: "#3D3833",
                    margin: "10px 0 0 0",
                  }}
                >
                  {order.shippingAddress?.phone ||
                    order.customer?.phone ||
                    "+91 98765 43210"}
                </p>
                <p
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 12,
                    fontWeight: 300,
                    color: "#3D3833",
                    margin: "2px 0 0 0",
                  }}
                >
                  {order.customer?.email || "ananya.sharma@example.com"}
                </p>
              </div>

              {/* SHIP TO */}
              <div>
                <h4
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    color: "#1C1916",
                    margin: "0 0 12px 0",
                  }}
                >
                  SHIP TO
                </h4>
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 16,
                    fontWeight: 500,
                    color: "#1C1916",
                    margin: "0 0 4px 0",
                  }}
                >
                  {order.shippingAddress?.recipientName ||
                    order.customerName ||
                    order.customer?.name ||
                    "Ananya Sharma"}
                </p>
                <p
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 12,
                    fontWeight: 300,
                    lineHeight: 1.65,
                    color: "#3D3833",
                    margin: 0,
                  }}
                >
                  {order.shippingAddress?.line1 || "12 Maple Drive, Green Park"}
                  {order.shippingAddress?.line2
                    ? `, ${order.shippingAddress.line2}`
                    : ""}
                  <br />
                  {order.shippingAddress?.city || "New Delhi"},{" "}
                  {order.shippingAddress?.zip || "110016"}
                  <br />
                  {order.shippingAddress?.country || "India"}
                </p>
                <p
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 12,
                    fontWeight: 300,
                    color: "#3D3833",
                    margin: "10px 0 0 0",
                  }}
                >
                  {order.shippingAddress?.phone ||
                    order.customer?.phone ||
                    "+91 98765 43210"}
                </p>
              </div>
            </div>

            {/* 4. Products Items Table with Cream Header */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: 36,
                tableLayout: "fixed",
              }}
            >
              <colgroup>
                <col style={{ width: 90 }} />
                <col />
                <col style={{ width: 60 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 130 }} />
              </colgroup>
              <thead>
                <tr
                  style={{
                    background: "#FAF6F0",
                    borderTop: "1px solid #E6DED4",
                    borderBottom: "1px solid #E6DED4",
                  }}
                >
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.16em",
                      color: "#3D3833",
                    }}
                  >
                    ITEM
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.16em",
                      color: "#3D3833",
                    }}
                  >
                    DESCRIPTION
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "center",
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.16em",
                      color: "#3D3833",
                    }}
                  >
                    QTY
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.16em",
                      color: "#3D3833",
                    }}
                  >
                    UNIT PRICE
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.16em",
                      color: "#3D3833",
                    }}
                  >
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => {
                  const itemImg =
                    item.image ||
                    item.product?.images?.[0]?.url ||
                    item.product?.mainImage ||
                    `/storefront/prod-${(idx % 6) + 1}.png`;
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #ECE7E1" }}>
                      <td
                        style={{
                          padding: "20px 16px",
                          verticalAlign: "middle",
                        }}
                      >
                        <img
                          src={itemImg}
                          alt={item.name}
                          style={{
                            width: 64,
                            height: 64,
                            objectFit: "cover",
                            borderRadius: 4,
                            border: "1px solid #E6DED4",
                            display: "block",
                          }}
                        />
                      </td>
                      <td
                        style={{
                          padding: "20px 16px",
                          verticalAlign: "middle",
                        }}
                      >
                        <h5
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontSize: 16,
                            fontWeight: 500,
                            color: "#1C1916",
                            margin: "0 0 4px 0",
                          }}
                        >
                          {item.name}
                        </h5>
                        <p
                          style={{
                            fontFamily: "'Manrope', sans-serif",
                            fontSize: 12,
                            color: "#6B6560",
                            margin: "0 0 2px 0",
                            fontWeight: 400,
                          }}
                        >
                          Color: {item.color || "Sand Beige"}
                        </p>
                        <p
                          style={{
                            fontFamily: "'Manrope', sans-serif",
                            fontSize: 12,
                            color: "#6B6560",
                            margin: 0,
                            fontWeight: 400,
                          }}
                        >
                          SKU:{" "}
                          {item.sku ||
                            item.product?.sku ||
                            `HW-PASH-0${idx + 1}`}
                        </p>
                      </td>
                      <td
                        style={{
                          padding: "20px 16px",
                          verticalAlign: "middle",
                          textAlign: "center",
                          fontFamily: "'Manrope', sans-serif",
                          fontSize: 12,
                          color: "#1C1916",
                          fontWeight: 400,
                        }}
                      >
                        {item.qty}
                      </td>
                      <td
                        style={{
                          padding: "20px 16px",
                          verticalAlign: "middle",
                          textAlign: "right",
                          fontFamily: "'Manrope', sans-serif",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#1C1916",
                        }}
                      >
                        {formatCurrency(item.price)}
                      </td>
                      <td
                        style={{
                          padding: "20px 16px",
                          verticalAlign: "middle",
                          textAlign: "right",
                          fontFamily: "'Manrope', sans-serif",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#1C1916",
                        }}
                      >
                        {formatCurrency(item.price * item.qty)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 5. Totals Summary Breakdown */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 40,
              }}
            >
              <div
                style={{
                  width: 340,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: 11,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#1C1916",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    SUBTOTAL
                  </span>
                  <span style={{ fontWeight: 600, letterSpacing: "0.04em" }}>
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#1C1916",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    SHIPPING
                  </span>
                  <span style={{ fontWeight: 600, letterSpacing: "0.04em" }}>
                    {shipping > 0 ? formatCurrency(shipping) : "FREE"}
                  </span>
                </div>
                {discount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#1C1916",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                      }}
                    >
                      DISCOUNT
                    </span>
                    <span style={{ fontWeight: 600, letterSpacing: "0.04em" }}>
                      −{formatCurrency(discount)}
                    </span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#1C1916",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    {taxLabel.toUpperCase()}
                  </span>
                  <span style={{ fontWeight: 600, letterSpacing: "0.04em" }}>
                    {formatCurrency(calculatedTax)}
                  </span>
                </div>

                <div
                  style={{
                    paddingTop: 16,
                    marginTop: 6,
                    borderTop: "1px solid #ECE7E1",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: 22,
                      fontWeight: 400,
                      textTransform: "uppercase",
                      color: "#1C1916",
                      letterSpacing: "0.05em",
                    }}
                  >
                    TOTAL
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: 32,
                        fontWeight: 700,
                        color: "#1C1916",
                        display: "block",
                        lineHeight: 1,
                      }}
                    >
                      {formatCurrency(total)}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: 9,
                        color: "#8A857E",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        display: "block",
                        marginTop: 4,
                      }}
                    >
                      (INR)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Payment Method & Thank You Box */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr",
                gap: 32,
                padding: "24px 0",
                borderTop: "1px solid #ECE7E1",
                borderBottom: "1px solid #ECE7E1",
                marginBottom: 40,
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <h5
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    color: "#1C1916",
                    margin: 0,
                  }}
                >
                  PAYMENT METHOD
                </h5>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 26,
                      background: "#FAF6F0",
                      border: "1px solid #E6DED4",
                      borderRadius: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 10,
                      color: "#1F2937",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {order.paymentMethod?.toUpperCase() === "COD"
                      ? "COD"
                      : "VISA"}
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#1C1916",
                        margin: "0 0 2px 0",
                      }}
                    >
                      {order.paymentMethod?.toUpperCase() === "COD"
                        ? "Cash on Delivery"
                        : "Ending with 4242"}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: 11,
                        color: "#8A857E",
                        margin: 0,
                        fontWeight: 400,
                      }}
                    >
                      Paid on {formatDate(invoiceDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ borderLeft: "1px solid #ECE7E1", paddingLeft: 32 }}>
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 16,
                    fontWeight: 400,
                    color: "#1C1916",
                    margin: "0 0 2px 0",
                    fontStyle: "normal",
                  }}
                >
                  Thank you for shopping with ZAEVYUL.
                </p>
                <p
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 12,
                    fontWeight: 300,
                    color: "#6B6560",
                    margin: 0,
                  }}
                >
                  We truly appreciate your order.
                </p>
              </div>
            </div>

            {/* 7. Footer Info Columns + Disclaimer */}
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr 1.3fr 0.8fr",
                  gap: 24,
                  marginBottom: 28,
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: 11,
                }}
              >
                {/* Brand Logo with Diamond Motif */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="7"
                      y="1"
                      width="2"
                      height="2"
                      transform="rotate(45 7 1)"
                      fill="#B58A5B"
                    />
                    <rect
                      x="2"
                      y="6"
                      width="2"
                      height="2"
                      transform="rotate(45 2 6)"
                      fill="#B58A5B"
                    />
                    <rect
                      x="12"
                      y="6"
                      width="2"
                      height="2"
                      transform="rotate(45 12 6)"
                      fill="#B58A5B"
                    />
                    <rect
                      x="7"
                      y="11"
                      width="2"
                      height="2"
                      transform="rotate(45 7 11)"
                      fill="#B58A5B"
                    />
                    <rect
                      x="7"
                      y="6"
                      width="2.5"
                      height="2.5"
                      transform="rotate(45 7 6)"
                      fill="#B58A5B"
                    />
                  </svg>
                  <div>
                    <Logo variant="invoice" />
                  </div>
                </div>

                {/* REACH US */}
                <div>
                  <h6
                    style={{
                      fontWeight: 700,
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      color: "#1C1916",
                      margin: "0 0 6px 0",
                    }}
                  >
                    REACH US
                  </h6>
                  <p
                    style={{
                      color: "#6B6560",
                      margin: 0,
                      lineHeight: 1.6,
                      fontSize: 11,
                      fontWeight: 400,
                    }}
                  >
                    {storeSettings?.storeEmail ||
                      storeSettings?.email ||
                      "hello@zaevyul.com"}
                    <br />
                    {storeSettings?.phone || "+91 98765 43210"}
                  </p>
                </div>

                {/* ADDRESS */}
                <div>
                  <h6
                    style={{
                      fontWeight: 700,
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      color: "#1C1916",
                      margin: "0 0 6px 0",
                    }}
                  >
                    ADDRESS
                  </h6>
                  <p
                    style={{
                      color: "#6B6560",
                      margin: 0,
                      lineHeight: 1.6,
                      fontSize: 11,
                      fontWeight: 400,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {storeSettings?.address ||
                      "ZAEVYUL Pashmina\nB-12, Hauz Khas\nNew Delhi, 110016, India"}
                  </p>
                </div>

                {/* CONNECT */}
                <div>
                  <h6
                    style={{
                      fontWeight: 700,
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      color: "#1C1916",
                      margin: "0 0 6px 0",
                    }}
                  >
                    CONNECT
                  </h6>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      color: "#1C1916",
                    }}
                  >
                    {/* Instagram */}
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                    {/* Pinterest */}
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2a10 10 0 0 0-3.16 19.49c-.07-.65-.13-1.65.03-2.36.14-.64.93-3.95.93-3.95s-.24-.48-.24-1.18c0-1.1.64-1.93 1.44-1.93.68 0 1.01.51 1.01 1.12 0 .68-.43 1.7-.66 2.65-.19.79.4 1.43 1.17 1.43 1.4 0 2.48-1.48 2.48-3.62 0-1.89-1.36-3.21-3.3-3.21-2.4 0-3.82 1.8-3.82 3.67 0 .73.28 1.51.63 1.93.07.08.08.15.06.24l-.23.95c-.04.15-.13.18-.3.11-1.11-.52-1.81-2.14-1.81-3.45 0-2.8 2.04-5.38 5.88-5.38 3.09 0 5.48 2.2 5.48 5.14 0 3.07-1.93 5.54-4.61 5.54-.9 0-1.75-.47-2.04-1.02l-.56 2.12c-.2.78-.75 1.76-1.12 2.36A10 10 0 1 0 12 2z" />
                    </svg>
                    {/* Facebook */}
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Bottom Disclaimer */}
              <p
                style={{
                  textAlign: "center",
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "#8A857E",
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                THIS IS A COMPUTER GENERATED INVOICE AND DOES NOT REQUIRE A
                SIGNATURE.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

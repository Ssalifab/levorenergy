/* Levor Energy - Shop (Client-side Cart + UGX/USD + Quote/Invoice PDF Downloads) */

const VAT_RATE = 0.18;

// ✅ EXCHANGE RATE (edit anytime)
const EXCHANGE_RATE_UGX_PER_USD = 3800; // 1 USD = 3800 UGX

// 1) Services catalog (BASE pricing in UGX)
const SERVICES = [
  {
    id: "electrical-eng",
    name: "Electrical Engineering",
    priceUGX: 2500000,
    image: "assets/images/power13.jpg",
    desc: "HV/LV panels, substations, transformers, switchgear, cable termination, powerline works."
  },
  {
    id: "civil-mech",
    name: "Civil & Mechanical Works",
    priceUGX: 2000000,
    image: "assets/images/team6.jpg",
    desc: "Civil works, fabrication, mechanical installation, plant support services."
  },
  {
    id: "oil-gas",
    name: "Oil & Gas EPCC & O&M",
    priceUGX: 3500000,
    image: "assets/images/team5.jpg",
    desc: "Commissioning, rotating equipment, inspection, revamps, shutdowns, upgrades."
  },
  {
    id: "solar",
    name: "Solar & Renewable Solutions",
    priceUGX: 1800000,
    image: "assets/images/solar.jpg",
    desc: "Solar engineering, design and deployment for reliable commercial/industrial power."
  },
  {
    id: "water",
    name: "Water Systems Engineering",
    priceUGX: 2200000,
    image: "assets/images/home4.jpg",
    desc: "Water treatment and system engineering support including infrastructure readiness."
  },
  {
    id: "procurement",
    name: "Supply & Procurement",
    priceUGX: 900000,
    image: "assets/images/power14.jpg",
    desc: "Supply of general engineering and construction materials as part of EPCC delivery."
  }
];

// 2) Cart state (persist in localStorage)
const LS_KEY = "levor_cart_v1";
let cart = loadCart(); // {serviceId: qty}

function loadCart() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
  catch { return {}; }
}
function saveCart() { localStorage.setItem(LS_KEY, JSON.stringify(cart)); }

function getQty(id) { return cart[id] || 0; }

function addToCart(id) {
  cart[id] = getQty(id) + 1;
  saveCart();
  renderCart();
}
function removeOne(id) {
  const q = getQty(id);
  if (q <= 1) delete cart[id];
  else cart[id] = q - 1;
  saveCart();
  renderCart();
}
function clearCart() {
  cart = {};
  saveCart();
  renderCart();
}

/* ✅ Currency helpers (UGX ↔ USD) */
function getCurrency() {
  return document.getElementById("currencySelect")?.value || "UGX";
}
function ugxToUsd(ugx) {
  return Number(ugx || 0) / EXCHANGE_RATE_UGX_PER_USD;
}
function usdToUgx(usd) {
  return Number(usd || 0) * EXCHANGE_RATE_UGX_PER_USD;
}
function convertAmount(amount, fromCurrency, toCurrency) {
  const amt = Number(amount || 0);
  if (fromCurrency === toCurrency) return amt;
  if (fromCurrency === "UGX" && toCurrency === "USD") return ugxToUsd(amt);
  if (fromCurrency === "USD" && toCurrency === "UGX") return usdToUgx(amt);
  return amt;
}
function formatMoney(value, currency) {
  if (currency === "USD") return "$" + Number(value || 0).toFixed(2);
  return "UGX " + Math.round(Number(value || 0)).toLocaleString("en-UG");
}
function updateRateLabel() {
  const el = document.getElementById("rateLabel");
  if (!el) return;
  el.textContent = `1 USD = ${Math.round(EXCHANGE_RATE_UGX_PER_USD).toLocaleString("en-UG")} UGX`;
}

/* Totals (computed in UGX base + displayed in selected currency) */
function calcTotals() {
  const currency = getCurrency();
  let subtotalUGX = 0;
  const items = [];

  Object.keys(cart).forEach(id => {
    const svc = SERVICES.find(s => s.id === id);
    if (!svc) return;

    const qty = cart[id];
    const lineUGX = svc.priceUGX * qty;
    subtotalUGX += lineUGX;

    items.push({
      ...svc,
      qty,
      lineUGX,
      unitConverted: convertAmount(svc.priceUGX, "UGX", currency),
      lineConverted: convertAmount(lineUGX, "UGX", currency)
    });
  });

  const vatOn = document.getElementById("vatToggle")?.checked;
  const vatUGX = vatOn ? subtotalUGX * VAT_RATE : 0;
  const grandUGX = subtotalUGX + vatUGX;

  const subtotal = convertAmount(subtotalUGX, "UGX", currency);
  const vat = convertAmount(vatUGX, "UGX", currency);
  const grand = convertAmount(grandUGX, "UGX", currency);

  return { currency, items, subtotalUGX, vatUGX, grandUGX, subtotal, vat, grand, vatOn };
}

// 3) Render services grid (shows currency)
function renderServices() {
  const grid = document.getElementById("servicesGrid");
  if (!grid) return;

  const currency = getCurrency();

  grid.innerHTML = SERVICES.map(s => {
    const priceConverted = convertAmount(s.priceUGX, "UGX", currency);
    return `
      <div class="col-md-6">
        <div class="card card-soft h-100">
          <img src="${s.image}" class="w-100"
            style="height:200px; object-fit:cover; border-top-left-radius:1.25rem; border-top-right-radius:1.25rem;"
            alt="${s.name}">
          <div class="card-body p-4">
            <div class="d-flex justify-content-between align-items-start gap-2">
              <h3 class="h6 mb-1">${s.name}</h3>
              <span class="badge text-bg-light border">${formatMoney(priceConverted, currency)}</span>
            </div>
            <p class="text-muted small mb-3">${s.desc}</p>

            <div class="d-flex justify-content-between align-items-center">
              <button class="btn btn-sm btn-brand" data-add="${s.id}">
                <i class="fa-solid fa-cart-plus me-1"></i>Add to cart
              </button>
              <div class="small text-muted">Qty: <span id="qty-${s.id}">${getQty(s.id)}</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  grid.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.add);
      updateQtyBadges();
    });
  });
}

function updateQtyBadges() {
  SERVICES.forEach(s => {
    const el = document.getElementById(`qty-${s.id}`);
    if (el) el.textContent = String(getQty(s.id));
  });
}

// 4) Render cart (shows currency)
function renderCart() {
  const list = document.getElementById("cartList");
  const totalEl = document.getElementById("cartTotal");
  const vatEl = document.getElementById("cartVAT");
  const grandEl = document.getElementById("cartGrand");

  const { items, subtotal, vat, grand, currency } = calcTotals();

  if (list) {
    if (!items.length) {
      list.innerHTML = `<div class="text-muted">Your cart is empty. Add services to request a quotation.</div>`;
    } else {
      list.innerHTML = items.map(it => `
        <div class="d-flex justify-content-between align-items-start border rounded-4 p-3 mb-2">
          <div class="me-2">
            <div class="fw-semibold">${it.name}</div>
            <div class="text-muted small">${formatMoney(it.unitConverted, currency)} × ${it.qty}</div>
            <div class="small fw-semibold mt-1">${formatMoney(it.lineConverted, currency)}</div>
          </div>
          <div class="d-flex flex-column gap-2">
            <button class="btn btn-sm btn-outline-dark" data-minus="${it.id}">-</button>
            <button class="btn btn-sm btn-outline-danger" data-remove="${it.id}">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      `).join("");

      list.querySelectorAll("[data-minus]").forEach(b => {
        b.addEventListener("click", () => { removeOne(b.dataset.minus); updateQtyBadges(); });
      });
      list.querySelectorAll("[data-remove]").forEach(b => {
        b.addEventListener("click", () => { delete cart[b.dataset.remove]; saveCart(); renderCart(); updateQtyBadges(); });
      });
    }
  }

  if (totalEl) totalEl.textContent = formatMoney(subtotal, currency);
  if (vatEl) vatEl.textContent = formatMoney(vat, currency);
  if (grandEl) grandEl.textContent = formatMoney(grand, currency);
}

// 5) Validate client form quickly
function getClientDetailsOrNull() {
  const form = document.getElementById("clientForm");
  if (!form) return null;

  form.classList.add("was-validated");
  if (!form.checkValidity()) return null;

  return {
    name: document.getElementById("clientName").value.trim(),
    email: document.getElementById("clientEmail").value.trim(),
    phone: document.getElementById("clientPhone").value.trim(),
    location: document.getElementById("clientLocation").value.trim(),
    notes: document.getElementById("clientNotes").value.trim()
  };
}

function ensureCartNotEmpty(items) {
  if (!items.length) {
    alert("Cart is empty. Please add at least one service.");
    return false;
  }
  return true;
}

/* 6) Client-side PDF generation (Quotation / Invoice) */
function makeDocNumber(prefix) {
  // Client-side only. For true sequential numbers, use backend later.
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${y}${m}${day}-${rnd}`;
}

function buildPDF(type) {
  if (!window.jspdf?.jsPDF) {
    alert("jsPDF not found. Add jsPDF CDN script in shop.html.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const { items, subtotal, vat, grand, vatOn, currency } = calcTotals();
  if (!ensureCartNotEmpty(items)) return;

  const client = getClientDetailsOrNull();
  if (!client) return;

  const docNo = makeDocNumber(type === "invoice" ? "INV" : "QTN");
  const today = new Date().toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "2-digit" });

  // Header
  doc.setFontSize(16);
  doc.text("Levor Energy Technologies (U) Ltd", 14, 18);
  doc.setFontSize(10);
  doc.text("P.O. Box 34982, Mengo–Kampala | Plot 1115, Levor Lane, Rubaga–Kampala", 14, 24);
  doc.text("Tel: +256 704 743 642 / +256 700 499 565 | Email: engineering@levorenergy.com", 14, 29);

  doc.setFontSize(13);
  doc.text(type === "invoice" ? "INVOICE" : "QUOTATION", 14, 40);

  doc.setFontSize(10);
  doc.text(`${type === "invoice" ? "Invoice" : "Quote"} No: ${docNo}`, 14, 46);
  doc.text(`Date: ${today}`, 140, 46);

  doc.text(`Currency: ${currency}  (Rate: 1 USD = ${Math.round(EXCHANGE_RATE_UGX_PER_USD).toLocaleString("en-UG")} UGX)`, 14, 52);

  // Client details
  doc.setFontSize(11);
  doc.text("Bill To:", 14, 64);
  doc.setFontSize(10);
  doc.text(`${client.name}`, 14, 70);
  doc.text(`${client.email}`, 14, 75);
  if (client.phone) doc.text(`${client.phone}`, 14, 80);
  if (client.location) doc.text(`Location: ${client.location}`, 14, 85);

  // Table header
  let y = 98;
  doc.setFontSize(10);
  doc.text("Service", 14, y);
  doc.text("Qty", 120, y);
  doc.text(`Unit (${currency})`, 135, y);
  doc.text(`Line (${currency})`, 196, y, { align: "right" });

  y += 4;
  doc.line(14, y, 196, y);
  y += 8;

  items.forEach(it => {
    const nameLines = doc.splitTextToSize(it.name, 95);
    doc.text(nameLines, 14, y);
    doc.text(String(it.qty), 122, y);
    doc.text(formatMoney(it.unitConverted, currency), 135, y);
    doc.text(formatMoney(it.lineConverted, currency), 196, y, { align: "right" });

    y += (nameLines.length * 5) + 3;

    if (y > 265) {
      doc.addPage();
      y = 20;
    }
  });

  // Totals
  y += 4;
  doc.line(14, y, 196, y);
  y += 8;

  doc.text("Subtotal:", 140, y);
  doc.text(formatMoney(subtotal, currency), 196, y, { align: "right" });
  y += 6;

  doc.text(vatOn ? "VAT (18%):" : "VAT:", 140, y);
  doc.text(formatMoney(vat, currency), 196, y, { align: "right" });
  y += 6;

  doc.setFontSize(11);
  doc.text("Total:", 140, y);
  doc.text(formatMoney(grand, currency), 196, y, { align: "right" });

  // Notes / terms
  y += 14;
  doc.setFontSize(10);

  if (type === "invoice") {
    doc.text("Payment Terms:", 14, y);
    doc.text("• Payment due within 7 days unless otherwise agreed.", 14, y + 6);
    doc.text("• This invoice is system-generated for client confirmation.", 14, y + 12);
  } else {
    doc.text("Quotation Notes:", 14, y);
    doc.text("• Prices are estimates and may vary after site assessment.", 14, y + 6);
    doc.text("• Validity: 14 days from date of issue.", 14, y + 12);
  }

  if (client.notes) {
    y += 22;
    doc.text("Client Notes:", 14, y);
    const lines = doc.splitTextToSize(client.notes, 170);
    doc.text(lines, 14, y + 6);
  }

  doc.save(`${docNo}.pdf`);
}

// 7) Wire up events
document.addEventListener("DOMContentLoaded", () => {
  updateRateLabel();
  renderServices();
  renderCart();

  document.getElementById("currencySelect")?.addEventListener("change", () => {
    updateRateLabel();
    renderServices();
    renderCart();
  });

  document.getElementById("vatToggle")?.addEventListener("change", renderCart);

  document.getElementById("clearCartBtn")?.addEventListener("click", () => {
    if (confirm("Clear cart?")) clearCart();
    updateQtyBadges();
    renderServices();
  });

  // ✅ Client-side downloads (no backend)
  document.getElementById("downloadQuoteBtn")?.addEventListener("click", () => buildPDF("quote"));
  document.getElementById("downloadInvoiceBtn")?.addEventListener("click", () => buildPDF("invoice"));
});

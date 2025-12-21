/* Levor Energy - Shop (REAL Cart + Quote/Invoice via Backend) */

const VAT_RATE = 0.18;

// ✅ EXCHANGE RATE (edit anytime)
const EXCHANGE_RATE_UGX_PER_USD = 3800; // 1 USD = 3800 UGX

// 1) Your services catalog (store base price in UGX)
const SERVICES = [
  {
    id: "electrical-eng",
    name: "Electrical Engineering",
    priceUGX: 2500000,
    image: "assets/images/hero-1.jpg",
    desc: "HV/LV panels, substations, transformers, switchgear, cable termination, powerline works."
  },
  {
    id: "civil-mech",
    name: "Civil & Mechanical Works",
    priceUGX: 2000000,
    image: "assets/images/team-1.jpg",
    desc: "Civil works, fabrication, mechanical installation, plant support services."
  },
  {
    id: "oil-gas",
    name: "Oil & Gas EPCC & O&M",
    priceUGX: 3500000,
    image: "assets/images/hero-2.jpg",
    desc: "Commissioning, rotating equipment, inspection, revamps, shutdowns, upgrades."
  },
  {
    id: "solar",
    name: "Solar & Renewable Solutions",
    priceUGX: 1800000,
    image: "assets/images/_DSC1303.jpg",
    desc: "Solar engineering, design and deployment for reliable commercial/industrial power."
  },
  {
    id: "water",
    name: "Water Systems Engineering",
    priceUGX: 2200000,
    image: "assets/images/hero-2.jpg",
    desc: "Water treatment and system engineering support including infrastructure readiness."
  },
  {
    id: "procurement",
    name: "Supply & Procurement",
    priceUGX: 900000,
    image: "assets/images/hero-1.jpg",
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

function getCurrency() {
  return document.getElementById("currencySelect")?.value || "UGX";
}

function convertUGX(ugx, currency) {
  if (currency === "USD") return ugx / EXCHANGE_RATE_UGX_PER_USD;
  return ugx;
}

function formatMoney(value, currency) {
  if (currency === "USD") return "$" + Number(value || 0).toFixed(2);
  return "UGX " + Math.round(Number(value || 0)).toLocaleString("en-UG");
}

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
      unitConverted: convertUGX(svc.priceUGX, currency),
      lineConverted: convertUGX(lineUGX, currency)
    });
  });

  const vatOn = document.getElementById("vatToggle")?.checked;
  const vatUGX = vatOn ? subtotalUGX * VAT_RATE : 0;
  const grandUGX = subtotalUGX + vatUGX;

  const subtotal = convertUGX(subtotalUGX, currency);
  const vat = convertUGX(vatUGX, currency);
  const grand = convertUGX(grandUGX, currency);

  return {
    currency,
    items,
    subtotalUGX,
    vatUGX,
    grandUGX,
    subtotal,
    vat,
    grand,
    vatOn
  };
}

// 3) Render services grid
function renderServices() {
  const grid = document.getElementById("servicesGrid");
  if (!grid) return;

  const currency = getCurrency();

  grid.innerHTML = SERVICES.map(s => {
    const priceConverted = convertUGX(s.priceUGX, currency);
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

// 4) Render cart
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
        b.addEventListener("click", () => {
          delete cart[b.dataset.remove];
          saveCart();
          renderCart();
          updateQtyBadges();
        });
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

// ✅ 6) REAL backend call: issue quote/invoice, store, email, return PDF link
async function createDocument(type) {
  const { items, vatOn, currency, subtotalUGX, vatUGX, grandUGX } = calcTotals();
  if (!ensureCartNotEmpty(items)) return;

  const client = getClientDetailsOrNull();
  if (!client) return;

  // send minimal and secure payload (server recomputes totals from service catalog ideally)
  const payload = {
    type,               // "quote" or "invoice"
    currency,           // "UGX" or "USD"
    vatOn,
    exchangeRate: EXCHANGE_RATE_UGX_PER_USD,
    cart,               // {serviceId: qty}
    client,
    clientTotalsUGX: { subtotalUGX, vatUGX, grandUGX } // optional for display; server should verify
  };

  // UI disable buttons while processing
  const qBtn = document.getElementById("downloadQuoteBtn");
  const iBtn = document.getElementById("downloadInvoiceBtn");
  if (qBtn) qBtn.disabled = true;
  if (iBtn) iBtn.disabled = true;

  try {
    const res = await fetch("/.netlify/functions/createDocument", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Server error");
    }

    const data = await res.json();

    // Expecting: { pdfUrl, docNo }
    if (data?.pdfUrl) {
      window.open(data.pdfUrl, "_blank");
      alert(`${type.toUpperCase()} issued successfully: ${data.docNo || ""}`);
    } else {
      alert("Document created, but PDF link missing. Check function response.");
    }
  } catch (err) {
    console.error(err);
    alert(
      "Could not create document (backend not ready or missing). " +
      "Ensure Netlify Function '/.netlify/functions/createDocument' is deployed.\n\n" +
      "Error: " + (err.message || err)
    );
  } finally {
    if (qBtn) qBtn.disabled = false;
    if (iBtn) iBtn.disabled = false;
  }
}

// 7) Wire up events
document.addEventListener("DOMContentLoaded", () => {
  renderServices();
  renderCart();

  // currency change should refresh displayed prices/totals
  document.getElementById("currencySelect")?.addEventListener("change", () => {
    renderServices();
    renderCart();
  });

  document.getElementById("vatToggle")?.addEventListener("change", renderCart);

  document.getElementById("clearCartBtn")?.addEventListener("click", () => {
    if (confirm("Clear cart?")) clearCart();
    updateQtyBadges();
    renderServices();
  });

  // ✅ now calls backend (real issuing)
  document.getElementById("downloadQuoteBtn")?.addEventListener("click", () => createDocument("quote"));
  document.getElementById("downloadInvoiceBtn")?.addEventListener("click", () => createDocument("invoice"));
});

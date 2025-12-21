import { jsPDF } from "jspdf";
import nodemailer from "nodemailer";
import fs from "fs";

const EXCHANGE_RATE = 3800;

export async function handler(event) {
  const data = JSON.parse(event.body);
  const { type, currency, vat, cart, client } = data;

  const number = `${type === "invoice" ? "INV" : "QTN"}-${Date.now()}`;
  const date = new Date().toLocaleDateString("en-UG");

  let subtotalUGX = 0;
  const items = [];

  for (const id in cart) {
    const svc = SERVICE_MAP[id];
    const qty = cart[id];
    const lineUGX = svc.price * qty;
    subtotalUGX += lineUGX;
    items.push({ ...svc, qty, lineUGX });
  }

  const vatUGX = vat ? subtotalUGX * 0.18 : 0;
  const totalUGX = subtotalUGX + vatUGX;

  const convert = n =>
    currency === "USD" ? n / EXCHANGE_RATE : n;

  const format = n =>
    currency === "USD" ? `$${n.toFixed(2)}` : `UGX ${Math.round(n).toLocaleString()}`;

  // ---- PDF ----
  const doc = new jsPDF();
  doc.text("Levor Energy Technologies (U) Ltd", 14, 18);
  doc.text(type.toUpperCase(), 14, 30);
  doc.text(`${number}`, 14, 36);
  doc.text(`Date: ${date}`, 150, 36);

  let y = 50;
  items.forEach(i => {
    doc.text(`${i.name} x ${i.qty}`, 14, y);
    doc.text(format(convert(i.lineUGX)), 180, y, { align: "right" });
    y += 8;
  });

  y += 6;
  doc.text(`Subtotal: ${format(convert(subtotalUGX))}`, 140, y);
  y += 6;
  doc.text(`VAT: ${format(convert(vatUGX))}`, 140, y);
  y += 6;
  doc.text(`TOTAL: ${format(convert(totalUGX))}`, 140, y);

  const pdfPath = `/tmp/${number}.pdf`;
  fs.writeFileSync(pdfPath, doc.output());

  // ---- EMAIL ----
  const transporter = nodemailer.createTransport({
    host: "smtp.yourhost.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: `"Levor Energy" <engineering@levorenergy.com>`,
    to: `${client.email}, engineering@levorenergy.com`,
    subject: `${type.toUpperCase()} ${number}`,
    text: `Attached is your ${type}.`,
    attachments: [{ filename: `${number}.pdf`, path: pdfPath }]
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ pdfUrl: `/downloads/${number}.pdf` })
  };
}

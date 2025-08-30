import { db } from '../lib/supabase';

export interface ReceiptData {
  id: string;
  timestamp: string;
  customer?: { name: string };
  items: Array<{
    name: string;
    type: "rental" | "product";
    quantity?: number;
    total: number;
    description?: string;
  }>;
  subtotal: number;
  tax: number;
  discount?: {
    type: "amount" | "percentage";
    value: number;
    amount: number;
  };
  total: number;
  paymentMethod: string;
  paymentAmount: number;
  change: number;
  cashier: string;
}

export interface RentalProofData {
  customerName: string;
  unitNumber: string;
  startTimestamp: string;
  mode:string
}

// export const generateReceiptHTML = async (tx: ReceiptData) => {
//   const settings = await db.settings.get();
//   const generalSettings = settings?.general || {};
//   const printerSettings = settings?.printer || {};

//   // Apply settings
//   const receiptWidth = printerSettings.receiptWidth || 48;
//   const receiptMargin = printerSettings.receiptMargin || 2;
//   const logoEnabled = printerSettings.logoEnabled || false;
//   const headerEnabled = printerSettings.headerEnabled || true;
//   const footerEnabled = printerSettings.footerEnabled || true;
//   const qrCodeEnabled = printerSettings.qrCodeEnabled || false;
//   const barcodeEnabled = printerSettings.barcodeEnabled || false;

//   const businessName = generalSettings.businessName || 'GAMING & BILLIARD CENTER';
//   const businessAddress = generalSettings.businessAddress || '';
//   const businessPhone = generalSettings.businessPhone || '';
//   const businessEmail = generalSettings.businessEmail || '';
//   const receiptFooter = generalSettings.receiptFooter || 'Terima kasih atas kunjungan Anda!';

//   return `
//     <html>
//       <head>
//         <title>Receipt - ${tx.id}</title>
//         <style>
//           body { 
//             font-family: 'Courier New', monospace; 
//             font-size: 12px; 
//             margin: 0; 
//             padding: 0;
//             background: white;
//           }
//           .receipt { 
//             width: ${receiptWidth}cm; 
//             margin: 0 auto; 
//             padding: ${receiptMargin}cm;
//             max-width: 100%;
//           }
//           .header { 
//             text-align: center; 
//             border-bottom: 1px dashed #000; 
//             padding-bottom: 10px; 
//             margin-bottom: 10px; 
//           }
//           .business-name {
//             font-size: 14px;
//             font-weight: bold;
//             margin-bottom: 5px;
//           }
//           .business-info {
//             font-size: 10px;
//             margin-bottom: 5px;
//           }
//           .item { 
//             display: flex; 
//             justify-content: space-between; 
//             margin: 3px 0; 
//             font-size: 11px;
//           }
//           .item-name {
//             flex: 1;
//             text-align: left;
//           }
//           .item-price {
//             text-align: right;
//             min-width: 80px;
//           }
//           .total { 
//             border-top: 1px dashed #000; 
//             padding-top: 10px; 
//             margin-top: 10px; 
//           }
//           .footer { 
//             text-align: center; 
//             margin-top: 20px; 
//             font-size: 10px; 
//             border-top: 1px dashed #000;
//             padding-top: 10px;
//           }
//           .qr-code {
//             text-align: center;
//             margin: 10px 0;
//           }
//           .barcode {
//             text-align: center;
//             margin: 10px 0;
//             font-family: 'Libre Barcode 39', monospace;
//             font-size: 20px;
//           }
//           @media print {
//             body { margin: 0; }
//             .receipt { width: 100%; }
//           }
//         </style>
//       </head>
//       <body>
//         <div class="receipt">
//           ${headerEnabled ? `
//           <div class="header">
//             ${logoEnabled ? `<div class="logo">[LOGO]</div>` : ''}
//             <div class="business-name">${businessName}</div>
//             ${businessAddress ? `<div class="business-info">${businessAddress}</div>` : ''}
//             ${businessPhone ? `<div class="business-info">${businessPhone}</div>` : ''}
//             ${businessEmail ? `<div class="business-info">${businessEmail}</div>` : ''}
//             <div class="business-info">Receipt: ${tx.id}</div>
//             <div class="business-info">${tx.timestamp}</div>
//             ${tx.customer ? `<div class="business-info">Customer: ${tx.customer.name}</div>` : ""}
//             <div class="business-info">Kasir: ${tx.cashier}</div>
//           </div>
//           ` : ''}
          
//           <div class="items">
//             ${tx.items
//               .map(
//                 (i) => `
//               <div class="item">
//                 <span class="item-name">${i.name} ${
//                   i.type === "product" ? `x${i.quantity ?? 1}` : ""
//                 }</span>
//                 <span class="item-price">Rp ${i.total.toLocaleString("id-ID")}</span>
//               </div>
//               ${
//                 i.description
//                   ? `<div style="font-size:10px;color:#666;margin-left:10px;">${i.description}</div>`
//                   : ""
//               }
//             `
//               )
//               .join("")}
//           </div>
          
//           <div class="total">
//             ${
//               tx.tax > 0
//                 ? `<div class="item"><span class="item-name">Pajak:</span><span class="item-price">Rp ${tx.tax.toLocaleString(
//                     "id-ID"
//                   )}</span></div>`
//                 : ""
//             }
//             ${
//               tx.discount
//                 ? `<div class="item"><span class="item-name">Subtotal:</span><span class="item-price">Rp ${(tx.total + tx.discount.amount).toLocaleString("id-ID")}</span></div>
//                 <div class="item" style="color: #059669;">
//                   <span class="item-name">Diskon (${tx.discount.type === "amount" ? "Rp" : "%"}${tx.discount.value.toLocaleString("id-ID")}):</span>
//                   <span class="item-price">- Rp ${tx.discount.amount.toLocaleString("id-ID")}</span>
//                 </div>`
//                 : ""
//             }
//             <div class="item" style="font-weight:bold;font-size:13px;">
//               <span class="item-name">TOTAL:</span>
//               <span class="item-price">Rp ${tx.total.toLocaleString("id-ID")}</span>
//             </div>
//             <div class="item">
//               <span class="item-name">Bayar (${tx.paymentMethod.toUpperCase()}):</span>
//               <span class="item-price">Rp ${tx.paymentAmount.toLocaleString("id-ID")}</span>
//             </div>
//             ${
//               tx.change > 0
//                 ? `<div class="item"><span class="item-name">Kembalian:</span><span class="item-price">Rp ${tx.change.toLocaleString(
//                     "id-ID"
//                   )}</span></div>`
//                 : ""
//             }
//           </div>
          
//           ${qrCodeEnabled ? `
//           <div class="qr-code">
//             <div style="font-size: 8px; margin-bottom: 5px;">QR Code untuk verifikasi</div>
//             <div style="font-family: monospace; font-size: 6px;">${tx.id}-${Date.now()}</div>
//           </div>
//           ` : ''}
          
//           ${barcodeEnabled ? `
//           <div class="barcode">
//             *${tx.id}*
//           </div>
//           ` : ''}
          
//           ${footerEnabled ? `
//           <div class="footer">
//             <p>${receiptFooter}</p>
//             <p>Selamat bermain dan nikmati waktu Anda</p>
//             <p>---</p>
//             <p>Simpan struk ini sebagai bukti pembayaran</p>
//           </div>
//           ` : ''}
//         </div>
//       </body>
//     </html>`;
// };

// export const generateReceiptHTMLTextMode = async (tx: ReceiptData) => {
//   const settings = await db.settings.get();
//   const generalSettings = settings?.general || {};
//   const printerSettings = settings?.printer || {};

//   const lineWidth = printerSettings.receiptWidth || 40; // karakter per baris
//   const pad = (text: string, width: number, align: "left" | "right" = "left") => {
//     if (align === "right") return text.toString().padStart(width);
//     return text.toString().padEnd(width);
//   };

//   const formatMoney = (amount: number) =>
//     "Rp " + amount.toLocaleString("id-ID");

//   const lines: string[] = [];

//   // HEADER
//   lines.push(pad(generalSettings.businessName || "GAMING & BILLIARD CENTER", lineWidth, "left"));
//   if (generalSettings.businessAddress) lines.push(pad(generalSettings.businessAddress, lineWidth));
//   if (generalSettings.businessPhone) lines.push(`Telp: ${generalSettings.businessPhone}`);
//   if (generalSettings.businessEmail) lines.push(`Email: ${generalSettings.businessEmail}`);
//   lines.push('-'.repeat(lineWidth));
//   lines.push(`Receipt ID: ${tx.id}`);
//   lines.push(`Tanggal   : ${tx.timestamp}`);
//   if (tx.customer) lines.push(`Customer  : ${tx.customer.name}`);
//   lines.push(`Kasir     : ${tx.cashier}`);
//   lines.push('-'.repeat(lineWidth));

//   // ITEMS
//   lines.push(pad("Item", 24) + pad("Qty", 4) + pad("Total", 12, "right"));
//   tx.items.forEach(item => {
//     const name = item.name.length > 24 ? item.name.slice(0, 24) : item.name;
//     const qty = item.type === "product" ? (item.quantity ?? 1).toString() : "-";
//     const total = formatMoney(item.total);
//     lines.push(pad(name, 24) + pad(qty, 4) + pad(total, 12, "right"));

//     if (item.description) {
//       const descLines = item.description.match(new RegExp(`.{1,${lineWidth - 2}}`, 'g')) || [];
//       descLines.forEach(dl => lines.push("  " + dl));
//     }
//   });

//   lines.push('-'.repeat(lineWidth));

//   // TAX / DISCOUNT / TOTAL
//   if (tx.tax > 0) {
//     lines.push(pad("Pajak:", 28) + pad(formatMoney(tx.tax), 12, "right"));
//   }

//   if (tx.discount) {
//     const beforeDiscount = tx.total + tx.discount.amount;
//     lines.push(pad("Subtotal:", 28) + pad(formatMoney(beforeDiscount), 12, "right"));
//     const discLabel = tx.discount.type === "amount"
//       ? `Diskon (Rp${tx.discount.value})`
//       : `Diskon (${tx.discount.value}%)`;
//     lines.push(pad(discLabel + ":", 28) + pad("-" + formatMoney(tx.discount.amount), 12, "right"));
//   }

//   lines.push(pad("TOTAL:", 28) + pad(formatMoney(tx.total), 12, "right"));
//   lines.push(pad(`Bayar (${tx.paymentMethod.toUpperCase()}):`, 28) + pad(formatMoney(tx.paymentAmount), 12, "right"));

//   if (tx.change > 0) {
//     lines.push(pad("Kembalian:", 28) + pad(formatMoney(tx.change), 12, "right"));
//   }

//   lines.push('-'.repeat(lineWidth));

//   // FOOTER
//   lines.push("Terima kasih atas kunjungan Anda!");
//   lines.push("Simpan struk ini sebagai bukti pembayaran");

//   const receiptText = lines.join("\n");

//   return `
//   <html>
//     <head>
//       <title>Receipt - ${tx.id}</title>
//       <style>
//         body {
//           font-family: 'Courier New', monospace;
//           font-size: 12px;
//           white-space: pre;
//           margin: 0;
//           padding: 10px;
//         }
//       </style>
//     </head>
//     <body>
// <pre>${receiptText}</pre>
//     </body>
//   </html>`;
// };

export const generateReceiptHTMLTextMode = async (tx: ReceiptData) => {
  const settings = await db.settings.get();
  const generalSettings = settings?.general || {};
  const printerSettings = settings?.printer || {};

  const lineWidth = printerSettings.receiptWidth || 40;

  const pad = (text: string, width: number, align: "left" | "right" = "left") => {
    if (align === "right") return text.toString().padStart(width);
    return text.toString().padEnd(width);
  };

  const formatMoney = (amount: number) =>
    "Rp " + amount.toLocaleString("id-ID");

  const lines: string[] = [];

  const center = (text: string) => {
    const space = Math.max(0, Math.floor((lineWidth - text.length) / 2));
    return ' '.repeat(space) + text;
  };

  // HEADER
  lines.push('='.repeat(lineWidth));
  lines.push(center(generalSettings.businessName?.toUpperCase() || "GAMING & BILLIARD CENTER"));
  if (generalSettings.businessAddress) lines.push(center(generalSettings.businessAddress));
  if (generalSettings.businessPhone) lines.push(center(`Telp: ${generalSettings.businessPhone}`));
  if (generalSettings.businessEmail) lines.push(center(`Email: ${generalSettings.businessEmail}`));
  lines.push('='.repeat(lineWidth));
  lines.push(pad(`RECEIPT ID : ${tx.id}`, lineWidth));
  lines.push(pad(`TANGGAL    : ${tx.timestamp}`, lineWidth));
  if (tx.customer) lines.push(pad(`CUSTOMER   : ${tx.customer.name}`, lineWidth));
  lines.push(pad(`KASIR      : ${tx.cashier}`, lineWidth));
  lines.push('-'.repeat(lineWidth));

  // ITEMS HEADER
  lines.push(pad("ITEM", 20) + pad("QTY", 5, "right") + pad("TOTAL", 15, "right"));
  lines.push('-'.repeat(lineWidth));

  // ITEMS LIST
  tx.items.forEach((item, index) => {
    const name = item.name.length > 20 ? item.name.slice(0, 20) : item.name;
    const qty = item.type === "product" ? (item.quantity ?? 1).toString() : "-";
    const total = formatMoney(item.total);
    lines.push(pad(name, 20) + pad(qty, 5, "right") + pad(total, 15, "right"));

    if (item.description) {
      const descLines = item.description.match(new RegExp(`.{1,${lineWidth - 4}}`, 'g')) || [];
      descLines.forEach(dl => lines.push("  - " + dl));
    }
  });

  lines.push('-'.repeat(lineWidth));

  // TAX / DISCOUNT / TOTAL
  if (tx.tax > 0) {
    lines.push(pad("PAJAK:", 25) + pad(formatMoney(tx.tax), 15, "right"));
  }

  if (tx.discount) {
    const beforeDiscount = tx.total + tx.discount.amount;
    lines.push(pad("SUBTOTAL:", 25) + pad(formatMoney(beforeDiscount), 15, "right"));
    const discLabel = tx.discount.type === "amount"
      ? `DISKON (Rp${tx.discount.value})`
      : `DISKON (${tx.discount.value}%)`;
    lines.push(pad(discLabel + ":", 25) + pad("-" + formatMoney(tx.discount.amount), 15, "right"));
  }

  lines.push('='.repeat(lineWidth));
  lines.push(pad("TOTAL :", 25) + pad(formatMoney(tx.total), 15, "right"));
  lines.push(pad(`BAYAR (${tx.paymentMethod.toUpperCase()}):`, 25) + pad(formatMoney(tx.paymentAmount), 15, "right"));

  if (tx.change > 0) {
    lines.push(pad("KEMBALIAN :", 25) + pad(formatMoney(tx.change), 15, "right"));
  }
  lines.push('='.repeat(lineWidth));

  // FOOTER
  lines.push(center("TERIMA KASIH"));
  lines.push(center("ATAS KUNJUNGAN ANDA"));
  lines.push(center("STRUK INI ADALAH BUKTI PEMBAYARAN"));

  const receiptText = lines.join("\n");

  return `
  <html>
    <head>
      <title>Receipt - ${tx.id}</title>
      <style>
        @media print {
          @page {
            size: auto;
            margin: 0mm;
          }
          body {
            margin: 0;
          }
        }

        body {
          font-family: 'Courier New', monospace;
          font-size: ${printerSettings.fontSize}pt;
          white-space: pre;
          margin: 0;
          padding: 0;
        }

        pre {
          margin: 0;
          padding: ${printerSettings.padding}px;
        }
      </style>
    </head>
    <body>
<pre>${receiptText}</pre>
    </body>
  </html>`;
};

export const generateRentalProofHTML = async (data: RentalProofData) => {
  const settings = await db.settings.get();
  const generalSettings = settings?.general || {};
  const printerSettings = settings?.printer || {};

  const lineWidth = printerSettings.receiptWidth || 40;

  const pad = (text: string, width: number, align: "left" | "right" = "left") => {
    if (align === "right") return text.toString().padStart(width);
    return text.toString().padEnd(width);
  };

  const center = (text: string) => {
    const space = Math.max(0, Math.floor((lineWidth - text.length) / 2));
    return ' '.repeat(space) + text;
  };

  const lines: string[] = [];

  // HEADER
  lines.push('='.repeat(lineWidth));
  lines.push(center(generalSettings.businessName?.toUpperCase() || "GAMING & BILLIARD CENTER"));
  if (generalSettings.businessAddress) lines.push(center(generalSettings.businessAddress));
  if (generalSettings.businessPhone) lines.push(center(`Telp: ${generalSettings.businessPhone}`));
  lines.push('='.repeat(lineWidth));

  // TITLE
  lines.push(center("BUKTI RENTAL"));
  lines.push('-'.repeat(lineWidth));

  // DATA RENTAL
  lines.push(pad(`Customer : ${data.customerName}`, lineWidth));
  lines.push(pad(`Mode    : ${data.mode}`, lineWidth));
  lines.push(pad(`No Unit  : ${data.unitNumber}`, lineWidth));
  lines.push(pad(`Mulai    : ${data.startTimestamp}`, lineWidth));

  lines.push('='.repeat(lineWidth));

  // FOOTER
  lines.push(center("HARAP SIMPAN BUKTI INI"));
  lines.push(center("TERIMA KASIH"));

  const proofText = lines.join("\n");

  return `
  <html>
    <head>
      <title>Bukti Rental</title>
      <style>
        @media print {
          @page {
            size: auto;
            margin: 0mm;
          }
          body {
            margin: 0;
          }
        }

        body {
          font-family: 'Courier New', monospace;
          font-size: ${printerSettings.fontSize}pt;
          white-space: pre;
          margin: 0;
          padding: 0;
        }

        pre {
          margin: 0;
          padding: ${printerSettings.padding}px;
        }
      </style>
    </head>
    <body>
<pre>${proofText}</pre>
    </body>
  </html>`;
};

export const printReceipt = async (tx: ReceiptData) => {
  try {
    const html = await generateReceiptHTMLTextMode(tx);

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();

    const doPrint = () => {
      try {
        win.print();
      } finally {
        win.close();
      }
    };

    if ("onload" in win) {
      win.onload = () => setTimeout(doPrint, 100);
    } else {
      setTimeout(doPrint, 200);
    }
  } catch (error) {
    console.error("Error printing receipt:", error);
    alert("Gagal mencetak struk. Silakan coba lagi.");
  }
};

export const printRentalProof = async(data: RentalProofData) => {
  const html = await generateRentalProofHTML(data);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  const doPrint = () => {
    try {
      win.print();
    } finally {
      win.close();
    }
  };

  if ("onload" in win) {
    win.onload = () => setTimeout(doPrint, 100);
  } else {
    setTimeout(doPrint, 200);
  }
};


// export const printReceipt = async (tx: ReceiptData) => {
//   try {
//     const html = await generateReceiptHTML(tx);
    
//     const win = window.open("", "_blank");
//     if (!win) return;

//     win.document.open();
//     win.document.write(html);
//     win.document.close();
//     win.focus();

//     const doPrint = () => {
//       try {
//         win.print();
//       } finally {
//         /* opsional: win.close(); */
//       }
//     };
    
//     if ("onload" in win) {
//       win.onload = () => setTimeout(doPrint, 100);
//     } else {
//       setTimeout(doPrint, 200);
//     }
//   } catch (error) {
//     console.error('Error printing receipt:', error);
//     alert('Gagal mencetak struk. Silakan coba lagi.');
//   }
// };
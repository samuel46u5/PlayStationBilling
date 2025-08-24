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

export const generateReceiptHTML = async (tx: ReceiptData) => {
  const settings = await db.settings.get();
  const generalSettings = settings?.general || {};
  const printerSettings = settings?.printer || {};

  // Apply settings
  const receiptWidth = printerSettings.receiptWidth || 48;
  const receiptMargin = printerSettings.receiptMargin || 2;
  const logoEnabled = printerSettings.logoEnabled || false;
  const headerEnabled = printerSettings.headerEnabled || true;
  const footerEnabled = printerSettings.footerEnabled || true;
  const qrCodeEnabled = printerSettings.qrCodeEnabled || false;
  const barcodeEnabled = printerSettings.barcodeEnabled || false;

  const businessName = generalSettings.businessName || 'GAMING & BILLIARD CENTER';
  const businessAddress = generalSettings.businessAddress || '';
  const businessPhone = generalSettings.businessPhone || '';
  const businessEmail = generalSettings.businessEmail || '';
  const receiptFooter = generalSettings.receiptFooter || 'Terima kasih atas kunjungan Anda!';

  return `
    <html>
      <head>
        <title>Receipt - ${tx.id}</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            margin: 0; 
            padding: 0;
            background: white;
          }
          .receipt { 
            width: ${receiptWidth}cm; 
            margin: 0 auto; 
            padding: ${receiptMargin}cm;
            max-width: 100%;
          }
          .header { 
            text-align: center; 
            border-bottom: 1px dashed #000; 
            padding-bottom: 10px; 
            margin-bottom: 10px; 
          }
          .business-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .business-info {
            font-size: 10px;
            margin-bottom: 5px;
          }
          .item { 
            display: flex; 
            justify-content: space-between; 
            margin: 3px 0; 
            font-size: 11px;
          }
          .item-name {
            flex: 1;
            text-align: left;
          }
          .item-price {
            text-align: right;
            min-width: 80px;
          }
          .total { 
            border-top: 1px dashed #000; 
            padding-top: 10px; 
            margin-top: 10px; 
          }
          .footer { 
            text-align: center; 
            margin-top: 20px; 
            font-size: 10px; 
            border-top: 1px dashed #000;
            padding-top: 10px;
          }
          .qr-code {
            text-align: center;
            margin: 10px 0;
          }
          .barcode {
            text-align: center;
            margin: 10px 0;
            font-family: 'Libre Barcode 39', monospace;
            font-size: 20px;
          }
          @media print {
            body { margin: 0; }
            .receipt { width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          ${headerEnabled ? `
          <div class="header">
            ${logoEnabled ? `<div class="logo">[LOGO]</div>` : ''}
            <div class="business-name">${businessName}</div>
            ${businessAddress ? `<div class="business-info">${businessAddress}</div>` : ''}
            ${businessPhone ? `<div class="business-info">${businessPhone}</div>` : ''}
            ${businessEmail ? `<div class="business-info">${businessEmail}</div>` : ''}
            <div class="business-info">Receipt: ${tx.id}</div>
            <div class="business-info">${tx.timestamp}</div>
            ${tx.customer ? `<div class="business-info">Customer: ${tx.customer.name}</div>` : ""}
            <div class="business-info">Kasir: ${tx.cashier}</div>
          </div>
          ` : ''}
          
          <div class="items">
            ${tx.items
              .map(
                (i) => `
              <div class="item">
                <span class="item-name">${i.name} ${
                  i.type === "product" ? `x${i.quantity ?? 1}` : ""
                }</span>
                <span class="item-price">Rp ${i.total.toLocaleString("id-ID")}</span>
              </div>
              ${
                i.description
                  ? `<div style="font-size:10px;color:#666;margin-left:10px;">${i.description}</div>`
                  : ""
              }
            `
              )
              .join("")}
          </div>
          
          <div class="total">
            ${
              tx.tax > 0
                ? `<div class="item"><span class="item-name">Pajak:</span><span class="item-price">Rp ${tx.tax.toLocaleString(
                    "id-ID"
                  )}</span></div>`
                : ""
            }
            ${
              tx.discount
                ? `<div class="item"><span class="item-name">Subtotal:</span><span class="item-price">Rp ${(tx.total + tx.discount.amount).toLocaleString("id-ID")}</span></div>
                <div class="item" style="color: #059669;">
                  <span class="item-name">Diskon (${tx.discount.type === "amount" ? "Rp" : "%"}${tx.discount.value.toLocaleString("id-ID")}):</span>
                  <span class="item-price">- Rp ${tx.discount.amount.toLocaleString("id-ID")}</span>
                </div>`
                : ""
            }
            <div class="item" style="font-weight:bold;font-size:13px;">
              <span class="item-name">TOTAL:</span>
              <span class="item-price">Rp ${tx.total.toLocaleString("id-ID")}</span>
            </div>
            <div class="item">
              <span class="item-name">Bayar (${tx.paymentMethod.toUpperCase()}):</span>
              <span class="item-price">Rp ${tx.paymentAmount.toLocaleString("id-ID")}</span>
            </div>
            ${
              tx.change > 0
                ? `<div class="item"><span class="item-name">Kembalian:</span><span class="item-price">Rp ${tx.change.toLocaleString(
                    "id-ID"
                  )}</span></div>`
                : ""
            }
          </div>
          
          ${qrCodeEnabled ? `
          <div class="qr-code">
            <div style="font-size: 8px; margin-bottom: 5px;">QR Code untuk verifikasi</div>
            <div style="font-family: monospace; font-size: 6px;">${tx.id}-${Date.now()}</div>
          </div>
          ` : ''}
          
          ${barcodeEnabled ? `
          <div class="barcode">
            *${tx.id}*
          </div>
          ` : ''}
          
          ${footerEnabled ? `
          <div class="footer">
            <p>${receiptFooter}</p>
            <p>Selamat bermain dan nikmati waktu Anda</p>
            <p>---</p>
            <p>Simpan struk ini sebagai bukti pembayaran</p>
          </div>
          ` : ''}
        </div>
      </body>
    </html>`;
};

export const printReceipt = async (tx: ReceiptData) => {
  try {
    const html = await generateReceiptHTML(tx);
    
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
        /* opsional: win.close(); */
      }
    };
    
    if ("onload" in win) {
      win.onload = () => setTimeout(doPrint, 100);
    } else {
      setTimeout(doPrint, 200);
    }
  } catch (error) {
    console.error('Error printing receipt:', error);
    alert('Gagal mencetak struk. Silakan coba lagi.');
  }
};
import { db } from "../lib/supabase";

export interface ReceiptData {
  id: string;
  timestamp: string;
  customer?: { name: string };
  items: Array<{
    name: string;
    type: "rental" | "product" | "voucher";
    quantity?: number;
    total: number;
    description?: string;
  }>;
  subtotal: number;
  tax?: number;
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
  mode: string;
}

export interface ProductPriceList {
  id: string;
  name: string;
  category: string;
  price: number;
}

export interface StockOpnameData {
  nomor: string;
  tanggal: string;
  staf: string;
  items: Array<{
    productName: string;
    physicalStock: number;
  }>;
}

export const generateReceiptHTMLTextMode = async (tx: ReceiptData) => {
  const settings = await db.settings.get();
  const generalSettings = settings?.general || {};
  const printerSettings = settings?.printer || {};

  const lineWidth = printerSettings.receiptWidth || 40;

  const pad = (
    text: string,
    width: number,
    align: "left" | "right" = "left"
  ) => {
    if (align === "right") return text.toString().padStart(width);
    return text.toString().padEnd(width);
  };

  const formatMoney = (amount: number) =>
    "Rp " + amount.toLocaleString("id-ID");

  const lines: string[] = [];

  const center = (text: string) => {
    const space = Math.max(0, Math.floor((lineWidth - text.length) / 2));
    return " ".repeat(space) + text;
  };

  // HEADER
  // lines.push("=".repeat(lineWidth));
  // lines.push(
  //   center(
  //     generalSettings.businessName?.toUpperCase() || "GAMING & BILLIARD CENTER"
  //   )
  // );
  // if (generalSettings.businessAddress)
  //   lines.push(center(generalSettings.businessAddress));
  // if (generalSettings.businessPhone)
  //   lines.push(center(`Telp: ${generalSettings.businessPhone}`));
  // if (generalSettings.businessEmail)
  //   lines.push(center(`Email: ${generalSettings.businessEmail}`));
  // lines.push("=".repeat(lineWidth));
  // lines.push(pad(`RECEIPT ID : ${tx.id}`, lineWidth));
  lines.push(pad(`TANGGAL    : ${tx.timestamp}`, lineWidth));
  // if (tx.customer)
  //   lines.push(pad(`CUSTOMER   : ${tx.customer.name}`, lineWidth));
  lines.push(pad(`KASIR      : ${tx.cashier}`, lineWidth));
  lines.push("-".repeat(lineWidth));

  // ITEMS HEADER
  // lines.push(
  //   pad("ITEM", 20) + pad("QTY", 5, "right") + pad("TOTAL", 15, "right")
  // );
  // lines.push("-".repeat(lineWidth));

  // ITEMS LIST
  tx.items.forEach((item, index) => {
    const name = item.name.length > 20 ? item.name.slice(0, 20) : item.name;
    const qty = item.type === "product" ? (item.quantity ?? 1).toString() : "-";
    const total = formatMoney(item.total);
    lines.push(pad(name, 20) + pad(qty, 5, "right") + pad(total, 15, "right"));

    if (item.description) {
      const descLines =
        item.description.match(new RegExp(`.{1,${lineWidth - 4}}`, "g")) || [];
      descLines.forEach((dl) => lines.push("  - " + dl));
    }
  });

  lines.push("-".repeat(lineWidth));

  // TAX / DISCOUNT / TOTAL
  if (tx.tax > 0) {
    lines.push(pad("PAJAK:", 25) + pad(formatMoney(tx.tax), 15, "right"));
  }

  if (tx.discount) {
    const beforeDiscount = tx.total + tx.discount.amount;
    lines.push(
      pad("SUBTOTAL:", 25) + pad(formatMoney(beforeDiscount), 15, "right")
    );
    const discLabel =
      tx.discount.type === "amount"
        ? `DISKON (Rp${tx.discount.value})`
        : `DISKON (${tx.discount.value}%)`;
    lines.push(
      pad(discLabel + ":", 25) +
        pad("-" + formatMoney(tx.discount.amount), 15, "right")
    );
  }

  // lines.push("=".repeat(lineWidth));
  lines.push(pad("TOTAL :", 25) + pad(formatMoney(tx.total), 15, "right"));
  lines.push(
    pad(`BAYAR (${tx.paymentMethod.toUpperCase()}):`, 25) +
      pad(formatMoney(tx.paymentAmount), 15, "right")
  );

  if (tx.change > 0) {
    lines.push(
      pad("KEMBALIAN :", 25) + pad(formatMoney(tx.change), 15, "right")
    );
  }
  // lines.push("=".repeat(lineWidth));

  // FOOTER
  // lines.push(center("TERIMA KASIH"));
  // lines.push(center("ATAS KUNJUNGAN ANDA"));
  // lines.push(center("STRUK INI ADALAH BUKTI PEMBAYARAN"));

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

  const pad = (
    text: string,
    width: number,
    align: "left" | "right" = "left"
  ) => {
    if (align === "right") return text.toString().padStart(width);
    return text.toString().padEnd(width);
  };

  const center = (text: string) => {
    const space = Math.max(0, Math.floor((lineWidth - text.length) / 2));
    return " ".repeat(space) + text;
  };

  const lines: string[] = [];

  // HEADER
  // lines.push("=".repeat(lineWidth));
  // lines.push(
  //   center(
  //     generalSettings.businessName?.toUpperCase() || "GAMING & BILLIARD CENTER"
  //   )
  // );
  // if (generalSettings.businessAddress)
  //   lines.push(center(generalSettings.businessAddress));
  // if (generalSettings.businessPhone)
  //   lines.push(center(`Telp: ${generalSettings.businessPhone}`));
  // lines.push("=".repeat(lineWidth));

  // TITLE
  lines.push(center("BUKTI RENTAL"));
  lines.push("-".repeat(lineWidth));

  // DATA RENTAL
  // lines.push(pad(`Customer : ${data.customerName}`, lineWidth));
  lines.push(pad(`Mode     : ${data.mode}`, lineWidth));
  lines.push(pad(`No Unit  : ${data.unitNumber}`, lineWidth));
  lines.push(pad(`Mulai    : ${data.startTimestamp}`, lineWidth));

  // lines.push("=".repeat(lineWidth));

  // FOOTER
  // lines.push(center("HARAP SIMPAN BUKTI INI"));
  // lines.push(center("TERIMA KASIH"));

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

export const generatePriceListHTMLTextMode = async (
  products: ProductPriceList[]
) => {
  const settings = await db.settings.get();
  const generalSettings = settings?.general || {};
  const printerSettings = settings?.printer || {};
  const lineWidth = printerSettings.receiptWidth || 40;

  const pad = (
    text: string,
    width: number,
    align: "left" | "right" = "left"
  ) => {
    if (align === "right") return text.toString().padStart(width);
    return text.toString().padEnd(width);
  };

  const center = (text: string) => {
    const space = Math.max(0, Math.floor((lineWidth - text.length) / 2));
    return " ".repeat(space) + text;
  };

  const formatMoney = (amount: number) =>
    "Rp " + amount.toLocaleString("id-ID");

  const lines: string[] = [];

  const currentDate = new Date().toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // HEADER
  lines.push("=".repeat(lineWidth));
  lines.push(center("DAFTAR HARGA PRODUK"));
  lines.push(
    center(
      generalSettings.businessName?.toUpperCase() || "GAMING & BILLIARD CENTER"
    )
  );
  if (generalSettings.businessAddress)
    lines.push(center(generalSettings.businessAddress));
  if (generalSettings.businessPhone)
    lines.push(center(`Telp: ${generalSettings.businessPhone}`));
  lines.push(center(`Tanggal: ${currentDate}`));
  lines.push("=".repeat(lineWidth));

  // TABLE HEADER
  lines.push(pad("NAMA PRODUK", 20) + pad("HARGA", 20, "right"));
  lines.push("-".repeat(lineWidth));

  // PRODUCT LIST
  products.forEach((product: ProductPriceList) => {
    const name =
      product.name.length > 20 ? product.name.slice(0, 20) : product.name;
    // const category = product.category?.length > 10 ? product.category.slice(0, 10) : product.category;
    const price = formatMoney(product.price);
    lines.push(pad(name, 20) + pad(price, 20, "right"));
  });

  lines.push("-".repeat(lineWidth));
  lines.push(pad(`TOTAL PRODUK: ${products.length} item`, lineWidth));
  lines.push("=".repeat(lineWidth));

  const priceListText = lines.join("\n");

  return `
  <html>
    <head>
      <title>Daftar Harga Produk</title>
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
          font-size: ${printerSettings.fontSize || 10}pt;
          white-space: pre;
          margin: 0;
          padding: 0;
        }
        pre {
          margin: 0;
          padding: ${printerSettings.padding || 10}px;
        }
      </style>
    </head>
    <body>
      <pre>${priceListText}</pre>
    </body>
  </html>
  `;
};

export const generateStockOpnameHTMLTextMode = async (data: StockOpnameData) => {
  const settings = await db.settings.get();
  const generalSettings = settings?.general || {};
  const printerSettings = settings?.printer || {};

  const lineWidth = printerSettings.receiptWidth || 40;

  const pad = (
    text: string,
    width: number,
    align: "left" | "right" = "left"
  ) => {
    if (align === "right") return text.toString().padStart(width);
    return text.toString().padEnd(width);
  };

  const center = (text: string) => {
    const space = Math.max(0, Math.floor((lineWidth - text.length) / 2));
    return " ".repeat(space) + text;
  };

  const lines: string[] = [];

  // HEADER
  lines.push(center("====== STOK OPNAME ======"));
  lines.push("");
  lines.push(pad(`Tanggal : ${data.tanggal}`, lineWidth));
  lines.push(pad(`Staf    : ${data.staf}`, lineWidth));
  lines.push("-".repeat(lineWidth));
  lines.push(pad("Nama Produk", 28) + pad("Stok", 12, "right"));
  lines.push("-".repeat(lineWidth));

  // ITEMS LIST
  data.items.forEach((item) => {
    const nameMax = 28;
    const stockWidth = 12;
    let name = item.productName;

    if (name.length > nameMax) {
      name = name.slice(0, nameMax - 1) + "…";
    }

    const dots = ".".repeat(Math.max(1, lineWidth - name.length - item.physicalStock.toString().length));
    lines.push(`${name}${dots}${item.physicalStock}`);
  });

  lines.push("-".repeat(lineWidth));
  lines.push(pad(`Total Item: ${data.items.length}`, lineWidth));

  const stockOpnameText = lines.join("\n");

  return `
  <html>
    <head>
      <title>Stok Opname - ${data.nomor}</title>
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
          font-size: ${printerSettings.fontSize || 10}pt;
          white-space: pre;
          margin: 0;
          padding: 0;
        }

        pre {
          margin: 0;
          padding: ${printerSettings.padding || 10}px;
        }
      </style>
    </head>
    <body>
      <pre>${stockOpnameText}</pre>
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

export const printRentalProof = async (data: RentalProofData) => {
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

export const printPriceList = async (products: ProductPriceList[]) => {
  try {
    const html = await generatePriceListHTMLTextMode(products);

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
    console.error("Error printing price list:", error);
    alert("Gagal mencetak daftar harga. Silakan coba lagi.");
  }
};

export const printStockOpname = async (data: StockOpnameData) => {
  try {
    const html = await generateStockOpnameHTMLTextMode(data);

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
    console.error("Error printing stock opname:", error);
    alert("Gagal mencetak stok opname. Silakan coba lagi.");
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

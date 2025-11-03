import jsPDF from 'jspdf';
import { getActiveCompanyName } from '../../utils/companyUtils';

const exportStickerToPDF = (packing, packingBoxes) => {
  if (!packing || !packingBoxes || packingBoxes.length === 0) {
    alert('Tidak ada data untuk dicetak');
    return;
  }

  // Generate stickers for each box
  const stickers = [];
  packingBoxes.forEach((box) => {
    const boxItems = box.packingBoxItems || [];

    // For mixed carton (multiple items in box)
    if (boxItems.length > 1) {
      const itemNames = boxItems.map((item) => item.nama_barang).join(' + ');
      const totalQty = box.total_quantity_in_box;

      stickers.push({
        boxNumber: box.no_box,
        itemName: itemNames,
        itemDescription: 'Mixed Carton',
        quantity: totalQty,
        stickerNumber: stickers.length + 1,
        isMixed: true,
      });
    } else if (boxItems.length === 1) {
      // Full or partial carton (single item)
      const item = boxItems[0];
      stickers.push({
        boxNumber: box.no_box,
        itemName: item.nama_barang,
        itemDescription: item.keterangan || '',
        quantity: item.quantity,
        stickerNumber: stickers.length + 1,
        isMixed: false,
      });
    }
  });

  if (stickers.length === 0) {
    alert('Tidak ada stiker yang dapat digenerate.');
    return;
  }

  const totalStickers = stickers.length;
  const poNumber = packing.purchaseOrder?.po_number || 'N/A';

  // Get customer data from various possible fields
  const companyName = getActiveCompanyName(
    packing?.company,
    packing?.purchaseOrder?.company,
    packing?.purchaseOrder?.companyProfile,
    packing?.purchaseOrder,
    packing
  );
  const customerName =
    packing.purchaseOrder?.customer?.namaCustomer ||
    packing.purchaseOrder?.customer?.customer_name ||
    packing.purchaseOrder?.customer?.name ||
    'N/A';
  const customerAddress =
    packing.purchaseOrder?.customer?.alamatPengiriman ||
    packing.purchaseOrder?.customer?.alamat ||
    '';

  // Create PDF with custom size: 27cm x 21cm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [210, 270], // height x width in landscape
  });

  // Custom dimensions: 270mm x 210mm
  const pageWidth = 270;
  const pageHeight = 210;

  // Sticker dimensions (2x2 grid): 13.5cm x 10.5cm each
  const stickerWidth = 135;
  const stickerHeight = 105;
  const margin = 0;
  const gap = 0;

  let currentPage = 0;

  stickers.forEach((sticker, index) => {
    const positionInPage = index % 4;

    // Add new page if needed
    if (positionInPage === 0 && index > 0) {
      pdf.addPage();
      currentPage++;
    }

    // Calculate position (2x2 grid)
    const col = positionInPage % 2;
    const row = Math.floor(positionInPage / 2);
    const x = margin + col * (stickerWidth + gap);
    const y = margin + row * (stickerHeight + gap);

    // Draw sticker border
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, stickerWidth, stickerHeight);

    // Header - Company Name
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    const headerY = y + 10;
    pdf.text(companyName, x + stickerWidth / 2, headerY, { align: 'center' });

    // Mixed Carton Badge (if applicable)
    if (sticker.isMixed) {
      pdf.setFillColor(255, 165, 0); // Orange
      pdf.rect(x + 5, y + 3, 25, 7, 'F');
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255); // White text
      pdf.setFont('helvetica', 'bold');
      pdf.text('MIXED', x + 17.5, y + 7.5, { align: 'center' });
      pdf.setTextColor(0, 0, 0); // Reset to black
    }

    // Box Number (top right)
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(sticker.boxNumber || '', x + stickerWidth - 7, y + 7, {
      align: 'right',
    });

    // Line below header
    pdf.setLineWidth(0.3);
    pdf.line(x + 5, headerY + 3, x + stickerWidth - 5, headerY + 3);

    // Title section top line
    const titleY = headerY + 15;
    pdf.line(x + 5, titleY - 5, x + stickerWidth - 5, titleY - 5);

    // Customer and PO Number with grid layout
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');

    // Calculate grid widths (60% for customer, 40% for PO)
    const leftColumnWidth = (stickerWidth - 14) * 0.6;
    const rightColumnWidth = (stickerWidth - 14) * 0.4;
    const leftColumnX = x + 7;

    // Prepare left column text (customer name + address)
    let leftColumnText = customerName;
    if (customerAddress) {
      leftColumnText += `\n${customerAddress}`;
    }
    const customerLines = pdf.splitTextToSize(leftColumnText, leftColumnWidth);

    // Prepare right column text (PO number)
    const poText = `No. PO\n${poNumber}`;
    const poLines = pdf.splitTextToSize(poText, rightColumnWidth);

    // Draw customer name and address (left column - left aligned)
    let currentY = titleY;
    customerLines.forEach((line, i) => {
      pdf.text(line, leftColumnX, currentY + i * 5, { align: 'left' });
    });

    // Draw PO number (right column - right aligned)
    currentY = titleY;
    poLines.forEach((line, i) => {
      pdf.text(line, x + stickerWidth - 7, currentY + i * 5, {
        align: 'right',
      });
    });

    // Calculate the tallest column height
    const maxLines = Math.max(customerLines.length, poLines.length);
    const titleSectionHeight = maxLines * 5;

    // Title section bottom line
    pdf.line(
      x + 5,
      titleY + titleSectionHeight,
      x + stickerWidth - 5,
      titleY + titleSectionHeight
    );

    // Content - Item name and description
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    let contentText = sticker.itemName;
    if (sticker.itemDescription) {
      contentText += `\n${sticker.itemDescription}`;
    }
    contentText += ` = ${sticker.quantity} PCS`;

    const lines = pdf.splitTextToSize(contentText, stickerWidth - 14);
    const lineHeight = 5;
    const totalContentHeight = lines.length * lineHeight;

    // Calculate available space for content (between title section and footer)
    const titleEndY = titleY + titleSectionHeight;
    const footerStartY = y + stickerHeight - 13;
    const availableSpace = footerStartY - titleEndY;
    const contentY = titleEndY + availableSpace / 2 - totalContentHeight / 2;

    lines.forEach((line, i) => {
      pdf.text(line, x + stickerWidth / 2, contentY + i * lineHeight, {
        align: 'center',
      });
    });

    // Footer - Sticker number
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    const footerY = y + stickerHeight - 8;

    // Footer top line
    pdf.setLineWidth(0.3);
    pdf.line(x + 5, footerY - 5, x + stickerWidth - 5, footerY - 5);

    const footerText = `${sticker.stickerNumber} OF ${totalStickers}`;
    pdf.text(footerText, x + stickerWidth / 2, footerY, { align: 'center' });
  });

  // Save PDF
  const fileName = `Stiker_Packing_${poNumber}_${new Date().getTime()}.pdf`;
  pdf.save(fileName);

  return pdf;
};

const printSticker = (packing, packingBoxes) => {
  if (!packing || !packingBoxes || packingBoxes.length === 0) {
    alert('Tidak ada data untuk dicetak');
    return;
  }

  // Generate stickers for each box
  const stickers = [];
  packingBoxes.forEach((box) => {
    const boxItems = box.packingBoxItems || [];

    // For mixed carton (multiple items in box)
    if (boxItems.length > 1) {
      const itemNames = boxItems.map((item) => item.nama_barang).join(' + ');
      const totalQty = box.total_quantity_in_box;

      stickers.push({
        boxNumber: box.no_box,
        itemName: itemNames,
        itemDescription: 'Mixed Carton',
        quantity: totalQty,
        stickerNumber: stickers.length + 1,
        isMixed: true,
      });
    } else if (boxItems.length === 1) {
      // Full or partial carton (single item)
      const item = boxItems[0];
      stickers.push({
        boxNumber: box.no_box,
        itemName: item.nama_barang,
        itemDescription: item.keterangan || '',
        quantity: item.quantity,
        stickerNumber: stickers.length + 1,
        isMixed: false,
      });
    }
  });

  if (stickers.length === 0) {
    alert('Tidak ada stiker yang dapat digenerate.');
    return;
  }

  const totalStickers = stickers.length;
  const poNumber = packing.purchaseOrder?.po_number || 'N/A';

  // Get customer data
  const companyName = getActiveCompanyName(
    packing?.company,
    packing?.purchaseOrder?.company,
    packing?.purchaseOrder?.companyProfile,
    packing?.purchaseOrder,
    packing
  );
  const customerName =
    packing.purchaseOrder?.customer?.namaCustomer ||
    packing.purchaseOrder?.customer?.customer_name ||
    packing.purchaseOrder?.customer?.name ||
    'N/A';
  const customerAddress =
    packing.purchaseOrder?.customer?.alamatPengiriman ||
    packing.purchaseOrder?.customer?.alamat ||
    '';

  // Generate HTML for stickers
  const generateStickersHTML = () => {
    let pagesHTML = '';

    for (let i = 0; i < stickers.length; i += 4) {
      const pageStickers = stickers.slice(i, i + 4);
      let stickersHTML = '';

      pageStickers.forEach((sticker) => {
        const leftColumn = customerAddress
          ? `${customerName}<br>${customerAddress}`
          : customerName;

        const content = sticker.itemDescription
          ? `${sticker.itemName}<br>${sticker.itemDescription} = ${sticker.quantity} PCS`
          : `${sticker.itemName} = ${sticker.quantity} PCS`;

        stickersHTML += `
          <div class="sticker">
            <div class="sticker-header">${companyName}</div>
            <div class="sticker-title">
              <div class="left-column">${leftColumn}</div>
              <div class="right-column">No. PO<br>${poNumber}</div>
            </div>
            <div class="sticker-content">${content}</div>
            <div class="sticker-footer">
              <span class="sticker-number">${sticker.stickerNumber}</span> OF <span class="sticker-total">${totalStickers}</span>
            </div>
          </div>
        `;
      });

      pagesHTML += `<div class="page">${stickersHTML}</div>`;
    }

    return pagesHTML;
  };

  // Create print container
  const printContainer = document.createElement('div');
  printContainer.id = 'print-sticker-container';
  printContainer.innerHTML = `
    <style>
      @media print {
        body * {
          visibility: hidden;
        }
        #print-sticker-container,
        #print-sticker-container * {
          visibility: visible;
        }
        #print-sticker-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }

      @page {
        size: 270mm 210mm;
        margin: 0;
      }

      .page {
        width: 270mm;
        min-height: 210mm;
        background: white;
        margin: 0 auto;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(2, 135mm);
        grid-template-rows: repeat(2, 105mm);
        gap: 0;
        page-break-after: always;
      }

      .page:last-child {
        page-break-after: auto;
      }

      .sticker {
        border: 2px solid #000;
        padding: 6mm;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: white;
        page-break-inside: avoid;
      }

      .sticker-header {
        text-align: center;
        font-size: 14pt;
        font-weight: normal;
        margin-bottom: 4mm;
        padding-bottom: 2mm;
        border-bottom: 1px solid #000;
      }

      .sticker-title {
        display: flex;
        justify-content: space-between;
        font-size: 12pt;
        font-weight: bold;
        margin-bottom: 4mm;
        padding: 2mm 0;
        border-top: 1px solid #000;
        border-bottom: 1px solid #000;
        gap: 2mm;
      }

      .left-column {
        flex: 0 0 60%;
        text-align: left;
      }

      .right-column {
        flex: 0 0 40%;
        text-align: right;
      }

      .sticker-content {
        text-align: center;
        font-size: 10pt;
        line-height: 1.5;
        margin: 5mm 0;
        flex-grow: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sticker-footer {
        text-align: center;
        font-size: 14pt;
        font-weight: bold;
        padding: 3mm 0;
        border-top: 1px solid #000;
      }

      .sticker-number, .sticker-total {
        font-weight: bold;
      }
    </style>
    ${generateStickersHTML()}
  `;

  // Add to body
  document.body.appendChild(printContainer);

  // Trigger print
  setTimeout(() => {
    window.print();

    // Remove after print
    setTimeout(() => {
      document.body.removeChild(printContainer);
    }, 100);
  }, 100);
};

export { exportStickerToPDF, printSticker };

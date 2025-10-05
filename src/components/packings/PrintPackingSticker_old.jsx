import jsPDF from 'jspdf';

const exportStickerToPDF = (packing, packingItems) => {
  if (!packing || !packingItems || packingItems.length === 0) {
    alert('Tidak ada data untuk dicetak');
    return;
  }

  // Generate stickers for each packing item
  const stickers = [];
  packingItems.forEach((item) => {
    const quantity = item.total_qty || item.quantity || 0;
    const itemName =
      item.nama_barang || item.purchaseOrderItem?.item?.item_name || 'N/A';
    const itemDescription =
      item.purchaseOrderItem?.item?.item_description || '';
    const jumlahCarton = item.jumlah_carton || 1;

    // Create one sticker per carton
    for (let i = 0; i < jumlahCarton; i++) {
      const qtyPerCarton = Math.ceil(quantity / jumlahCarton);
      stickers.push({
        itemName,
        itemDescription,
        quantity: qtyPerCarton,
        stickerNumber: stickers.length + 1,
      });
    }
  });

  if (stickers.length === 0) {
    alert(
      'Tidak ada stiker yang dapat digenerate. Pastikan ada data quantity/carton.'
    );
    return;
  }

  const totalStickers = stickers.length;
  const poNumber = packing.purchaseOrder?.po_number || 'N/A';

  // Get customer data from various possible fields
  const customerName = packing.purchaseOrder?.customer?.namaCustomer || 'N/A';
  const customerAddress =
    packing.purchaseOrder?.customer?.alamatPengiriman || 'N/A';

  // Create PDF in A4 landscape
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // A4 landscape dimensions: 297mm x 210mm
  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 8;
  const gap = 5;

  // Calculate sticker dimensions (2x2 grid)
  const stickerWidth = (pageWidth - 2 * margin - gap) / 2;
  const stickerHeight = (pageHeight - 2 * margin - gap) / 2;

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
    pdf.text(customerName, x + stickerWidth / 2, headerY, { align: 'center' });

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
    let leftColumnText = customerAddress;
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
    pdf.setFontSize(12);
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

const printSticker = (packing, packingItems) => {
  if (!packing || !packingItems || packingItems.length === 0) {
    alert('Tidak ada data untuk dicetak');
    return;
  }

  // Generate stickers for each packing item
  const stickers = [];
  packingItems.forEach((item) => {
    const quantity = item.total_qty || item.quantity || 0;
    const itemName =
      item.nama_barang || item.purchaseOrderItem?.item?.item_name || 'N/A';
    const itemDescription =
      item.purchaseOrderItem?.item?.item_description || '';
    const jumlahCarton = item.jumlah_carton || 1;

    // Create one sticker per carton
    for (let i = 0; i < jumlahCarton; i++) {
      const qtyPerCarton = Math.ceil(quantity / jumlahCarton);
      stickers.push({
        itemName,
        itemDescription,
        quantity: qtyPerCarton,
        stickerNumber: stickers.length + 1,
      });
    }
  });

  if (stickers.length === 0) {
    alert(
      'Tidak ada stiker yang dapat digenerate. Pastikan ada data quantity/carton.'
    );
    return;
  }

  const totalStickers = stickers.length;
  const poNumber = packing.purchaseOrder?.po_number || 'N/A';

  // Get customer data from various possible fields
  const customerName = packing.purchaseOrder?.customer?.namaCustomer || 'N/A';
  const customerAddress =
    packing.purchaseOrder?.customer?.alamatPengiriman || 'N/A';

  // Create PDF in A4 landscape
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // A4 landscape dimensions: 297mm x 210mm
  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 8;
  const gap = 5;

  // Calculate sticker dimensions (2x2 grid)
  const stickerWidth = (pageWidth - 2 * margin - gap) / 2;
  const stickerHeight = (pageHeight - 2 * margin - gap) / 2;

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
    pdf.text(customerName, x + stickerWidth / 2, headerY, { align: 'center' });

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

  // For Electron and browser: just download and let user print from PDF viewer
  // This is the most reliable cross-platform approach
  const fileName = `Stiker_Packing_${poNumber}_${new Date().getTime()}.pdf`;

  // Create blob and trigger download
  const pdfBlob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  link.click();

  // Show message to user
  setTimeout(() => {
    alert(`PDF "${fileName}" telah didownload.\nSilakan buka file dan print dari PDF viewer.`);
    URL.revokeObjectURL(blobUrl);
  }, 500);
};

export { exportStickerToPDF, printSticker };

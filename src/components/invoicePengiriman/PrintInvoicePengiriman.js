import {
  createPDFDocument,
  drawText,
  drawMultilineText,
  drawTable,
  drawLine,
  checkAndAddPage,
  generateFileName,
} from '../../utils/pdfUtils';
import {
  PDF_FONT_SIZES,
  PDF_FONT_STYLES,
  PDF_MARGINS,
  PDF_PAGE,
} from '../../utils/pdfConfig';
import { formatCurrency as baseFormatCurrency } from '../../utils/formatUtils';
import { toast } from 'react-toastify';

const numberFormatter = new Intl.NumberFormat('id-ID');

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatMultilineHtml = (value) => {
  if (!value) {
    return '-';
  }

  return escapeHtml(String(value)).replace(/\r?\n/g, '<br />');
};

const formatNumber = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '-';
  }
  return numberFormatter.format(numeric);
};

const formatCurrency = (value) => {
  const formatted = baseFormatCurrency(value);
  return formatted === 'N/A' ? '-' : formatted;
};

const formatDateDocument = (value, location = 'Jakarta') => {
  const safeLocation = location || 'Jakarta';

  if (!value) {
    return `${safeLocation}, -`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return `${safeLocation}, -`;
  }

  const formatted = parsed.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return `${safeLocation}, ${formatted}`;
};

const formatDateSimple = (value) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const getRecipientLines = (invoice) => {
  const customer = invoice?.purchaseOrder?.customer || {};
  return [
    invoice?.deliver_to,
    customer.name,
    customer.companyName,
    customer.address,
  ]
    .filter(Boolean)
    .map((line) => String(line));
};

const getDetailData = (details = []) => {
  if (!Array.isArray(details)) {
    return [];
  }

  return details.map((detail, index) => {
    const discount =
      detail?.discount_percentage !== undefined &&
      detail?.discount_percentage !== null
        ? `${Number(detail.discount_percentage)}%`
        : '-';

    return {
      no: String(index + 1),
      name: detail?.nama_barang || '-',
      quantity: formatNumber(detail?.quantity),
      unit: detail?.satuan || '-',
      price: formatCurrency(detail?.harga),
      discount,
      total: formatCurrency(detail?.total),
    };
  });
};

const getSummaryData = (invoice) => {
  const purchaseOrderNumber = invoice?.purchaseOrder?.no_purchase_order || '-';
  const ppnPercentage = Number.isFinite(Number(invoice?.ppn_percentage))
    ? Number(invoice.ppn_percentage)
    : 0;

  return {
    note: `PO ${purchaseOrderNumber}`,
    rows: [
      { label: 'Subtotal', value: formatCurrency(invoice?.sub_total) },
      { label: 'Total Discount', value: formatCurrency(invoice?.total_discount) },
      { label: 'Total', value: formatCurrency(invoice?.total_price) },
      {
        label: `PPN ${ppnPercentage}%`,
        value: formatCurrency(invoice?.ppn_rupiah),
      },
      {
        label: 'GRAND TOTAL',
        value: formatCurrency(invoice?.grand_total),
        bold: true,
      },
    ],
  };
};

const buildDocumentHtml = (invoice) => {
  const detailData = getDetailData(invoice?.invoiceDetails || []);
  const summaryData = getSummaryData(invoice);
  const recipientLines = getRecipientLines(invoice);
  const headerDate = formatDateDocument(invoice?.tanggal);
  const documentNumber = invoice?.no_invoice ? `No : ${escapeHtml(invoice.no_invoice)}` : '';
  const noteHtml = formatMultilineHtml(summaryData.note);

  const detailRowsHtml = detailData.length
    ? detailData
        .map(
          (row) => `<tr>
      <td class="center">${escapeHtml(row.no)}</td>
      <td>${escapeHtml(row.name)}</td>
      <td class="center">${escapeHtml(row.quantity)}</td>
      <td class="center">${escapeHtml(row.unit)}</td>
      <td class="right">${escapeHtml(row.price)}</td>
      <td class="center">${escapeHtml(row.discount)}</td>
      <td class="right">${escapeHtml(row.total)}</td>
    </tr>`,
        )
        .join('')
    : `<tr>
      <td colspan="7" class="inv-empty">Tidak ada detail barang.</td>
    </tr>`;

  const summaryRowsHtml = summaryData.rows
    .map((row, index) => {
      if (index === 0) {
        return `<tr>
      <td colspan="4" rowspan="${summaryData.rows.length}" class="note-cell">
        NOTE : ${noteHtml}
      </td>
      <td colspan="2" class="summary-label">${escapeHtml(row.label)}</td>
      <td class="right">${escapeHtml(row.value)}</td>
    </tr>`;
      }

      return `<tr>
      <td colspan="2" class="summary-label${row.bold ? ' bold' : ''}">${escapeHtml(row.label)}</td>
      <td class="right${row.bold ? ' bold' : ''}">${escapeHtml(row.value)}</td>
    </tr>`;
    })
    .join('');

  const recipientHtml = recipientLines.length
    ? recipientLines.map((line) => escapeHtml(line)).join('<br />')
    : '-';

  return `
    <style>
      .inv-document {
        font-family: Arial, sans-serif;
        width: 794px;
        min-height: 1123px;
        margin: 0 auto;
        background-color: #ffffff;
        box-sizing: border-box;
        padding: 56px;
        font-size: 11px;
        color: #000;
      }

      .inv-header {
        margin-bottom: 30px;
      }

      .inv-title {
        text-align: center;
        font-size: 20px;
        font-weight: bold;
        margin: 30px 0;
        letter-spacing: 2px;
      }

      .inv-header-info {
        margin-bottom: 25px;
        line-height: 1.8;
      }

      .inv-recipient {
        margin-bottom: 25px;
        line-height: 1.6;
      }

      .inv-recipient .label {
        font-weight: bold;
        margin-bottom: 6px;
      }

      .inv-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 11px;
      }

      .inv-table th {
        background-color: #ffffff;
        border: 1px solid #000;
        padding: 8px 5px;
        text-align: center;
        font-weight: bold;
      }

      .inv-table td {
        border: 1px solid #000;
        padding: 8px 5px;
        vertical-align: top;
      }

      .center {
        text-align: center;
      }

      .right {
        text-align: right;
      }

      .bold {
        font-weight: bold;
      }

      .note-cell {
        vertical-align: bottom;
        padding-bottom: 10px;
        text-align: left;
      }

      .summary-label {
        text-align: left;
        padding-left: 15px;
      }

      .inv-footer-date {
        text-align: right;
        margin-top: 40px;
        font-size: 11px;
      }

      .inv-empty {
        text-align: center;
        padding: 20px 8px;
        font-style: italic;
      }
    </style>
    <div class="inv-document">
      <div class="inv-header-info">
        <div>${escapeHtml(headerDate)}</div>
        ${documentNumber ? `<div style="margin-top: 10px;">${documentNumber}</div>` : ''}
      </div>

      <div class="inv-title">INVOICE PENGIRIMAN</div>

      <div class="inv-recipient">
        <div class="label">Kepada Yth,</div>
        <div>${recipientHtml}</div>
      </div>

      <table class="inv-table">
        <thead>
          <tr>
            <th style="width: 5%;">NO</th>
            <th style="width: 35%;">Nama Barang</th>
            <th style="width: 10%;">Jumlah</th>
            <th style="width: 8%;">Sat</th>
            <th style="width: 15%;">Harga Satuan</th>
            <th style="width: 8%;">Pot</th>
            <th style="width: 15%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${detailRowsHtml}
          ${summaryRowsHtml}
        </tbody>
      </table>

      <div class="inv-footer-date">
        ${escapeHtml(headerDate)}
      </div>
    </div>
  `;
};

const drawInvoiceHeader = (pdf, invoice) => {
  let yPosition = PDF_MARGINS.top;

  drawText(pdf, 'INVOICE PENGIRIMAN', PDF_MARGINS.left, yPosition, {
    fontSize: PDF_FONT_SIZES.title,
    fontStyle: PDF_FONT_STYLES.bold,
  });
  yPosition += 8;

  const docNumber = invoice?.no_invoice || '-';
  const docDate = formatDateSimple(invoice?.tanggal);

  drawText(
    pdf,
    `No: ${docNumber} | Tgl: ${docDate}`,
    PDF_MARGINS.left,
    yPosition,
    { fontSize: PDF_FONT_SIZES.body },
  );
  yPosition += 6;

  drawLine(
    pdf,
    PDF_MARGINS.left,
    yPosition,
    PDF_PAGE.width - PDF_MARGINS.right,
    yPosition,
  );
  yPosition += 6;

  return yPosition;
};

const drawRecipientInfo = (pdf, invoice, startY) => {
  let yPosition = startY;

  drawText(pdf, 'Kepada Yth,', PDF_MARGINS.left, yPosition, {
    fontSize: PDF_FONT_SIZES.body,
    fontStyle: PDF_FONT_STYLES.bold,
  });
  yPosition += 5;

  const recipientLines = getRecipientLines(invoice);
  if (recipientLines.length) {
    yPosition = drawMultilineText(
      pdf,
      recipientLines.join('\n'),
      PDF_MARGINS.left,
      yPosition,
      PDF_PAGE.contentWidth,
      { fontSize: PDF_FONT_SIZES.body },
    );
  } else {
    yPosition = drawText(pdf, '-', PDF_MARGINS.left, yPosition, {
      fontSize: PDF_FONT_SIZES.body,
    });
  }

  yPosition += 8;
  return yPosition;
};

const drawInvoiceDetailsTable = (pdf, detailData, startY) => {
  const headers = ['No', 'Nama Barang', 'Jumlah', 'Sat', 'Harga', 'Pot', 'Total'];
  const columnWidths = [10, 60, 20, 15, 30, 15, 20];
  const alignments = ['center', 'left', 'right', 'center', 'right', 'center', 'right'];

  const rows = detailData.map((item) => [
    item.no,
    item.name,
    item.quantity,
    item.unit,
    item.price,
    item.discount,
    item.total,
  ]);

  return drawTable(
    pdf,
    headers,
    rows,
    PDF_MARGINS.left,
    startY,
    {
      columnWidths,
      alignments,
      headerAlignments: ['center', 'left', 'center', 'center', 'right', 'center', 'right'],
      fontSize: PDF_FONT_SIZES.tableBody,
      headerFontSize: PDF_FONT_SIZES.tableHeader,
    },
  );
};

const drawInvoiceSummary = (pdf, summaryData, startY) => {
  let yPosition = startY + 8;

  const noteWidth = 90;
  drawText(pdf, 'NOTE:', PDF_MARGINS.left, yPosition, {
    fontSize: PDF_FONT_SIZES.body,
    fontStyle: PDF_FONT_STYLES.bold,
  });
  yPosition += 5;

  const noteEndY = drawMultilineText(
    pdf,
    summaryData.note,
    PDF_MARGINS.left,
    yPosition,
    noteWidth - 5,
    { fontSize: PDF_FONT_SIZES.body },
  );

  const summaryStartX = PDF_MARGINS.left + noteWidth + 10;
  let summaryY = startY + 8;

  summaryData.rows.forEach((row) => {
    drawText(pdf, row.label, summaryStartX, summaryY, {
      fontSize: PDF_FONT_SIZES.body,
      fontStyle: row.bold ? PDF_FONT_STYLES.bold : PDF_FONT_STYLES.normal,
    });

    drawText(
      pdf,
      row.value,
      summaryStartX + 50,
      summaryY,
      {
        fontSize: PDF_FONT_SIZES.body,
        fontStyle: row.bold ? PDF_FONT_STYLES.bold : PDF_FONT_STYLES.normal,
        align: 'right',
      },
    );

    summaryY += 6;
  });

  return Math.max(noteEndY + 6, summaryY + 4);
};

const drawInvoiceFooter = (pdf, invoice, startY) => {
  const footerText = formatDateDocument(invoice?.tanggal);
  const footerY = startY + 12;

  drawText(
    pdf,
    footerText,
    PDF_PAGE.width - PDF_MARGINS.right,
    footerY,
    {
      fontSize: PDF_FONT_SIZES.body,
      align: 'right',
    },
  );
};

export const exportInvoicePengirimanToPDF = async (invoice) => {
  try {
    if (!invoice) {
      throw new Error('Data invoice pengiriman tidak tersedia');
    }

    const detailData = getDetailData(invoice?.invoiceDetails || []);
    if (!detailData.length) {
      throw new Error('Tidak ada detail barang untuk dicetak');
    }

    const summaryData = getSummaryData(invoice);

    const pdf = createPDFDocument();
    let yPosition = drawInvoiceHeader(pdf, invoice);

    yPosition = drawRecipientInfo(pdf, invoice, yPosition);

    yPosition = checkAndAddPage(pdf, yPosition, 40);
    yPosition = drawInvoiceDetailsTable(pdf, detailData, yPosition);

    yPosition = checkAndAddPage(pdf, yPosition, 50);
    yPosition = drawInvoiceSummary(pdf, summaryData, yPosition);

    yPosition = checkAndAddPage(pdf, yPosition, 20);
    drawInvoiceFooter(pdf, invoice, yPosition);

    const fileName = generateFileName('INVOICE_PENGIRIMAN', invoice?.no_invoice);
    pdf.save(fileName);

    toast.success('Invoice berhasil di-export ke PDF', {
      position: 'top-right',
      autoClose: 3000,
    });
  } catch (error) {
    console.error('Error exporting invoice pengiriman:', error);
    toast.error(`Gagal export: ${error.message}`, {
      position: 'top-right',
      autoClose: 5000,
    });
  }
};

export const printInvoicePengiriman = (invoice) => {
  if (!invoice) {
    return;
  }

  const documentHtml = buildDocumentHtml(invoice);
  const printWindow = window.open('', '_blank', 'width=1024,height=768');

  if (!printWindow) {
    console.error('Tidak dapat membuka jendela cetak. Periksa pengaturan pop-up browser.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body>${documentHtml}</body></html>`);
  printWindow.document.close();

  const triggerPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } catch (error) {
      console.error('Gagal memproses pencetakan invoice pengiriman', error);
    }
  };

  if (printWindow.document.readyState === 'complete') {
    triggerPrint();
  } else {
    printWindow.onload = triggerPrint;
  }
};

export default printInvoicePengiriman;

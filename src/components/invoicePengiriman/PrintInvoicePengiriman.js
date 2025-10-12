import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency as baseFormatCurrency } from '../../utils/formatUtils';

const numberFormatter = new Intl.NumberFormat('id-ID');

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatMultiline = (value) => {
  if (!value) {
    return '-';
  }
  return escapeHtml(value).replace(/\r?\n/g, '<br />');
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
  if (!value) {
    return `${escapeHtml(location)}, -`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return `${escapeHtml(location)}, -`;
  }

  const formatted = parsed.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return `${escapeHtml(location)}, ${formatted}`;
};

const sanitizeFileName = (value) => {
  const base = value && String(value).trim() ? value.trim() : 'Invoice_Pengiriman';
  return base.replace(/[^A-Za-z0-9_\-]+/g, '_');
};

const buildDetailRows = (details = []) => {
  if (!details.length) {
    return `<tr>
      <td colspan="7" class="inv-empty">Tidak ada detail barang.</td>
    </tr>`;
  }

  return details
    .map((detail, index) => {
      const quantity = formatNumber(detail?.quantity);
      const unit = escapeHtml(detail?.satuan || '-');
      const discountPercent =
        detail?.discount_percentage !== undefined && detail?.discount_percentage !== null
          ? `${Number(detail.discount_percentage)}%`
          : '-';

      return `<tr>
        <td class="center">${index + 1}</td>
        <td>${escapeHtml(detail?.nama_barang || '-')}</td>
        <td class="center">${quantity}</td>
        <td class="center">${unit}</td>
        <td class="right">${formatCurrency(detail?.harga)}</td>
        <td class="center">${escapeHtml(discountPercent)}</td>
        <td class="right">${formatCurrency(detail?.total)}</td>
      </tr>`;
    })
    .join('');
};

const buildSummaryRows = (invoice, noteContent) => {
  const rows = [
    { label: 'Subtotal', value: invoice?.sub_total },
    { label: 'Total Discount', value: invoice?.total_discount },
    { label: 'Total', value: invoice?.total_price },
    {
      label: `PPN ${Number.isFinite(Number(invoice?.ppn_percentage)) ? Number(invoice.ppn_percentage) : 0}%`,
      value: invoice?.ppn_rupiah,
    },
    { label: 'Grand Total', value: invoice?.grand_total, bold: true },
  ];

  const note = noteContent || '-';
  const [firstRow, ...restRows] = rows;

  const firstSummaryRow = `<tr>
      <td colspan="4" rowspan="${rows.length}" class="note-cell">
        NOTE : ${escapeHtml(note)}
      </td>
      <td colspan="2" class="summary-label">${escapeHtml(firstRow.label)}</td>
      <td class="right">${formatCurrency(firstRow.value)}</td>
    </tr>`;

  const remainingRows = restRows
    .map((row) => `<tr>
        <td colspan="2" class="summary-label${row.bold ? ' bold' : ''}">${escapeHtml(row.label)}</td>
        <td class="right${row.bold ? ' bold' : ''}">${formatCurrency(row.value)}</td>
      </tr>`)
    .join('');

  return firstSummaryRow + remainingRows;
};

const buildDocumentHtml = (invoice) => {
  const purchaseOrderNumber = invoice?.purchaseOrder?.no_purchase_order || '-';
  const customer = invoice?.purchaseOrder?.customer || {};
  const recipientLines = [
    invoice?.deliver_to,
    customer.name,
    customer.companyName,
    customer.address,
  ]
    .filter((line) => Boolean(line))
    .map((line) => escapeHtml(line))
    .join('<br />');

  const headerDate = formatDateDocument(invoice?.tanggal);
  const documentNumber = invoice?.no_invoice ? `No : ${escapeHtml(invoice.no_invoice)}` : '';
  const summaryRows = buildSummaryRows(invoice, `PO ${purchaseOrderNumber}`);
  const detailRows = buildDetailRows(invoice?.invoiceDetails || []);

  const styles = `
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

    .inv-logo {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }

    .inv-logo-circle {
      width: 30px;
      height: 40px;
      background-color: #ff6347;
      border-radius: 50% 50% 50% 0;
      margin-right: 8px;
    }

    .inv-company {
      font-size: 20px;
      font-weight: bold;
    }

    .inv-company .orange {
      color: #ff6347;
    }

    .inv-company-info {
      font-size: 11px;
      line-height: 1.6;
      margin-left: 38px;
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
  `;

  return `
    <style>${styles}</style>
    <div class="inv-document">
      <div class="inv-header">
        <div class="inv-logo">
          <div class="inv-logo-circle"></div>
          <div class="inv-company">DOVEN<span class="orange">tradeco</span></div>
        </div>
        <div class="inv-company-info">
          Jl. Kapuk Raya No. 62 A<br />
          Pergudangan Duta Indah Kapuk 2 Blok. C8<br />
          Jakarta Utara, Indonesia<br />
          Telp : (021) 2901 8795<br />
          Fax  : (021) 5035 0355
        </div>
      </div>

      <div class="inv-title">INVOICE</div>

      <div class="inv-header-info">
        <div>${headerDate}</div>
        ${documentNumber ? `<div style="margin-top: 10px;">${documentNumber}</div>` : ''}
      </div>

      <div class="inv-recipient">
        <div class="label">Kepada Yth,</div>
        <div>${recipientLines || '-'}</div>
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
          ${detailRows}
          ${summaryRows}
        </tbody>
      </table>

      <div class="inv-footer-date">
        ${headerDate}
      </div>
    </div>
  `;
};

export const exportInvoicePengirimanToPDF = async (invoice) => {
  if (!invoice) {
    alert('Data invoice pengiriman tidak tersedia.');
    return;
  }

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';
  container.innerHTML = buildDocumentHtml(invoice);

  document.body.appendChild(container);

  try {
    const pdfElement = container.querySelector('.inv-document') || container;

    const canvas = await html2canvas(pdfElement, {
      scale: window.devicePixelRatio > 1 ? window.devicePixelRatio : 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    const fileName = `${sanitizeFileName(invoice.no_invoice || 'Invoice_Pengiriman')}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Gagal mengekspor invoice pengiriman ke PDF:', error);
    alert('Gagal mengekspor invoice pengiriman ke PDF. Silakan coba lagi.');
  } finally {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
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



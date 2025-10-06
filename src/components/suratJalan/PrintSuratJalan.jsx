import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const escapeHtml = (value = '') => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatMultilineText = (value) => {
  if (!value) {
    return '-';
  }
  return escapeHtml(value).replace(/\r?\n/g, '<br>');
};

const toNumber = (value) => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const normalized = trimmed.replace(/\./g, '').replace(/,/g, '.');
    const numeric = Number(normalized);
    return Number.isNaN(numeric) ? null : numeric;
  }
  return null;
};

const formatNumeric = (numeric) => {
  if (numeric === null) {
    return null;
  }
  if (Number.isInteger(numeric)) {
    return numeric.toLocaleString('id-ID');
  }
  return numeric.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const formatValueWithUnit = (value, unit) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numericValue = toNumber(value);
  const safeUnit = unit ? escapeHtml(unit) : '';

  if (numericValue !== null) {
    const formattedNumber = formatNumeric(numericValue);
    if (formattedNumber === null) {
      return '-';
    }
    const safeNumber = escapeHtml(formattedNumber);
    return safeUnit ? `${safeNumber} ${safeUnit}` : safeNumber;
  }

  const text = String(value).trim();
  if (!text) {
    return '-';
  }

  return escapeHtml(text);
};

const formatDateLong = (date) => {
  if (!date) {
    return '-';
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const sanitizeFileName = (value) => {
  const base = value && String(value).trim() ? value.trim() : 'Surat_Jalan';
  return base.replace(/[^\w\-]+/g, '_');
};

const buildDetailRows = (details) => {
  if (!details.length) {
    return `
      <tr>
        <td colspan="6" class="sj-empty-row">Tidak ada data surat jalan.</td>
      </tr>
    `;
  }

  return details
    .map((detail, index) => {
      const items = Array.isArray(detail?.items) && detail.items.length
        ? detail.items
        : Array.isArray(detail?.suratJalanDetailItems) && detail.suratJalanDetailItems.length
          ? detail.suratJalanDetailItems
          : [];

      const primaryItem = items[0] || {};

      const namaBarang =
        detail?.nama_barang ??
        primaryItem?.nama_barang ??
        '-';

      const unit =
        detail?.satuan ??
        primaryItem?.satuan ??
        '';

      const jumlahPerCartonSource =
        detail?.isi_box ??
        primaryItem?.isi_box ??
        primaryItem?.quantity_per_carton ??
        primaryItem?.qty_per_carton ??
        null;

      let totalQuantitySource =
        detail?.total_quantity_in_box ??
        detail?.total_quantity ??
        primaryItem?.total_quantity ??
        primaryItem?.quantity ??
        null;

      if (
        (totalQuantitySource === null || totalQuantitySource === undefined || totalQuantitySource === '') &&
        (detail?.total_box !== null && detail?.total_box !== undefined) &&
        (jumlahPerCartonSource !== null && jumlahPerCartonSource !== undefined && jumlahPerCartonSource !== '')
      ) {
        const numericIsi = toNumber(jumlahPerCartonSource);
        const numericBox = toNumber(detail?.total_box);
        if (numericIsi !== null && numericBox !== null) {
          totalQuantitySource = numericIsi * numericBox;
        }
      }

      const jumlahPerCarton = formatValueWithUnit(jumlahPerCartonSource, unit);
      const totalQuantity = formatValueWithUnit(totalQuantitySource, unit);

      const keterangan =
        detail?.keterangan ??
        primaryItem?.keterangan ??
        '';

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(detail?.no_box ?? primaryItem?.no_box ?? '-')}</td>
          <td class="text-left">${escapeHtml(namaBarang || '-')}</td>
          <td>${jumlahPerCarton}</td>
          <td>${totalQuantity}</td>
          <td>${formatMultilineText(keterangan)}</td>
        </tr>
      `;
    })
    .join('');
};

const buildDocumentHtml = ({
  tanggalSuratJalan,
  nomorSuratJalan,
  alamatKirim,
  pic,
  poNumber,
  detailRows,
}) => {
  const styles = `
    .sj-document {
      font-family: Arial, sans-serif;
      width: 794px;
      min-height: 1123px;
      background-color: #ffffff;
      color: #000;
      margin: 0 auto;
      padding: 56px;
      box-sizing: border-box;
      position: relative;
      font-size: 12px;
    }

    .sj-content-wrapper {
      min-height: calc(1123px - 160px);
      position: relative;
      padding-bottom: 140px;
    }

    .sj-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 2px solid #000;
      margin-bottom: 20px;
    }

    .sj-header-left {
      font-size: 16px;
      font-weight: bold;
      letter-spacing: 1px;
    }

    .sj-header-right {
      font-size: 14px;
      font-weight: bold;
    }

    .sj-info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }

    .sj-info-table td {
      padding: 8px 4px;
      border: none;
      vertical-align: top;
      text-align: left;
    }

    .sj-info-label {
      width: 180px;
      font-weight: normal;
    }

    .sj-info-separator {
      width: 20px;
    }

    .sj-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    .sj-table th,
    .sj-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: center;
    }

    .sj-table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }

    .sj-table td.text-left {
      text-align: left;
    }

    .sj-signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin: 40px 0;
    }

    .sj-signature-box {
      text-align: center;
    }

    .sj-signature-title {
      font-weight: normal;
      margin-bottom: 10px;
    }

    .sj-signature-space {
      height: 80px;
      margin: 10px 0;
    }

    .sj-signature-name {
      font-weight: normal;
      margin: 5px 0;
    }

    .sj-signature-note {
      font-size: 11px;
    }

    .sj-document-receiver {
      text-align: center;
      margin: 30px auto;
      max-width: 300px;
    }

    .sj-notes {
      position: absolute;
      left: 56px;
      right: 56px;
      bottom: 56px;
      font-size: 11px;
      line-height: 1.6;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .sj-notes-content {
      flex: 1;
    }

    .sj-notes-title {
      font-weight: bold;
      margin-bottom: 5px;
    }

    .sj-footer {
      text-align: right;
      font-size: 11px;
      min-width: 120px;
    }

    .sj-empty-row {
      padding: 20px 8px;
      text-align: center;
      font-style: italic;
    }
  `;

  return `
    <style>${styles}</style>
    <div class="sj-document">
      <div class="sj-content-wrapper">
        <div class="sj-header">
          <div class="sj-header-left">SURAT JALAN</div>
          <div class="sj-header-right">PT DOVEN TRADECO</div>
        </div>

        <table class="sj-info-table">
          <tr>
            <td class="sj-info-label">Tanggal Surat Jalan</td>
            <td class="sj-info-separator">:</td>
            <td>${tanggalSuratJalan}</td>
          </tr>
          <tr>
            <td class="sj-info-label">Nomor Surat Jalan</td>
            <td class="sj-info-separator">:</td>
            <td>${nomorSuratJalan}</td>
          </tr>
          <tr>
            <td class="sj-info-label">Alamat Kirim</td>
            <td class="sj-info-separator">:</td>
            <td>${alamatKirim}</td>
          </tr>
          <tr>
            <td class="sj-info-label">PIC</td>
            <td class="sj-info-separator">:</td>
            <td>${pic}</td>
          </tr>
          <tr>
            <td class="sj-info-label">No. PO</td>
            <td class="sj-info-separator">:</td>
            <td>${poNumber}</td>
          </tr>
        </table>

        <table class="sj-table">
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 12%;">No. Box</th>
              <th style="width: 35%;">Nama Barang</th>
              <th style="width: 18%;">Jumlah Per Carton</th>
              <th style="width: 18%;">Total Quantity</th>
              <th style="width: 12%;">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${detailRows}
          </tbody>
        </table>

        <div class="sj-signature-section">
          <div class="sj-signature-box">
            <div class="sj-signature-title">Hormat Kami,</div>
            <div class="sj-signature-space"></div>
            <div class="sj-signature-name">Mayang</div>
            <div class="sj-signature-note">(Nama, Ttd dan Cap)</div>
          </div>
          <div class="sj-signature-box">
            <div class="sj-signature-title">Penerima</div>
            <div class="sj-signature-space"></div>
            <div class="sj-signature-note">(Nama, Ttd dan Cap)</div>
          </div>
        </div>

        <div class="sj-document-receiver">
          <div class="sj-signature-title">Penerima Dokumen</div>
          <div class="sj-signature-space"></div>
          <div class="sj-signature-note">(Nama, Ttd dan Cap)</div>
        </div>
      </div>

      <div class="sj-notes">
        <div class="sj-notes-content">
          <div class="sj-notes-title">Note:</div>
          <div>* Dokumen kembali ke Jakarta</div>
          <div>* Stempel DC</div>
        </div>
        <div class="sj-footer">
          Page 1 Lembar 2
        </div>
      </div>
    </div>
  `;
};

export const exportSuratJalanToPDF = async (suratJalan) => {
  if (!suratJalan) {
    alert('Data surat jalan tidak tersedia.');
    return;
  }

  const details = Array.isArray(suratJalan.suratJalanDetails)
    ? suratJalan.suratJalanDetails
    : suratJalan.suratJalanDetails
      ? [suratJalan.suratJalanDetails]
      : [];

  const tanggalSuratJalan = formatDateLong(suratJalan.createdAt);
  const nomorSuratJalan = suratJalan.no_surat_jalan
    ? escapeHtml(suratJalan.no_surat_jalan)
    : '-';
  const alamatKirim = formatMultilineText(suratJalan.alamat_tujuan);
  const pic = suratJalan.PIC ? escapeHtml(suratJalan.PIC) : '-';
  const poNumber = suratJalan.purchaseOrder?.po_number
    ? escapeHtml(suratJalan.purchaseOrder.po_number)
    : '-';

  const detailRows = buildDetailRows(details);

  const documentHtml = buildDocumentHtml({
    tanggalSuratJalan,
    nomorSuratJalan,
    alamatKirim,
    pic,
    poNumber,
    detailRows,
  });

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';
  container.innerHTML = documentHtml;

  document.body.appendChild(container);

  try {
    const pdfElement = container.querySelector('.sj-document') || container;

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

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const fileName = `${sanitizeFileName(suratJalan.no_surat_jalan || 'Surat_Jalan')}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Gagal mengekspor Surat Jalan ke PDF:', error);
    alert('Gagal mengekspor Surat Jalan ke PDF. Silakan coba lagi.');
  } finally {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};

export default exportSuratJalanToPDF;

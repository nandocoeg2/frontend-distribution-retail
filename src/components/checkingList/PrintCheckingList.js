import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const numberFormatter = new Intl.NumberFormat('id-ID');

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatMultiline = (value) => {
  if (!value && value !== 0) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map((line) => escapeHtml(line)).join('<br />');
  }

  return escapeHtml(String(value)).replace(/\r?\n/g, '<br />');
};

const parseNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const normalized = trimmed.replace(/\./g, '').replace(/,/g, '.');
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : null;
  }

  return null;
};

const buildQuantityString = (numeric, unit) => {
  const formattedNumber = numberFormatter.format(numeric);
  const normalizedUnit = unit ? String(unit).trim() : '';

  if (normalizedUnit) {
    return `${escapeHtml(formattedNumber)} ${escapeHtml(normalizedUnit.toUpperCase())}`;
  }

  return escapeHtml(formattedNumber);
};

const formatQuantity = (primaryValue, primaryUnit, fallbackValue, fallbackUnit) => {
  const primaryNumeric = parseNumber(primaryValue);
  if (primaryNumeric !== null) {
    return buildQuantityString(primaryNumeric, primaryUnit);
  }

  const fallbackNumeric = parseNumber(fallbackValue);
  if (fallbackNumeric !== null) {
    return buildQuantityString(fallbackNumeric, fallbackUnit);
  }

  if (primaryValue && String(primaryValue).trim()) {
    return escapeHtml(primaryValue);
  }

  if (fallbackValue && String(fallbackValue).trim()) {
    return escapeHtml(fallbackValue);
  }

  return '-';
};

const formatDateLong = (value) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  const formatted = parsed.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return escapeHtml(formatted);
};

const sanitizeFileName = (value) => {
  const fallback = 'Checklist_Surat_Jalan';
  const base = value && String(value).trim() ? value.trim() : fallback;
  return base.replace(/[^A-Za-z0-9_\-]+/g, '_');
};

const extractField = (source, fields = []) => {
  if (!source || typeof source !== 'object') {
    return null;
  }

  for (const field of fields) {
    if (field in source && source[field] !== null && source[field] !== undefined) {
      const candidate = source[field];
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed) {
          return trimmed;
        }
      } else if (typeof candidate === 'number' && !Number.isNaN(candidate)) {
        return String(candidate);
      }
    }
  }

  return null;
};

const getSuratJalanList = (checklist) => {
  if (!checklist) {
    return [];
  }

  if (Array.isArray(checklist.suratJalan)) {
    return checklist.suratJalan.filter(Boolean);
  }

  if (checklist.suratJalan) {
    return [checklist.suratJalan];
  }

  return [];
};

const getSuratJalanDetails = (suratJalan) => {
  if (!suratJalan) {
    return [];
  }

  if (Array.isArray(suratJalan.suratJalanDetails)) {
    return suratJalan.suratJalanDetails.filter(Boolean);
  }

  if (suratJalan.suratJalanDetails) {
    return [suratJalan.suratJalanDetails];
  }

  return [];
};

const getDetailItems = (detail) => {
  if (!detail) {
    return [];
  }

  if (Array.isArray(detail.items) && detail.items.length > 0) {
    return detail.items.filter(Boolean);
  }

  if (
    Array.isArray(detail.suratJalanDetailItems) &&
    detail.suratJalanDetailItems.length > 0
  ) {
    return detail.suratJalanDetailItems.filter(Boolean);
  }

  return [];
};

const getPackingItems = (suratJalan) => {
  if (!suratJalan) {
    return [];
  }

  const packing =
    suratJalan?.purchaseOrder?.packing ||
    suratJalan?.packing ||
    null;

  if (!packing) {
    return [];
  }

  if (Array.isArray(packing?.packingItems)) {
    return packing.packingItems.filter(Boolean);
  }

  if (packing?.packingItems) {
    return [packing.packingItems];
  }

  return [];
};

const buildPackingKeterangan = (item) => {
  const notes = [];

  if (item?.is_mixed_carton !== undefined && item?.is_mixed_carton !== null) {
    notes.push(`Mixed Carton: ${item.is_mixed_carton ? 'Ya' : 'Tidak'}`);
  }

  if (item?.keterangan) {
    notes.push(item.keterangan);
  }

  return notes.join(' | ');
};

const calculateTotals = (suratJalan) => {
  const details = getSuratJalanDetails(suratJalan);
  const packingItems = getPackingItems(suratJalan);

  let totalBoxes = 0;
  let totalQuantity = 0;
  let hasBox = false;
  let hasQuantity = false;

  details.forEach((detail) => {
    const detailBox = parseNumber(detail?.total_box);
    if (detailBox !== null) {
      totalBoxes += detailBox;
      hasBox = true;
    } else {
      getDetailItems(detail).forEach((item) => {
        const itemBox = parseNumber(item?.total_box);
        if (itemBox !== null) {
          totalBoxes += itemBox;
          hasBox = true;
        }
      });
    }

    const detailQuantity = parseNumber(detail?.total_quantity_in_box);
    if (detailQuantity !== null) {
      totalQuantity += detailQuantity;
      hasQuantity = true;
    } else {
      getDetailItems(detail).forEach((item) => {
        const itemQuantity = parseNumber(item?.quantity);
        if (itemQuantity !== null) {
          totalQuantity += itemQuantity;
          hasQuantity = true;
        }
      });
    }
  });

  packingItems.forEach((item) => {
    const itemBox = parseNumber(item?.jumlah_carton ?? item?.total_box);
    if (itemBox !== null) {
      totalBoxes += itemBox;
      hasBox = true;
    }

    const itemQuantity = parseNumber(item?.total_qty ?? item?.quantity);
    if (itemQuantity !== null) {
      totalQuantity += itemQuantity;
      hasQuantity = true;
    }
  });

  return {
    totalBoxes: hasBox ? totalBoxes : null,
    totalQuantity: hasQuantity ? totalQuantity : null,
  };
};

const buildDestinationHeader = (suratJalan, index) => {
  if (!suratJalan) {
    return '';
  }

  const destinationName =
    extractField(suratJalan, [
      'deliver_to',
      'destination',
      'tujuan',
      'outletName',
      'customerName',
    ]) || '-';

  const destinationCode =
    extractField(suratJalan, [
      'kode_tujuan',
      'kode_toko',
      'storeCode',
      'kode',
      'destinationCode',
      'kodeCabang',
      'kode_customer',
    ]) || '';

  const safeName = escapeHtml(destinationName);
  const safeCode = destinationCode ? `&nbsp;&nbsp;(${escapeHtml(destinationCode)})` : '';

  return `${index + 1}. ${safeName}${safeCode}`;
};

const buildDestinationSummary = (suratJalanList) => {
  if (!suratJalanList.length) {
    return null;
  }

  const lines = suratJalanList.map((suratJalan, index) => {
    const header = buildDestinationHeader(suratJalan, index);
    const { totalBoxes, totalQuantity } = calculateTotals(suratJalan);

    const parts = [];
    if (totalBoxes !== null) {
      parts.push(`${escapeHtml(numberFormatter.format(totalBoxes))} Box`);
    }
    if (totalQuantity !== null) {
      parts.push(`${escapeHtml(numberFormatter.format(totalQuantity))} Qty`);
    }

    const suffix = parts.length ? ` = ${parts.join(' / ')}` : '';
    return `${header}${suffix}`;
  });

  return lines.join('<br />');
};

const buildTableRows = (suratJalanList) => {
  const rows = [];
  let counter = 0;

  suratJalanList.forEach((suratJalan) => {
    const details = getSuratJalanDetails(suratJalan);
    const packingItems = getPackingItems(suratJalan);

    const beforeCount = rows.length;

    details.forEach((detail) => {
      const items = getDetailItems(detail);

      if (items.length === 0) {
        counter += 1;
        rows.push({
          no: counter,
          noBox: detail?.no_box || '-',
          namaBarang: detail?.nama_barang || '-',
          jumlah: formatQuantity(detail?.total_box, 'Box', detail?.total_quantity_in_box, 'Qty'),
          totalQuantity: formatQuantity(
            detail?.total_quantity_in_box,
            'Qty',
            detail?.total_box,
            'Box'
          ),
          keterangan: detail?.keterangan || '',
        });
        return;
      }

      items.forEach((item) => {
        counter += 1;
        rows.push({
          no: counter,
          noBox: detail?.no_box || item?.no_box || '-',
          namaBarang: item?.nama_barang || detail?.nama_barang || '-',
          jumlah: formatQuantity(
            item?.quantity,
            item?.satuan || item?.unit,
            detail?.total_quantity_in_box,
            'Qty'
          ),
          totalQuantity: formatQuantity(
            detail?.total_quantity_in_box,
            item?.satuan || 'Qty',
            item?.total_box ?? item?.quantity,
            item?.satuan || 'Qty'
          ),
          keterangan: item?.keterangan || detail?.keterangan || '',
        });
      });
    });

    const detailRowsAdded = rows.length > beforeCount;

    if (!detailRowsAdded && packingItems.length > 0) {
      packingItems.forEach((item) => {
        counter += 1;
        rows.push({
          no: counter,
          noBox: item?.no_box || '-',
          namaBarang: item?.nama_barang || '-',
          jumlah: formatQuantity(
            item?.jumlah_carton ?? item?.total_box,
            'Box',
            item?.total_qty ?? item?.quantity,
            item?.satuan || 'Qty'
          ),
          totalQuantity: formatQuantity(
            item?.total_qty ?? item?.quantity,
            item?.satuan || 'Qty',
            item?.jumlah_carton ?? item?.total_box,
            'Box'
          ),
          keterangan: buildPackingKeterangan(item),
        });
      });
    }
  });

  if (!rows.length) {
    return `
      <tr>
        <td class="center" colspan="6">Data detail checklist tidak tersedia.</td>
      </tr>
    `;
  }

  return rows
    .map(
      (row) => `
        <tr>
          <td class="center">${escapeHtml(row.no)}</td>
          <td class="center">${escapeHtml(row.noBox || '-')}</td>
          <td>${escapeHtml(row.namaBarang || '-')}</td>
          <td class="center">${row.jumlah}</td>
          <td>${row.totalQuantity}</td>
          <td>${row.keterangan ? formatMultiline(row.keterangan) : ''}</td>
        </tr>
      `
    )
    .join('');
};

const buildDocumentHtml = (checklist) => {
  const suratJalanList = getSuratJalanList(checklist);
  const primarySuratJalan = suratJalanList[0] || null;

  const destinationSummary = buildDestinationSummary(suratJalanList);
  const destinationHeader = buildDestinationHeader(primarySuratJalan, 0);
  const tableRows = buildTableRows(suratJalanList);

  const origin =
    extractField(checklist, ['origin', 'asal', 'companyName', 'company', 'dari']) ||
    extractField(primarySuratJalan, ['deliver_from', 'asal', 'warehouseName']) ||
    'PT Doven Tradeco';
  const locationName =
    extractField(checklist, ['kota', 'lokasi', 'destinationCity']) ||
    extractField(primarySuratJalan, ['kota', 'city', 'destinationCity']) ||
    'Jakarta';
  const formattedDate =
    formatDateLong(
      checklist?.tanggal ||
        checklist?.createdAt ||
        primarySuratJalan?.tanggal ||
        primarySuratJalan?.createdAt
    ) || '-';

  const infoRows = [
    { label: 'Dari', valueHtml: escapeHtml(origin) },
    { label: 'Tanggal', valueHtml: formattedDate || '-' },
    { label: 'Mobil', valueHtml: escapeHtml(checklist?.mobil || '-') },
    { label: 'Driver', valueHtml: escapeHtml(checklist?.driver || '-') },
    { label: 'Checker', valueHtml: escapeHtml(checklist?.checker || '-') },
    {
      label: 'Tujuan',
      valueHtml: destinationSummary || escapeHtml('Belum ada tujuan terkait'),
    },
  ];

  const infoRowsHtml = infoRows
    .map(
      (row) => `
        <div class="cl-info-row">
          <div class="cl-info-label">${escapeHtml(row.label)}</div>
          <div class="cl-info-colon">:</div>
          <div class="cl-info-value">${row.valueHtml}</div>
        </div>
      `
    )
    .join('');

  const dateLocation = `${escapeHtml(locationName)}, ${formattedDate}`;

  return `
    <div class="cl-document">
      <style>
        .cl-document {
          font-family: Arial, sans-serif;
          width: 900px;
          margin: 0 auto;
          padding: 40px;
          background-color: #ffffff;
          color: #000000;
        }
        .cl-title {
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 30px;
          letter-spacing: 2px;
        }
        .cl-info-section {
          margin-bottom: 30px;
          font-size: 14px;
          line-height: 1.8;
        }
        .cl-info-row {
          display: grid;
          grid-template-columns: 100px 20px auto;
          margin-bottom: 5px;
        }
        .cl-info-label {
          font-weight: normal;
        }
        .cl-info-colon {
          text-align: left;
        }
        .cl-info-value {
          font-weight: normal;
        }
        .cl-destination-header {
          margin: 25px 0 15px 0;
          font-size: 14px;
          font-weight: bold;
        }
        .cl-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 13px;
        }
        .cl-table th {
          background-color: white;
          border: 1px solid #000;
          padding: 10px 8px;
          text-align: center;
          font-weight: bold;
        }
        .cl-table td {
          border: 1px solid #000;
          padding: 10px 8px;
          vertical-align: middle;
        }
        .cl-table td.center {
          text-align: center;
        }
        .cl-date-location {
          text-align: right;
          margin: 40px 0 80px 0;
          font-size: 14px;
        }
        .cl-signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 100px;
          margin-top: 100px;
          margin-bottom: 80px;
        }
        .cl-signature-box {
          text-align: center;
        }
        .cl-signature-line {
          margin-bottom: 10px;
          font-size: 14px;
        }
        .cl-signature-title {
          font-size: 14px;
        }
        .cl-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
          font-size: 13px;
          border-top: 1px solid #ccc;
          padding-top: 10px;
        }
      </style>

      <div class="cl-title">BUKTI UNLOADING BARANG</div>

      <div class="cl-info-section">
        ${infoRowsHtml}
      </div>

      ${
        destinationHeader
          ? `<div class="cl-destination-header">${destinationHeader}</div>`
          : ''
      }

      <table class="cl-table">
        <thead>
          <tr>
            <th style="width: 5%;">No</th>
            <th style="width: 10%;">No. Box</th>
            <th style="width: 35%;">NAMA BARANG</th>
            <th style="width: 12%;">Jumlah</th>
            <th style="width: 28%;">Total Quantity</th>
            <th style="width: 10%;">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="cl-date-location">${dateLocation}</div>

      <div class="cl-signature-section">
        <div class="cl-signature-box">
          <div class="cl-signature-line">(..............................)</div>
          <div class="cl-signature-title">Checker Doven</div>
        </div>
        <div class="cl-signature-box">
          <div class="cl-signature-line">(..............................)</div>
          <div class="cl-signature-title">Checker Ekspedisi</div>
        </div>
      </div>

      <div class="cl-footer">
        <div>${escapeHtml(origin)}</div>
        <div>Page 1</div>
      </div>
    </div>
  `;
};

export const exportCheckingListToPDF = async (checklist) => {
  if (!checklist) {
    alert('Data checklist surat jalan tidak tersedia.');
    return;
  }

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '900px';
  container.style.backgroundColor = '#ffffff';
  container.innerHTML = buildDocumentHtml(checklist);

  document.body.appendChild(container);

  try {
    const pdfElement = container.querySelector('.cl-document') || container;

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

    const fileName = `${sanitizeFileName(
      checklist?.id ||
        checklist?.checklistId ||
        checklist?.suratJalanId ||
        extractField(checklist, ['kode', 'kodeChecklist']) ||
        'Checklist_Surat_Jalan'
    )}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Gagal mengekspor checklist surat jalan ke PDF:', error);
    alert('Gagal mengekspor checklist surat jalan ke PDF. Silakan coba lagi.');
  } finally {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};

export default exportCheckingListToPDF;

import {
  createPDFDocument,
  drawText,
  drawMultilineText,
  drawTable,
  drawLine,
  drawSignatureArea,
  checkAndAddPage,
  generateFileName,
} from '../../utils/pdfUtils';
import {
  PDF_FONT_SIZES,
  PDF_FONT_STYLES,
  PDF_MARGINS,
  PDF_PAGE,
} from '../../utils/pdfConfig';
import { toast } from 'react-toastify';
import { getActiveCompanyName } from '../../utils/companyUtils';

const numberFormatter = new Intl.NumberFormat('id-ID');

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
    return `${formattedNumber} ${normalizedUnit.toUpperCase()}`;
  }

  return formattedNumber;
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
    return String(primaryValue).trim();
  }

  if (fallbackValue && String(fallbackValue).trim()) {
    return String(fallbackValue).trim();
  }

  return '-';
};

const formatMultilineText = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value
      .map((line) => String(line).trim())
      .filter((line) => Boolean(line))
      .join('\n');
  }

  const text = String(value).trim();
  return text.replace(/\r?\n/g, '\n');
};

const formatDateLong = (value) => {
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
    notes.push(String(item.keterangan));
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

const buildDestinationHeaderText = (suratJalan, index) => {
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

  const suffix = destinationCode ? ` (${destinationCode})` : '';
  return `${index + 1}. ${destinationName}${suffix}`;
};

const buildDestinationSummaryLines = (suratJalanList) => {
  if (!suratJalanList.length) {
    return [];
  }

  return suratJalanList.map((suratJalan, index) => {
    const header = buildDestinationHeaderText(suratJalan, index);
    const { totalBoxes, totalQuantity } = calculateTotals(suratJalan);

    const parts = [];
    if (totalBoxes !== null) {
      parts.push(`${numberFormatter.format(totalBoxes)} Box`);
    }
    if (totalQuantity !== null) {
      parts.push(`${numberFormatter.format(totalQuantity)} Qty`);
    }

    const suffix = parts.length ? ` = ${parts.join(' / ')}` : '';
    return `${header}${suffix}`;
  });
};

const collectChecklistRows = (suratJalanList) => {
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
          no: String(counter),
          noBox: detail?.no_box || '-',
          namaBarang: detail?.nama_barang || '-',
          jumlah: formatQuantity(detail?.total_box, 'Box', detail?.total_quantity_in_box, 'Qty'),
          totalQuantity: formatQuantity(
            detail?.total_quantity_in_box,
            'Qty',
            detail?.total_box,
            'Box'
          ),
          keterangan: formatMultilineText(detail?.keterangan || ''),
        });
        return;
      }

      items.forEach((item) => {
        counter += 1;
        rows.push({
          no: String(counter),
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
          keterangan: formatMultilineText(item?.keterangan || detail?.keterangan || ''),
        });
      });
    });

    const detailRowsAdded = rows.length > beforeCount;

    if (!detailRowsAdded && packingItems.length > 0) {
      packingItems.forEach((item) => {
        counter += 1;
        rows.push({
          no: String(counter),
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
          keterangan: formatMultilineText(buildPackingKeterangan(item)),
        });
      });
    }
  });

  return rows;
};

const createInfoRows = (checklist, suratJalanList) => {
  const primarySuratJalan = suratJalanList[0] || null;
  const destinationSummaryLines = buildDestinationSummaryLines(suratJalanList);
  const destinationSummary =
    destinationSummaryLines.length > 0
      ? destinationSummaryLines.join('\n')
      : 'Belum ada tujuan terkait';

  const companyName = getActiveCompanyName(
    checklist?.company,
    checklist?.companyInfo,
    primarySuratJalan?.company,
    primarySuratJalan?.companyProfile,
    checklist,
    primarySuratJalan,
  );

  const origin =
    extractField(checklist, ['origin', 'asal', 'companyName', 'company', 'dari']) ||
    extractField(primarySuratJalan, ['deliver_from', 'asal', 'warehouseName']) ||
    companyName;

  const formattedDate =
    formatDateLong(
      checklist?.tanggal ||
        checklist?.createdAt ||
        primarySuratJalan?.tanggal ||
        primarySuratJalan?.createdAt
    ) || '-';

  const rows = [
    { label: 'Dari', value: origin },
    { label: 'Tanggal', value: formattedDate },
    { label: 'Mobil', value: checklist?.mobil || '-' },
    { label: 'Driver', value: checklist?.driver || '-' },
    { label: 'Checker', value: checklist?.checker || '-' },
    { label: 'Tujuan', value: destinationSummary },
  ];

  return { rows, origin, formattedDate, companyName };
};

const getDateLocation = (checklist, primarySuratJalan, fallbackDate) => {
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
    ) || fallbackDate;

  return `${locationName}, ${formattedDate}`;
};

const getChecklistIdentifier = (checklist) => {
  return (
    checklist?.id ||
    checklist?.checklistId ||
    checklist?.suratJalanId ||
    extractField(checklist, ['kode', 'kodeChecklist']) ||
    'Checklist'
  );
};

const drawCheckingListHeader = (pdf, infoRows) => {
  let yPosition = PDF_MARGINS.top;

  drawText(pdf, 'BUKTI UNLOADING BARANG', PDF_PAGE.width / 2, yPosition, {
    fontSize: PDF_FONT_SIZES.title,
    fontStyle: PDF_FONT_STYLES.bold,
    align: 'center',
  });

  yPosition += 12;

  const labelWidth = 30;
  const colonX = PDF_MARGINS.left + labelWidth + 2;
  const valueStartX = colonX + 4;
  const valueWidth = PDF_PAGE.width - PDF_MARGINS.right - valueStartX;

  infoRows.forEach((row) => {
    drawText(pdf, row.label, PDF_MARGINS.left, yPosition, {
      fontSize: PDF_FONT_SIZES.body,
      fontStyle: PDF_FONT_STYLES.bold,
    });

    drawText(pdf, ':', colonX, yPosition, {
      fontSize: PDF_FONT_SIZES.body,
    });

    const nextY = drawMultilineText(
      pdf,
      row.value,
      valueStartX,
      yPosition,
      valueWidth,
      { fontSize: PDF_FONT_SIZES.body },
    );

    yPosition = Math.max(nextY, yPosition + 6);
  });

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

const drawDestinationHeader = (pdf, headerText, startY) => {
  if (!headerText) {
    return startY;
  }

  drawText(pdf, headerText, PDF_MARGINS.left, startY, {
    fontSize: PDF_FONT_SIZES.sectionHeader,
    fontStyle: PDF_FONT_STYLES.bold,
  });

  return startY + 8;
};

const drawChecklistTable = (pdf, tableRows, startY) => {
  const headers = [
    'No',
    'No. Box',
    'Nama Barang',
    'Jumlah',
    'Total Quantity',
    'Keterangan',
  ];

  const columnWidths = [10, 20, 60, 22, 40, 18];
  const alignments = ['center', 'center', 'left', 'center', 'left', 'left'];

  const rows = tableRows.map((row) => [
    row.no,
    row.noBox || '-',
    row.namaBarang || '-',
    row.jumlah || '-',
    row.totalQuantity || '-',
    row.keterangan || '',
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
      headerAlignments: ['center', 'center', 'left', 'center', 'left', 'left'],
      fontSize: PDF_FONT_SIZES.tableBody,
      headerFontSize: PDF_FONT_SIZES.tableHeader,
    },
  );
};

const drawDateLocation = (pdf, dateLocation, startY) => {
  const yPosition = startY + 12;
  drawText(
    pdf,
    dateLocation,
    PDF_PAGE.width - PDF_MARGINS.right,
    yPosition,
    {
      fontSize: PDF_FONT_SIZES.body,
      align: 'right',
    },
  );

  return yPosition + 6;
};

const applyFooter = (pdf, origin) => {
  const pageCount = pdf.getNumberOfPages();
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    pdf.setPage(pageNumber);

    const footerY = PDF_PAGE.height - 10;

    drawLine(
      pdf,
      PDF_MARGINS.left,
      footerY - 4,
      PDF_PAGE.width - PDF_MARGINS.right,
      footerY - 4,
    );

    drawText(
      pdf,
      origin,
      PDF_MARGINS.left,
      footerY,
      { fontSize: PDF_FONT_SIZES.small },
    );

    drawText(
      pdf,
      `Page ${pageNumber} of ${pageCount}`,
      PDF_PAGE.width - PDF_MARGINS.right,
      footerY,
      { fontSize: PDF_FONT_SIZES.small, align: 'right' },
    );
  }
};

export const exportCheckingListToPDF = async (checklist) => {
  try {
    if (!checklist) {
      throw new Error('Data checklist surat jalan tidak tersedia');
    }

    const suratJalanList = getSuratJalanList(checklist);
    if (!suratJalanList.length) {
      throw new Error('Tidak ada surat jalan terkait checklist');
    }

    const tableRows = collectChecklistRows(suratJalanList);
    if (!tableRows.length) {
      throw new Error('Tidak ada detail checklist untuk dicetak');
    }

    const { rows: infoRows, origin, formattedDate, companyName } = createInfoRows(
      checklist,
      suratJalanList,
    );

    const primarySuratJalan = suratJalanList[0] || null;
    const destinationHeader = buildDestinationHeaderText(primarySuratJalan, 0);
    const dateLocation = getDateLocation(checklist, primarySuratJalan, formattedDate);

    const pdf = createPDFDocument();
    let yPosition = drawCheckingListHeader(pdf, infoRows);

    yPosition = drawDestinationHeader(pdf, destinationHeader, yPosition);

    yPosition = checkAndAddPage(pdf, yPosition, 40);
    yPosition = drawChecklistTable(pdf, tableRows, yPosition);

    yPosition = checkAndAddPage(pdf, yPosition, 40);
    yPosition = drawDateLocation(pdf, dateLocation, yPosition);

    yPosition = checkAndAddPage(pdf, yPosition, 60);
    drawSignatureArea(pdf, yPosition, [`Checker ${companyName}`, 'Checker Ekspedisi'], {
      columns: 2,
      spacing: 45,
    });

    applyFooter(pdf, origin);

    const fileName = generateFileName('CHECKING_LIST', getChecklistIdentifier(checklist));
    pdf.save(fileName);

    toast.success('Checking List berhasil di-export ke PDF', {
      position: 'top-right',
      autoClose: 3000,
    });
  } catch (error) {
    console.error('Error exporting checking list:', error);
    toast.error(`Gagal export: ${error.message}`, {
      position: 'top-right',
      autoClose: 5000,
    });
  }
};

export default exportCheckingListToPDF;

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
  PDF_COLORS,
  PDF_FONT_SIZES,
  PDF_FONT_STYLES,
  PDF_MARGINS,
  PDF_PAGE,
} from '../../utils/pdfConfig';
import { toast } from 'react-toastify';
import { DEFAULT_COMPANY_NAME, getActiveCompanyName } from '../../utils/companyUtils';

const getCompanyName = (suratJalan) => {
  if (suratJalan && typeof suratJalan === 'object') {
    return getActiveCompanyName(
      suratJalan.company,
      suratJalan.companyProfile,
      suratJalan,
    );
  }

  return getActiveCompanyName();
};

const formatMultilineText = (value) => {
  if (!value) {
    return '-';
  }

  return String(value).trim().replace(/\r?\n/g, '\n') || '-';
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
  if (numeric === null || numeric === undefined || Number.isNaN(numeric)) {
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
  const safeUnit = unit ? String(unit).trim() : '';

  if (numericValue !== null) {
    const formattedNumber = formatNumeric(numericValue);
    if (!formattedNumber) {
      return '-';
    }
    return safeUnit ? `${formattedNumber} ${safeUnit}` : formattedNumber;
  }

  const textValue = String(value).trim();
  if (!textValue) {
    return '-';
  }

  return safeUnit ? `${textValue} ${safeUnit}` : textValue;
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

const buildDetailRows = (details = []) => {
  if (!Array.isArray(details)) {
    return [];
  }

  return details.map((detail, index) => {
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

    return [
      String(index + 1),
      String(detail?.no_box ?? primaryItem?.no_box ?? '-'),
      namaBarang || '-',
      jumlahPerCarton,
      totalQuantity,
      formatMultilineText(keterangan),
    ];
  });
};

const drawSuratJalanHeader = (pdf, suratJalan, companyName) => {
  let yPosition = PDF_MARGINS.top;

  drawText(pdf, 'SURAT JALAN', PDF_MARGINS.left, yPosition, {
    fontSize: PDF_FONT_SIZES.title,
    fontStyle: PDF_FONT_STYLES.bold,
  });

  const safeCompanyName =
    typeof companyName === 'string' && companyName.trim()
      ? companyName.trim()
      : DEFAULT_COMPANY_NAME;

  drawText(pdf, safeCompanyName, PDF_PAGE.width - PDF_MARGINS.right, yPosition, {
    fontSize: PDF_FONT_SIZES.sectionHeader,
    fontStyle: PDF_FONT_STYLES.bold,
    align: 'right',
  });

  yPosition += 8;

  drawLine(
    pdf,
    PDF_MARGINS.left,
    yPosition,
    PDF_PAGE.width - PDF_MARGINS.right,
    yPosition,
    { color: PDF_COLORS.lightGray, lineWidth: 0.4 },
  );

  yPosition += 5;

  const infoEntries = [
    {
      label: 'Tanggal Surat Jalan',
      value: formatDateLong(suratJalan?.createdAt),
    },
    {
      label: 'Nomor Surat Jalan',
      value: suratJalan?.no_surat_jalan || '-',
    },
    {
      label: 'Alamat Kirim',
      value: formatMultilineText(suratJalan?.alamat_tujuan),
    },
    {
      label: 'PIC',
      value: suratJalan?.PIC || '-',
    },
    {
      label: 'No. PO',
      value: suratJalan?.purchaseOrder?.po_number || '-',
    },
  ];

  const labelColumnWidth = 52;
  const valueStartX = PDF_MARGINS.left + labelColumnWidth;
  const valueWidth =
    PDF_PAGE.width - PDF_MARGINS.right - valueStartX;

  infoEntries.forEach((entry) => {
    drawText(pdf, entry.label, PDF_MARGINS.left, yPosition, {
      fontSize: PDF_FONT_SIZES.body,
      fontStyle: PDF_FONT_STYLES.bold,
    });

    const nextY = drawMultilineText(
      pdf,
      entry.value,
      valueStartX,
      yPosition,
      valueWidth,
      { fontSize: PDF_FONT_SIZES.body },
    );

    yPosition = Math.max(nextY, yPosition + 6);
  });

  yPosition += 6;

  return yPosition;
};

const drawSuratJalanDetailsTable = (pdf, details, startY) => {
  const headers = [
    'No',
    'No. Box',
    'Nama Barang',
    'Jumlah / Carton',
    'Total Quantity',
    'Keterangan',
  ];

  const columnWidths = [10, 25, 55, 30, 25, 25];
  const alignments = ['center', 'center', 'left', 'right', 'right', 'left'];

  return drawTable(
    pdf,
    headers,
    buildDetailRows(details),
    PDF_MARGINS.left,
    startY,
    {
      columnWidths,
      alignments,
      headerAlignments: ['center', 'center', 'left', 'center', 'center', 'left'],
      fontSize: PDF_FONT_SIZES.tableBody,
      headerFontSize: PDF_FONT_SIZES.tableHeader,
    },
  );
};

const drawSuratJalanFooter = (pdf, suratJalan, startY) => {
  let yPosition = startY + 10;

  const remarks = formatMultilineText(suratJalan?.remarks);
  if (remarks && remarks !== '-') {
    drawText(pdf, 'Catatan:', PDF_MARGINS.left, yPosition, {
      fontSize: PDF_FONT_SIZES.body,
      fontStyle: PDF_FONT_STYLES.bold,
    });
    yPosition += 5;

    yPosition = drawMultilineText(
      pdf,
      remarks,
      PDF_MARGINS.left,
      yPosition,
      PDF_PAGE.contentWidth,
      { fontSize: PDF_FONT_SIZES.body },
    );

    yPosition += 8;
  }

  drawText(pdf, 'Note:', PDF_MARGINS.left, yPosition, {
    fontSize: PDF_FONT_SIZES.body,
    fontStyle: PDF_FONT_STYLES.bold,
  });
  yPosition += 5;

  const notes = [
    '* Dokumen kembali ke Jakarta',
    '* Stempel DC',
  ];

  notes.forEach((note) => {
    yPosition = drawMultilineText(
      pdf,
      note,
      PDF_MARGINS.left,
      yPosition,
      PDF_PAGE.contentWidth,
      { fontSize: PDF_FONT_SIZES.body },
    );
  });

  yPosition += 10;

  yPosition = checkAndAddPage(pdf, yPosition, 60);

  drawSignatureArea(
    pdf,
    yPosition,
    ['Hormat Kami', 'Penerima', 'Penerima Dokumen'],
    { columns: 3, spacing: 40 },
  );
};

export const exportSuratJalanToPDF = async (suratJalan) => {
  try {
    if (!suratJalan) {
      throw new Error('Data surat jalan tidak tersedia');
    }

    const details = Array.isArray(suratJalan.suratJalanDetails)
      ? suratJalan.suratJalanDetails
      : suratJalan.suratJalanDetails
        ? [suratJalan.suratJalanDetails]
        : [];

    if (details.length === 0) {
      throw new Error('Tidak ada detail untuk dicetak');
    }

    const pdf = createPDFDocument();
    let yPosition = PDF_MARGINS.top;

    const companyName = getCompanyName(suratJalan);

    yPosition = drawSuratJalanHeader(pdf, suratJalan, companyName);

    yPosition = checkAndAddPage(pdf, yPosition, 30);
    yPosition = drawSuratJalanDetailsTable(pdf, details, yPosition);

    drawSuratJalanFooter(pdf, suratJalan, yPosition);

    const fileName = generateFileName('SURAT_JALAN', suratJalan.no_surat_jalan);
    pdf.save(fileName);

    toast.success('Surat Jalan berhasil di-export ke PDF', {
      position: 'top-right',
      autoClose: 3000,
    });
  } catch (error) {
    console.error('Error exporting Surat Jalan:', error);
    toast.error(`Gagal export: ${error.message}`, {
      position: 'top-right',
      autoClose: 5000,
    });
  }
};

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
import { formatCurrency as baseFormatCurrency } from '../../utils/formatUtils';
import { toast } from 'react-toastify';

const CLEAN_NUMERIC_REGEX = /[^0-9,-]/g;

const toSafeText = (value, fallback = '-') => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return String(value);
    }
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value ? 'Ya' : 'Tidak';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
};

const pickValue = (source, paths = [], fallback = null) => {
  for (let index = 0; index < paths.length; index += 1) {
    const path = paths[index];
    if (!path) {
      continue;
    }

    const segments = Array.isArray(path) ? path : String(path).split('.');
    let current = source;
    let isValid = true;

    for (let i = 0; i < segments.length; i += 1) {
      if (
        current === null ||
        current === undefined ||
        typeof current !== 'object'
      ) {
        isValid = false;
        break;
      }
      const key = segments[i];
      current = current[key];
    }

    if (!isValid) {
      continue;
    }

    if (
      current !== null &&
      current !== undefined &&
      !(typeof current === 'string' && current.trim() === '')
    ) {
      return current;
    }
  }

  return fallback;
};

const toNumeric = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const cleaned = trimmed.replace(CLEAN_NUMERIC_REGEX, '').replace(/\./g, '').replace(/,/g, '.');
    if (!cleaned) {
      return null;
    }

    const numeric = Number(cleaned);
    return Number.isFinite(numeric) ? numeric : null;
  }

  return null;
};

const formatNumber = (value) => {
  const numeric = toNumeric(value);
  if (numeric === null) {
    return '-';
  }

  return numeric.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const formatCurrency = (value) => {
  const formatted = baseFormatCurrency(value);
  if (!formatted || formatted === 'N/A') {
    return '-';
  }
  return formatted;
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
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const extractHeaderInfo = (ttf) => {
  const company = ttf?.company || {};
  const supplier = ttf?.supplier || {};

  const bankName = pickValue(ttf, [
    'bank',
    'bank_name',
    'bankName',
    ['bank', 'name'],
    ['company', 'bank'],
    ['company', 'bank_name'],
    ['company', 'bankName'],
  ]);

  const accountNumber = pickValue(ttf, [
    'bank_account_number',
    'bankAccountNumber',
    'bank_account',
    ['bank', 'account'],
    ['bank', 'number'],
    ['company', 'bank_account_number'],
    ['company', 'bank_account'],
    ['company', 'bankAccountNumber'],
  ]);

  const branchLocation = pickValue(ttf, [
    'lokasi',
    'lokasi_midi',
    'location',
    'branch',
    ['company', 'branch'],
    ['company', 'company_name'],
    ['company', 'company_branch'],
  ]);

  const supplierCode =
    toSafeText(
      pickValue(ttf, ['code_supplier', ['supplier', 'code'], ['supplier', 'kode_supplier']]),
      '-'
    );

  const supplierName =
    toSafeText(
      pickValue(ttf, [
        'supplier_name',
        ['supplier', 'name'],
        ['supplier', 'nama_supplier'],
        ['supplier', 'companyName'],
      ]),
      '-'
    );

  const email =
    toSafeText(
      pickValue(ttf, ['email', ['supplier', 'email'], 'supplier_email']),
      '-'
    );

  const phone =
    toSafeText(
      pickValue(ttf, [
        'phone',
        'telepon',
        ['supplier', 'phone'],
        ['supplier', 'phoneNumber'],
        ['supplier', 'telepon'],
      ]),
      '-'
    );

  const contactPerson =
    toSafeText(
      pickValue(ttf, [
        'contact_person',
        'pic',
        ['supplier', 'contact_person'],
        ['supplier', 'pic'],
        ['supplier', 'contact'],
      ]),
      '-'
    );

  const locationLabel = branchLocation
    ? toSafeText(branchLocation)
    : toSafeText(company?.company_name);

  return {
    companyName: toSafeText(
      company?.company_name ||
        company?.name ||
        pickValue(ttf, ['companyName', ['company', 'display_name']]) ||
        supplierName ||
        'Perusahaan',
      'Perusahaan'
    ),
    leftInfo: [
      { label: 'Bank', value: toSafeText(bankName, '-') },
      { label: 'No Rekening', value: toSafeText(accountNumber, '-') },
      {
        label: 'Lokasi MIDI (Branch/HO)',
        value: toSafeText(locationLabel, '-'),
      },
      { label: 'Kode Supplier', value: supplierCode },
      { label: 'Nama Supplier', value: supplierName },
    ],
    rightInfo: [
      {
        label: 'Tanggal',
        value: formatDateLong(ttf?.tanggal),
      },
      { label: 'Email', value: email },
      { label: 'No Telepon', value: phone },
      { label: 'Contact Person', value: contactPerson },
    ],
  };
};

const collectDetailItems = (ttf) => {
  const candidates = [
    ttf?.tandaTerimaFakturDetails,
    ttf?.tandaTerimaFakturDetail,
    ttf?.details,
    ttf?.detail,
    ttf?.items,
    ttf?.fakturItems,
    ttf?.fakturs,
    ttf?.tandaTerimaFakturInvoices,
    ttf?.invoiceDetails,
  ];

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    if (!candidate) {
      continue;
    }

    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }

    if (!Array.isArray(candidate) && typeof candidate === 'object') {
      const values = Object.values(candidate);
      if (values.length > 0) {
        return values;
      }
    }
  }

  return [];
};

const buildDetailRows = (items = []) => {
  let dppTotal = 0;
  let ppnTotal = 0;
  let grandTotal = 0;

  const rows = items.map((item, index) => {
    const lpbNumber = pickValue(item, [
      'no_lpb',
      'noLpb',
      'nomor_lpb',
      'lpb_number',
      'lpbNumber',
      ['laporanPenerimaanBarang', 'no_lpb'],
      ['laporanPenerimaanBarang', 'nomor_lpb'],
      ['lpb', 'no_lpb'],
      ['laporanPenerimaanBarang', 'number'],
    ]);

    const invoice = pickValue(item, ['invoice', 'invoicePengiriman', 'faktur', 'invoiceData'], null);
    const invoiceNumber = pickValue(
      item,
      [
        'no_invoice',
        'invoice_no',
        'nomor_invoice',
        'invoiceNumber',
        ['invoice', 'no_invoice'],
        ['invoice', 'nomor_invoice'],
        ['invoicePengiriman', 'no_invoice'],
      ],
      invoice ? pickValue(invoice, ['no_invoice', 'nomor_invoice']) : null
    );

    const fpNumber = pickValue(item, [
      'nomor_seri_faktur_pajak',
      'no_seri_faktur',
      'tax_invoice_number',
      'no_fp',
      'fp',
      ['fakturPajak', 'nomor_seri'],
      ['fakturPajak', 'nomor_seri_faktur_pajak'],
    ]);

    const dppRaw = pickValue(item, [
      'dpp',
      'nilai_dpp',
      'harga_dpp',
      'invoice_amount',
      'subtotal',
      'amount',
      ['invoice', 'nilai_dpp'],
      ['invoice', 'subtotal'],
    ]);
    const ppnRaw = pickValue(item, [
      'ppn',
      'nilai_ppn',
      'tax',
      'ppn_amount',
      'ppnValue',
      ['invoice', 'nilai_ppn'],
    ]);
    const totalRaw = pickValue(item, [
      'total',
      'grand_total',
      'jumlah',
      'total_amount',
      'amount_total',
      ['invoice', 'grand_total'],
      ['invoice', 'total'],
    ]);

    const dpp = toNumeric(dppRaw);
    const ppn = toNumeric(ppnRaw);
    let rowTotal = toNumeric(totalRaw);

    if (dpp !== null) {
      dppTotal += dpp;
    }

    if (ppn !== null) {
      ppnTotal += ppn;
    }

    if (rowTotal === null) {
      if (dpp !== null && ppn !== null) {
        rowTotal = dpp + ppn;
      } else if (dpp !== null) {
        rowTotal = dpp;
      } else if (ppn !== null) {
        rowTotal = ppn;
      }
    }

    if (rowTotal !== null) {
      grandTotal += rowTotal;
    }

    return [
      String(index + 1),
      toSafeText(lpbNumber, '-'),
      toSafeText(invoiceNumber, '-'),
      formatNumber(dpp),
      toSafeText(fpNumber, '-'),
      formatNumber(ppn),
      formatNumber(rowTotal),
    ];
  });

  if (rows.length > 0) {
    rows.push([
      '',
      '',
      'Jumlah',
      formatNumber(dppTotal),
      '',
      formatNumber(ppnTotal),
      formatNumber(grandTotal),
    ]);
  }

  return {
    rows,
    totals: {
      dpp: dppTotal,
      ppn: ppnTotal,
      grandTotal,
    },
  };
};

const drawCompanyHeader = (pdf, companyName, startY) => {
  let currentY = startY;

  currentY = drawText(pdf, companyName, PDF_MARGINS.left, currentY, {
    fontSize: PDF_FONT_SIZES.body,
    fontStyle: PDF_FONT_STYLES.bold,
  });

  currentY += 2;

  currentY = drawText(
    pdf,
    'TANDA TERIMA PENYERAHAN FAKTUR',
    PDF_PAGE.width / 2,
    currentY + 10,
    {
      fontSize: PDF_FONT_SIZES.sectionHeader,
      fontStyle: PDF_FONT_STYLES.bold,
      align: 'center',
    }
  );

  currentY += 6;
  drawLine(
    pdf,
    PDF_MARGINS.left,
    currentY,
    PDF_PAGE.width - PDF_MARGINS.right,
    currentY,
    { color: PDF_COLORS.lightGray, lineWidth: 0.3 }
  );

  return currentY + 6;
};

const drawInfoSection = (pdf, info, startY) => {
  const labelWidth = 42;
  const leftX = PDF_MARGINS.left;
  const rightX = PDF_MARGINS.left + PDF_PAGE.contentWidth / 2 + 6;
  let currentY = startY;

  const maxRows = Math.max(info.leftInfo.length, info.rightInfo.length);
  const rowHeight = 6;

  for (let i = 0; i < maxRows; i += 1) {
    const leftRow = info.leftInfo[i];
    if (leftRow) {
      drawText(pdf, leftRow.label, leftX, currentY, {
        fontSize: PDF_FONT_SIZES.body,
      });
      drawText(pdf, ':', leftX + labelWidth, currentY, {
        fontSize: PDF_FONT_SIZES.body,
      });
      drawText(pdf, leftRow.value, leftX + labelWidth + 2, currentY, {
        fontSize: PDF_FONT_SIZES.body,
      });
    }

    const rightRow = info.rightInfo[i];
    if (rightRow) {
      drawText(pdf, rightRow.label, rightX, currentY, {
        fontSize: PDF_FONT_SIZES.body,
      });
      drawText(pdf, ':', rightX + labelWidth, currentY, {
        fontSize: PDF_FONT_SIZES.body,
      });
      drawText(pdf, rightRow.value, rightX + labelWidth + 2, currentY, {
        fontSize: PDF_FONT_SIZES.body,
      });
    }

    currentY += rowHeight;
  }

  return currentY + 4;
};

const drawDetailsTable = (pdf, rows, startY) => {
  const headers = [
    'No',
    'No LPB',
    'No Invoice (DPP)',
    'Nilai DPP (Rp)',
    'No Seri FP (PPN)',
    'Nilai PPN (Rp)',
    'Total (Rp)',
  ];

  const columnWidths = [10, 28, 46, 26, 36, 26, 28];
  const alignments = [
    'center',
    'center',
    'left',
    'right',
    'center',
    'right',
    'right',
  ];

  return drawTable(
    pdf,
    headers,
    rows,
    PDF_MARGINS.left,
    startY,
    {
      columnWidths,
      alignments,
      headerAlignments: [
        'center',
        'center',
        'center',
        'center',
        'center',
        'center',
        'center',
      ],
      fontSize: PDF_FONT_SIZES.tableBody,
      headerFontSize: PDF_FONT_SIZES.tableHeader,
    }
  );
};

const drawNotesAndSignature = (pdf, totals, startY) => {
  let currentY = startY + 10;

  currentY = drawText(pdf, 'Catatan :', PDF_MARGINS.left, currentY, {
    fontSize: PDF_FONT_SIZES.body,
    fontStyle: PDF_FONT_STYLES.bold,
  });

  currentY = drawMultilineText(
    pdf,
    '(1) Lembar ke-1 (asli) untuk Supplier/Principal\n(2) Lembar ke-2 (copy) untuk Petugas Tukar Faktur',
    PDF_MARGINS.left + 4,
    currentY + 2,
    PDF_PAGE.contentWidth / 2,
    {
      fontSize: PDF_FONT_SIZES.small,
    }
  );

  currentY += 10;

  currentY = checkAndAddPage(pdf, currentY, 40);

  currentY = drawSignatureArea(
    pdf,
    currentY,
    ['Supplier / Principal', 'Petugas Tukar Faktur'],
    { columns: 2, spacing: 60 }
  );

  currentY += 6;

  currentY = drawText(
    pdf,
    'Ref : Petunjuk Pelaksanaan Penerimaan Tagihan Supplier Barang Dagangan (MUI/JKL/FA/001)',
    PDF_MARGINS.left,
    currentY,
    { fontSize: PDF_FONT_SIZES.small }
  );

  currentY += 12;

  drawText(
    pdf,
    'INTERNAL USE ONLY',
    PDF_PAGE.width / 2,
    currentY,
    {
      fontSize: 20,
      fontStyle: PDF_FONT_STYLES.bold,
      align: 'center',
      color: PDF_COLORS.mediumGray,
    }
  );

  currentY += 10;

  drawText(
    pdf,
    'NRA:MUI/FRM/FA/105_Rev:000_151122',
    PDF_PAGE.width / 2,
    currentY,
    {
      fontSize: PDF_FONT_SIZES.small,
      align: 'center',
      color: PDF_COLORS.darkGray,
    }
  );

  currentY += 6;

  if (totals && (totals.dpp || totals.ppn || totals.grandTotal)) {
    currentY = checkAndAddPage(pdf, currentY, 20);

    drawText(
      pdf,
      `Grand Total: ${formatCurrency(totals.grandTotal)}`,
      PDF_MARGINS.left,
      currentY,
      {
        fontSize: PDF_FONT_SIZES.body,
        fontStyle: PDF_FONT_STYLES.bold,
      }
    );
  }
};

export const exportTandaTerimaFakturToPDF = async (tandaTerimaFaktur) => {
  try {
    if (!tandaTerimaFaktur) {
      throw new Error('Data tanda terima faktur tidak tersedia');
    }

    const detailItems = collectDetailItems(tandaTerimaFaktur);
    if (!detailItems.length) {
      throw new Error('Tidak ada detail faktur yang dapat dicetak');
    }

    const headerInfo = extractHeaderInfo(tandaTerimaFaktur);
    const { rows, totals } = buildDetailRows(detailItems);

    const pdf = createPDFDocument();
    let currentY = PDF_MARGINS.top;

    currentY = drawCompanyHeader(pdf, headerInfo.companyName, currentY);
    currentY = drawInfoSection(pdf, headerInfo, currentY + 4);

    currentY = checkAndAddPage(pdf, currentY, 40);
    currentY = drawDetailsTable(pdf, rows, currentY);

    drawNotesAndSignature(pdf, totals, currentY);

    const fileName = generateFileName(
      'TANDA_TERIMA_FAKTUR',
      tandaTerimaFaktur?.code_supplier || tandaTerimaFaktur?.id || ''
    );
    pdf.save(fileName);

    toast.success('Tanda Terima Faktur berhasil di-export ke PDF', {
      position: 'top-right',
      autoClose: 3000,
    });
  } catch (error) {
    console.error('Error exporting TTF:', error);
    toast.error(`Gagal export tanda terima faktur: ${error.message}`, {
      position: 'top-right',
      autoClose: 5000,
    });
  }
};

export default exportTandaTerimaFakturToPDF;

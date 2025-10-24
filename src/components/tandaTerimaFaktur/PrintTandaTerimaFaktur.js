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

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const DETAIL_FIELD_KEYS = new Set([
  'no_lpb',
  'noLpb',
  'nomor_lpb',
  'lpb_number',
  'lpbNumber',
  'no_invoice',
  'invoice_no',
  'nomor_invoice',
  'invoiceNumber',
  'dpp',
  'nilai_dpp',
  'harga_dpp',
  'invoice_amount',
  'subtotal',
  'amount',
  'ppn',
  'nilai_ppn',
  'tax',
  'ppn_amount',
  'ppnValue',
  'total',
  'grand_total',
  'jumlah',
  'total_amount',
  'amount_total',
  'nomor_seri_faktur_pajak',
  'no_seri_faktur',
  'tax_invoice_number',
  'no_fp',
  'fp',
]);

const DETAIL_NESTED_KEYS = [
  'invoice',
  'invoicePengiriman',
  'invoiceData',
  'laporanPenerimaanBarang',
  'laporan_penerimaan_barang',
  'lpb',
  'fakturPajak',
  'faktur_pajak',
];

const MAX_TRAVERSAL_DEPTH = 4;

const isDetailItem = (item) => {
  if (!isPlainObject(item)) {
    return false;
  }

  const keys = Object.keys(item);
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    if (DETAIL_FIELD_KEYS.has(key)) {
      return true;
    }
  }

  for (let index = 0; index < DETAIL_NESTED_KEYS.length; index += 1) {
    const key = DETAIL_NESTED_KEYS[index];
    if (item[key]) {
      return true;
    }
  }

  return false;
};

const normalizeDetailArray = (candidate, depth = 0) => {
  if (!candidate || depth > MAX_TRAVERSAL_DEPTH) {
    return [];
  }

  if (Array.isArray(candidate)) {
    const detailItems = candidate.filter((item) => isDetailItem(item));
    if (detailItems.length > 0) {
      return detailItems;
    }

    for (let index = 0; index < candidate.length; index += 1) {
      const nested = normalizeDetailArray(candidate[index], depth + 1);
      if (nested.length > 0) {
        return nested;
      }
    }

    return [];
  }

  if (isPlainObject(candidate)) {
    const prioritizedKeys = [
      'data',
      'items',
      'detail',
      'details',
      'rows',
      'values',
      'result',
      'list',
    ];

    for (let index = 0; index < prioritizedKeys.length; index += 1) {
      const key = prioritizedKeys[index];
      if (!Object.prototype.hasOwnProperty.call(candidate, key)) {
        continue;
      }

      const nested = normalizeDetailArray(candidate[key], depth + 1);
      if (nested.length > 0) {
        return nested;
      }
    }

    const values = Object.values(candidate);
    for (let index = 0; index < values.length; index += 1) {
      const nested = normalizeDetailArray(values[index], depth + 1);
      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
};

const DETAIL_COLLECTION_KEYS = [
  'tandaTerimaFakturDetails',
  'tandaTerimaFakturDetail',
  'tanda_terima_faktur_details',
  'tanda_terima_faktur_detail',
  'details',
  'detail',
  'detailItems',
  'detail_items',
  'items',
  'fakturItems',
  'fakturs',
  'tandaTerimaFakturInvoices',
  'tanda_terima_faktur_invoices',
  'invoiceDetails',
  'invoice_details',
];

const findDetailItemsInSource = (source) => {
  if (!source || (typeof source !== 'object' && !Array.isArray(source))) {
    return [];
  }

  const visited = new WeakSet();
  const queue = [source];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== 'object') {
      continue;
    }

    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    if (Array.isArray(current)) {
      const normalized = normalizeDetailArray(current);
      if (normalized.length > 0) {
        return normalized;
      }

      for (let index = 0; index < current.length; index += 1) {
        const value = current[index];
        if (value && typeof value === 'object') {
          queue.push(value);
        }
      }
      continue;
    }

    for (let index = 0; index < DETAIL_COLLECTION_KEYS.length; index += 1) {
      const key = DETAIL_COLLECTION_KEYS[index];
      if (!Object.prototype.hasOwnProperty.call(current, key)) {
        continue;
      }

      const candidate = current[key];
      const normalized = normalizeDetailArray(candidate);
      if (normalized.length > 0) {
        return normalized;
      }

      if (candidate && typeof candidate === 'object') {
        queue.push(candidate);
      }
    }

    const values = Object.values(current);
    for (let index = 0; index < values.length; index += 1) {
      const value = values[index];
      if (value && typeof value === 'object' && !visited.has(value)) {
        queue.push(value);
      }
    }
  }

  return [];
};

const toArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (isPlainObject(value)) {
    return Object.values(value);
  }

  return [];
};

const deriveDetailItemsFromInvoices = (ttf) => {
  const sources = [
    ttf,
    ttf?.data,
    ttf?.result,
    ttf?.payload,
    ttf?.tandaTerimaFaktur,
    ttf?.tanda_terima_faktur,
  ];

  for (let sourceIndex = 0; sourceIndex < sources.length; sourceIndex += 1) {
    const source = sources[sourceIndex];
    if (!isPlainObject(source)) {
      continue;
    }

    const invoices = pickValue(
      source,
      ['invoicePenagihan', 'invoice_penagihan', 'invoices'],
      null
    );
    const arrayInvoices = toArray(invoices);
    if (arrayInvoices.length === 0) {
      continue;
    }

    const derived = arrayInvoices
      .map((invoice) => {
        if (!invoice || typeof invoice !== 'object') {
          return null;
        }

        const invoiceNumber = pickValue(invoice, [
          'no_invoice_penagihan',
          'no_invoice',
          'nomor_invoice',
          'invoiceNumber',
        ]);
        const lpbNumber = pickValue(invoice, [
          'no_lpb',
          ['laporanPenerimaanBarang', 'no_lpb'],
          ['laporan_penerimaan_barang', 'no_lpb'],
        ]);
        const fakturPajak = pickValue(invoice, [
          'fakturPajak',
          'faktur_pajak',
        ]);
        const fpNumber = pickValue(
          invoice,
          [
            'nomor_seri_faktur_pajak',
            'no_seri_faktur',
            'tax_invoice_number',
            'no_fp',
            ['fakturPajak', 'nomor_seri_faktur_pajak'],
            ['fakturPajak', 'no_pajak'],
            ['faktur_pajak', 'nomor_seri_faktur_pajak'],
            ['faktur_pajak', 'no_pajak'],
          ],
          fakturPajak
            ? pickValue(fakturPajak, [
                'nomor_seri_faktur_pajak',
                'no_seri_faktur',
                'no_pajak',
              ])
            : null
        );
        const dppValue = pickValue(invoice, [
          'dpp',
          'nilai_dpp',
          ['summary', 'dpp'],
        ]);
        const ppnValue = pickValue(invoice, [
          'ppn',
          'nilai_ppn',
          ['summary', 'ppn'],
        ]);
        const totalValue = pickValue(invoice, [
          'grand_total',
          'total',
          'jumlah',
          'total_amount',
          'amount_total',
          'total_price',
          ['summary', 'grand_total'],
        ]);

        const hasMeaningfulValue =
          invoiceNumber ||
          lpbNumber ||
          fpNumber ||
          dppValue != null ||
          ppnValue != null ||
          totalValue != null;

        if (!hasMeaningfulValue) {
          return null;
        }

        return {
          invoice,
          invoiceData: invoice,
          no_invoice: invoiceNumber,
          no_lpb: lpbNumber,
          fakturPajak: fakturPajak || undefined,
          nomor_seri_faktur_pajak: fpNumber,
          dpp: dppValue,
          ppn: ppnValue,
          total: totalValue,
        };
      })
      .filter(Boolean);

    if (derived.length > 0) {
      return derived;
    }
  }

  return [];
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
  const sources = [
    ttf,
    ttf?.data,
    ttf?.result,
    ttf?.payload,
    ttf?.tandaTerimaFaktur,
    ttf?.tanda_terima_faktur,
  ];

  for (let index = 0; index < sources.length; index += 1) {
    const source = sources[index];
    const detailItems = findDetailItemsInSource(source);
    if (detailItems.length > 0) {
      return detailItems;
    }
  }

  const derivedItems = deriveDetailItemsFromInvoices(ttf);
  if (derivedItems.length > 0) {
    return derivedItems;
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

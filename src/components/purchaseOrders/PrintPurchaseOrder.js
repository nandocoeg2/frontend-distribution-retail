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
  PDF_COLORS,
  PDF_FONT_SIZES,
  PDF_FONT_STYLES,
  PDF_MARGINS,
  PDF_PAGE,
} from '../../utils/pdfConfig';
import { normalizeNumber, formatAmountInWords } from '../../utils/numberWords';

const numberFormatter = new Intl.NumberFormat('id-ID');

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const normalized = normalizeNumber(value);
  if (normalized !== null) {
    return normalized;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const formatNumberOrDash = (value) => {
  const numeric = toFiniteNumber(value);
  if (numeric === null) {
    return '-';
  }
  return numberFormatter.format(numeric);
};

const formatNumberOrZero = (value) => {
  const numeric = toFiniteNumber(value);
  if (numeric === null) {
    return '0';
  }
  return numberFormatter.format(numeric);
};

const formatPercentageOrDash = (value) => {
  const numeric = toFiniteNumber(value);
  if (numeric === null) {
    return '-';
  }
  return `${numeric}%`;
};

const formatRatio = (value) => {
  const numeric = toFiniteNumber(value);
  if (numeric === null) {
    return '1.00';
  }
  return numeric.toFixed(2);
};

const toTitleCaseWords = (text) =>
  text
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const formatAmountInWordsSentence = (value) => {
  const raw = formatAmountInWords(value);
  if (!raw || raw === '-') {
    return '-';
  }

  const cleaned = raw.replace(/#/g, '').replace(/rupiah/gi, '').trim();
  if (!cleaned) {
    return '-';
  }

  return toTitleCaseWords(cleaned);
};

const resolveField = (source, keys = []) => {
  if (!source || typeof source !== 'object') {
    return null;
  }

  for (const key of keys) {
    if (
      key in source &&
      source[key] !== null &&
      source[key] !== undefined &&
      source[key] !== ''
    ) {
      return source[key];
    }
  }

  return null;
};

const getDetails = (order) =>
  Array.isArray(order?.purchaseOrderDetails) ? order.purchaseOrderDetails : [];

const computeTotals = (order) => {
  const details = getDetails(order);

  const totals = details.reduce(
    (acc, detail) => {
      const totalQuantityOrder = toFiniteNumber(detail?.total_quantity_order) ?? 0;
      const price = toFiniteNumber(detail?.harga) ?? 0;
      const priceBeforeDiscount = totalQuantityOrder * price;

      const netUnitPrice = toFiniteNumber(detail?.harga_netto);
      const totalPembelian =
        toFiniteNumber(detail?.total_pembelian) ??
        (netUnitPrice !== null ? netUnitPrice * totalQuantityOrder : priceBeforeDiscount);

      const itemDiscount = Math.max(0, priceBeforeDiscount - totalPembelian);

      acc.totalPurchase += priceBeforeDiscount;
      acc.totalItemDiscount += itemDiscount;
      acc.totalAfterItemDiscount += totalPembelian;

      acc.totalBonus += toFiniteNumber(detail?.bonus) ?? 0;
      acc.totalLST += toFiniteNumber(detail?.lst) ?? 0;

      return acc;
    },
    {
      totalPurchase: 0,
      totalItemDiscount: 0,
      totalAfterItemDiscount: 0,
      totalBonus: 0,
      totalLST: 0,
    },
  );

  const invoiceDiscount =
    toFiniteNumber(
      resolveField(order, [
        'total_invoice_discount',
        'invoice_discount',
        'invoiceDiscount',
        'totalInvoiceDiscount',
      ]),
    ) ?? 0;

  const totalAfterDiscount = Math.max(0, totals.totalAfterItemDiscount - invoiceDiscount);

  const vatPercentage = toFiniteNumber(
    resolveField(order, [
      'ppn_percentage',
      'ppnPercentage',
      'vat_percentage',
      'vatPercentage',
    ]),
  );

  const vatAmount =
    toFiniteNumber(
      resolveField(order, [
        'ppnRupiah',
        'ppn_rupiah',
        'total_vat_input',
        'totalVatInput',
        'total_ppn',
        'vat_amount',
        'vatAmount',
      ]),
    ) ?? (vatPercentage !== null ? totalAfterDiscount * (vatPercentage / 100) : 0);

  const totalIncludeVat = totalAfterDiscount + vatAmount;
  const totalInvoice = totalIncludeVat + totals.totalLST + totals.totalBonus;

  return {
    totalPurchase: totals.totalPurchase,
    totalItemDiscount: totals.totalItemDiscount,
    invoiceDiscount,
    totalAfterDiscount,
    totalBonus: totals.totalBonus,
    totalLST: totals.totalLST,
    vatAmount,
    totalIncludeVat,
    totalInvoice,
  };
};

const formatDateShort = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const year = String(date.getFullYear()).slice(-2);

  return `${day}-${month}-${year}`;
};

const formatTime = (value) => {
  if (!value) {
    return '00:00:00';
  }

  if (typeof value === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return value.length === 5 ? `${value}:00` : value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '00:00:00';
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

const buildDetailRows = (details) => {
  if (!details.length) {
    return [
      [
        'Tidak ada data produk',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
      ],
    ];
  }

  return details.map((detail, index) => {
    const productName =
      detail?.nama_barang ||
      detail?.item_name ||
      detail?.item?.item_name ||
      detail?.item?.name ||
      '-';

    const productCode =
      detail?.plu ||
      detail?.kode_barang ||
      detail?.kodeBarang ||
      detail?.item_code ||
      detail?.item?.plu ||
      '-';

    const minRecParts = [];
    if (detail?.min_rec) {
      minRecParts.push(detail.min_rec);
    }
    if (detail?.min_rec_qty) {
      minRecParts.push(detail.min_rec_qty);
    } else if (detail?.qty_per_carton !== undefined && detail?.qty_per_carton !== null) {
      minRecParts.push(`Qty/Crt: ${formatNumberOrDash(detail.qty_per_carton)}`);
    }
    if (!minRecParts.length) {
      minRecParts.push('-');
    }

    const cartonValue =
      detail?.jumlah_carton ??
      detail?.carton ??
      detail?.qty_carton ??
      detail?.quantity_carton ??
      null;

    const totalQuantityOrder = toFiniteNumber(detail?.total_quantity_order) ?? 0;
    const totalPembelian =
      toFiniteNumber(detail?.total_pembelian) ??
      (toFiniteNumber(detail?.harga_netto) ?? 0) * totalQuantityOrder;

    return [
      `#${index + 1} ${productName}\n${productCode}`,
      formatNumberOrDash(cartonValue),
      minRecParts.join('\n'),
      `${productCode}\n${formatNumberOrDash(detail?.harga)}`,
      `${formatNumberOrDash(cartonValue)}\n${formatPercentageOrDash(detail?.potongan_a)}`,
      formatNumberOrDash(detail?.harga_netto),
      formatNumberOrDash(detail?.lst),
      formatNumberOrZero(totalPembelian),
      detail?.plu_b || detail?.pluB || detail?.plu_bonus || '-',
      formatNumberOrDash(detail?.qty_b),
      formatNumberOrDash(detail?.cost_b),
      formatPercentageOrDash(detail?.potongan_b),
      formatRatio(detail?.rasio || detail?.ratio),
    ];
  });
};

const buildTotalsRows = (totals) => [
  ['TOTAL PURCHASE PRICE', formatNumberOrZero(totals.totalPurchase)],
  ['TOTAL ITEM DISCOUNT', formatNumberOrZero(totals.totalItemDiscount)],
  ['TOTAL INVOICE DISCOUNT (-)', formatNumberOrZero(totals.invoiceDiscount)],
  ['TOTAL AFTER DISCOUNT', formatNumberOrZero(totals.totalAfterDiscount)],
  ['TOTAL BONUS', formatNumberOrZero(totals.totalBonus)],
  ['TOTAL LST', formatNumberOrZero(totals.totalLST)],
  ['TOTAL VAT INPUT (+)', formatNumberOrZero(totals.vatAmount)],
  ['TOTAL INCLUDE VAT', formatNumberOrZero(totals.totalIncludeVat)],
  ['TOTAL INVOICE', formatNumberOrZero(totals.totalInvoice)],
];

const drawHeaderSection = (pdf, brandName, titleText, palletInfo) => {
  const margin = PDF_MARGINS.left;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const rightX = pageWidth - PDF_MARGINS.right;

  let currentY = margin;

  pdf.setFont('helvetica', PDF_FONT_STYLES.bold);
  pdf.setFontSize(18);
  pdf.text(brandName, margin, currentY);

  pdf.setFontSize(22);
  pdf.text(titleText, margin, currentY + 10);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', PDF_FONT_STYLES.normal);
  pdf.text(`Palet : ${palletInfo || '-'}`, rightX, currentY, { align: 'right' });

  currentY += 18;
  drawLine(pdf, margin, currentY, rightX, currentY, {
    color: PDF_COLORS.black,
    lineWidth: 0.4,
  });

  return currentY + 4;
};

const drawSupplierSection = (pdf, supplierInfo, deliveryInfo, startY) => {
  const leftX = PDF_MARGINS.left;
  const rightX = pdf.internal.pageSize.getWidth() - PDF_MARGINS.right;
  const midX = leftX + (rightX - leftX) * 0.58;

  let currentY = startY + 4;

  pdf.setFont('helvetica', PDF_FONT_STYLES.bold);
  pdf.setFontSize(PDF_FONT_SIZES.sectionHeader);
  pdf.text('Supplier Information', leftX, currentY);
  pdf.text('Order & Delivery Info', midX, currentY);

  currentY += 4;

  pdf.setFont('helvetica', PDF_FONT_STYLES.normal);
  pdf.setFontSize(PDF_FONT_SIZES.small);

  const drawKeyValue = (entries, x, initialY) => {
    let y = initialY;
    entries.forEach(({ label, value }) => {
      pdf.text(`${label} :`, x, y);
      pdf.text(String(value || '-'), x + 32, y);
      y += 5;
    });
    return y;
  };

  const leftEndY = drawKeyValue(supplierInfo, leftX, currentY);
  const rightEndY = drawKeyValue(deliveryInfo, midX, currentY);

  return Math.max(leftEndY, rightEndY) + 2;
};

const drawInstructionSection = (pdf, order, startY) => {
  const margin = PDF_MARGINS.left;
  const width = pdf.internal.pageSize.getWidth() - PDF_MARGINS.left - PDF_MARGINS.right;

  const invoiceDiscText =
    `${formatPercentageOrDash(order?.invoice_disc_a || order?.invoiceDiscA)}  ` +
    `${formatPercentageOrDash(order?.invoice_disc_b || order?.invoiceDiscB)}`;

  pdf.setFontSize(PDF_FONT_SIZES.small);
  pdf.setFont('helvetica', PDF_FONT_STYLES.normal);

  const note =
    resolveField(order, ['additional_note', 'additionalNote', 'note', 'notes', 'catatan']) ||
    'Tidak ada catatan tambahan.';

  const bankHolder =
    resolveField(order?.supplier, ['account_name', 'accountName', 'bank_account_name']) ||
    resolveField(order, ['bank_account_name', 'bankAccountName']) ||
    '-';
  const bankAccount =
    resolveField(order?.supplier, ['bank_account_number', 'no_rekening', 'accountNumber']) ||
    resolveField(order, ['bank_account_number', 'bankAccountNumber']) ||
    '-';
  const bankName =
    resolveField(order?.supplier, ['bank_name', 'bankName', 'bank']) ||
    resolveField(order, ['bank_name', 'bankName']) ||
    '-';

  drawLine(pdf, margin, startY, margin + width, startY, {
    color: PDF_COLORS.lightGray,
    lineWidth: 0.3,
  });

  let currentY = startY + 6;

  pdf.setFont('helvetica', PDF_FONT_STYLES.bold);
  pdf.text('Invoice Discount :', margin, currentY);
  pdf.setFont('helvetica', PDF_FONT_STYLES.normal);
  pdf.text(invoiceDiscText, margin + 34, currentY);

  const boxX = margin + width * 0.55;
  pdf.rect(boxX, currentY - 5, width * 0.42, 18);
  drawMultilineText(
    pdf,
    [
      `# : ${note}`,
      `T/T ${bankName}   AC. ${bankAccount}   A/N ${bankHolder}`,
    ].join('\n'),
    boxX + 2,
    currentY - 2,
    width * 0.42 - 4,
    {
      fontSize: PDF_FONT_SIZES.small,
      lineSpacing: 1.3,
    },
  );

  return currentY + 14;
};

const drawTotalsSection = (pdf, order, totals, amountWords, startY) => {
  const margin = PDF_MARGINS.left;
  const contentWidth =
    pdf.internal.pageSize.getWidth() - PDF_MARGINS.left - PDF_MARGINS.right;

  const totalsWidth = contentWidth * 0.55;
  const totalsRows = buildTotalsRows(totals);

  const tableBottomY = drawTable(
    pdf,
    ['Description', 'Amount'],
    totalsRows,
    margin,
    startY + 4,
    {
      columnWidths: [totalsWidth * 0.65, totalsWidth * 0.35],
      alignments: ['left', 'right'],
      headerAlignments: ['left', 'right'],
      headerFontStyle: PDF_FONT_STYLES.bold,
    },
  );

  const footerX = margin + totalsWidth + 10;
  const footerY = tableBottomY + 6;

  pdf.setFont('helvetica', PDF_FONT_STYLES.normal);
  pdf.setFontSize(PDF_FONT_SIZES.small);
  pdf.text('( AUTO )', footerX, footerY);
  pdf.text('( B2B )', footerX + 40, footerY);

  const lineY = footerY + 6;
  drawLine(pdf, margin, lineY, margin + contentWidth, lineY, {
    color: PDF_COLORS.black,
    lineWidth: 0.4,
  });

  drawText(
    pdf,
    `By Letter : ${amountWords}`,
    margin,
    lineY + 6,
    {
      fontSize: PDF_FONT_SIZES.small,
      fontStyle: PDF_FONT_STYLES.italic,
    },
  );

  const secondLineY = lineY + 10;
  drawLine(pdf, margin, secondLineY, margin + contentWidth, secondLineY, {
    color: PDF_COLORS.black,
    lineWidth: 0.4,
  });

  const deliverCityRaw =
    resolveField(order, [
      'delivery_city',
      'deliveryCity',
      'destination_city',
      'destinationCity',
      'ship_to_city',
      'shipToCity',
    ]) ||
    resolveField(order?.customer, ['kotaCustomer', 'city']) ||
    'tujuan';
  const deliverCity = String(deliverCityRaw || 'tujuan').toUpperCase();

  const notes = [
    `1. If PO is expired do not deliver the goods, unless there is confirmation from supplier to ${deliverCity}.`,
    '2. At the time of delivery please include FPP.',
    '3. Goods delivery only for one FPP Number if there is FPP.',
  ];

  drawMultilineText(pdf, notes.join('\n'), margin, secondLineY + 5, contentWidth, {
    fontSize: PDF_FONT_SIZES.small,
    lineSpacing: 1.4,
  });
};

export const exportPurchaseOrderToPDF = async (order) => {
  if (!order) {
    throw new Error('Data purchase order tidak tersedia');
  }

  const details = getDetails(order);
  if (!details.length) {
    throw new Error('Detail purchase order tidak tersedia untuk diexport');
  }

  const totals = computeTotals(order);

  const companyInfo = resolveField(order, ['company', 'companyProfile']) || {};
  const brandName =
    resolveField(companyInfo, ['brandName', 'brand_name', 'company_name', 'name']) ||
    resolveField(order, ['brand_name', 'brandName', 'company_name', 'companyName']) ||
    'PT ABC';

  const poType = resolveField(order, ['po_type', 'poType']);
  const titleText = `PURCHASE ORDER FORM${poType ? ` / ${String(poType).toUpperCase()}` : ''}`;

  const palletInfo =
    resolveField(order, ['palet', 'pallet', 'pallet_info', 'palletInfo']) || '-';

  const supplier = order?.supplier || {};
  const supplierInfo = [
    { label: 'Supplier Name', value: supplier?.name || 'Not assigned' },
    { label: 'Address', value: supplier?.address || supplier?.alamat || '-' },
    {
      label: 'Phone Number',
      value: `${supplier?.phoneNumber || supplier?.phone || '-'}   Fax : ${supplier?.fax || '-'}`,
    },
    {
      label: 'Deliver To',
      value:
        resolveField(order, [
          'delivery_city',
          'deliveryCity',
          'destination_city',
          'destinationCity',
          'ship_to_city',
          'shipToCity',
        ]) ||
        resolveField(order?.customer, ['kotaCustomer', 'city']) ||
        '-',
    },
    {
      label: 'Deliver Address',
      value:
        resolveField(order, [
          'delivery_address',
          'deliveryAddress',
          'alamat_pengiriman',
          'alamatPengiriman',
          'ship_to_address',
          'shipToAddress',
        ]) ||
        resolveField(order?.customer, ['alamatPengiriman', 'alamat']) ||
        '-',
    },
  ];

  const deliveryInfo = [
    {
      label: 'Vehicle Number',
      value: resolveField(order, ['vehicle_number', 'vehicleNumber']) || '-',
    },
    {
      label: 'FPP Number',
      value:
        resolveField(order, ['fpp_number', 'fppNumber']) ||
        order?.po_number ||
        order?.no_purchase_order ||
        '-',
    },
    {
      label: 'Order Date',
      value:
        formatDateShort(
          resolveField(order, ['tanggal_masuk_po', 'order_date', 'orderDate']),
        ) || '-',
    },
    {
      label: 'Delivery Date',
      value:
        formatDateShort(
          resolveField(order, ['tanggal_batas_kirim', 'delivery_date', 'deliveryDate']),
        ) || '-',
    },
    {
      label: 'Hour Schedule',
      value: (() => {
        const scheduleHour =
          resolveField(order, ['hour_schedule', 'hourSchedule', 'delivery_schedule']) || '';
        const scheduleDoor =
          resolveField(order, ['delivery_door', 'door', 'door_number']) || '';
        if (scheduleHour && scheduleDoor) {
          return `${scheduleHour}, Door : ${scheduleDoor}`;
        }
        if (scheduleHour) return scheduleHour;
        if (scheduleDoor) return `Door : ${scheduleDoor}`;
        return '-';
      })(),
    },
    {
      label: 'Process',
      value: `${formatDateShort(
        resolveField(order, ['processed_at', 'processedAt']) || order?.createdAt,
      )}  Jam ${formatTime(
        resolveField(order, ['processed_at', 'processedAt', 'processed_time', 'processedTime']) ||
          order?.createdAt,
      )}`,
    },
  ];

  const amountWords = formatAmountInWordsSentence(totals.totalInvoice);

  const detailRows = buildDetailRows(details);

  const pdf = createPDFDocument();
  const originalPageSize = { width: PDF_PAGE.width, height: PDF_PAGE.height };
  PDF_PAGE.width = pdf.internal.pageSize.getWidth();
  PDF_PAGE.height = pdf.internal.pageSize.getHeight();

  try {
    let currentY = drawHeaderSection(pdf, brandName, titleText, palletInfo);

    currentY = drawSupplierSection(pdf, supplierInfo, deliveryInfo, currentY);

    currentY = drawInstructionSection(pdf, order, currentY);

    currentY = checkAndAddPage(pdf, currentY + 6, 80);

    const tableStartY = currentY + 4;
    const contentWidth =
      pdf.internal.pageSize.getWidth() - PDF_MARGINS.left - PDF_MARGINS.right;
    const baseWeights = [36, 10, 14, 16, 16, 14, 10, 14, 12, 10, 12, 10, 8];
    const totalWeight = baseWeights.reduce((acc, weight) => acc + weight, 0);
    const columnWidths = baseWeights.map(
      (weight) => (weight / totalWeight) * contentWidth,
    );

    drawTable(
      pdf,
      [
        '# PRODUCT NAME',
        'Q_Crt',
        'MIN_REC / Q_PCS',
        'PLU / PRICE',
        'CONT(C)/POT A',
        'KET NETT',
        'LST',
        'TOTAL',
        'PLUB',
        'QTYB',
        'COSTB',
        'POT B',
        'RASIO',
      ],
      detailRows,
      PDF_MARGINS.left,
      tableStartY,
      {
        columnWidths,
        alignments: [
          'left',
          'center',
          'center',
          'center',
          'center',
          'center',
          'center',
          'center',
          'center',
          'center',
          'center',
          'center',
          'center',
        ],
        headerAlignments: [
          'left',
          'center',
          'center',
          'center',
          'center',
          'center',
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
      },
    );

    const tableHeight = detailRows.length * 7 + 20;
    const totalsStartY = checkAndAddPage(pdf, tableStartY + tableHeight, 60);

    drawTotalsSection(pdf, order, totals, amountWords, totalsStartY);

    const fileNumber =
      order.po_number ||
      order.no_purchase_order ||
      order.noPurchaseOrder ||
      order.id ||
      'purchase_order';
    const fileName = generateFileName('PURCHASE_ORDER', fileNumber);

    pdf.save(fileName);
  } finally {
    PDF_PAGE.width = originalPageSize.width;
    PDF_PAGE.height = originalPageSize.height;
  }
};

export default exportPurchaseOrderToPDF;

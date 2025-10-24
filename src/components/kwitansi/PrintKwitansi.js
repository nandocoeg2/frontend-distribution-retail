import {
  createPDFDocument,
  drawBox,
  drawMultilineText,
  generateFileName,
} from '../../utils/pdfUtils';
import {
  PDF_COLORS,
  PDF_FONT_SIZES,
  PDF_FONT_STYLES,
  PDF_PAGE,
} from '../../utils/pdfConfig';
import {
  formatAmountInWords,
  formatCurrencyCompact,
} from '../../utils/numberWords';
import { toast } from 'react-toastify';
import { getActiveCompanyProfile } from '../../utils/companyUtils';

const formatFullDate = (value) => {
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

const resolveKwitansiNumber = (kwitansi) =>
  kwitansi?.no_kwitansi ||
  kwitansi?.noKwitansi ||
  kwitansi?.nomor_kwitansi ||
  '-';

const resolveInvoice = (kwitansi) =>
  kwitansi?.invoicePenagihan ||
  kwitansi?.invoice_penagihan ||
  kwitansi?.invoice;

const resolveInvoiceNumber = (invoice) =>
  invoice?.no_invoice ||
  invoice?.no_invoice_penagihan ||
  invoice?.nomor_invoice ||
  invoice?.noInvoice ||
  '-';

const resolveInvoiceDate = (invoice) =>
  invoice?.tanggal_invoice ||
  invoice?.tanggalInvoice ||
  invoice?.tanggal ||
  invoice?.date;

const resolveCustomerName = (kwitansi, invoice) => {
  const kwitansiRecipient = kwitansi?.kepada;
  const customerName =
    invoice?.customer?.nama_customer ||
    invoice?.customer?.name ||
    invoice?.customer_name;

  if (kwitansiRecipient && customerName) {
    if (kwitansiRecipient.trim().toLowerCase() === customerName.trim().toLowerCase()) {
      return kwitansiRecipient;
    }
    return `${customerName} (${kwitansiRecipient})`;
  }

  return kwitansiRecipient || customerName || '-';
};

const resolveInvoiceDescription = (invoiceNumber, invoiceDate) => {
  if (!invoiceNumber || invoiceNumber === '-') {
    return '-';
  }

  const datePart = invoiceDate ? ` (${formatFullDate(invoiceDate)})` : '';
  return `FAKTUR PENJUALAN INVOICE NO : ${invoiceNumber}${datePart}`;
};

const drawCompanyHeader = (pdf, x, y, companyProfile) => {
  pdf.setFillColor(255, 99, 71);
  pdf.circle(x + 6, y - 6, 6, 'F');

  pdf.setFont('helvetica', PDF_FONT_STYLES.bold);
  pdf.setFontSize(16);
  pdf.setTextColor(...PDF_COLORS.black);

  const brandName = companyProfile?.brandName || '';
  const brandSuffix = companyProfile?.brandSuffix || '';

  let textStartX = x + 18;

  if (brandName) {
    pdf.text(brandName, textStartX, y - 3);
    textStartX += pdf.getTextWidth(brandName) + (brandSuffix ? 3 : 0);
  }

  if (brandSuffix) {
    pdf.setTextColor(255, 99, 71);
    pdf.text(brandSuffix, textStartX, y - 3);
  }

  pdf.setTextColor(...PDF_COLORS.black);
  pdf.setFont('helvetica', PDF_FONT_STYLES.normal);
  pdf.setFontSize(PDF_FONT_SIZES.small + 1);

  let cursor = y + 2;
  const addressLines = Array.isArray(companyProfile?.addressLines)
    ? companyProfile.addressLines
    : [];

  addressLines.forEach((line) => {
    pdf.text(line, x, cursor);
    cursor += 4.5;
  });

  return cursor + 4;
};

const drawInfoRow = (pdf, label, value, positions) => {
  const { labelX, valueX, startY, valueWidth } = positions;

  pdf.setFont('helvetica', PDF_FONT_STYLES.bold);
  pdf.setFontSize(PDF_FONT_SIZES.sectionHeader);
  pdf.setTextColor(...PDF_COLORS.black);
  pdf.text(label, labelX, startY);
  pdf.text(':', labelX + 50, startY);

  const nextY = drawMultilineText(
    pdf,
    value || '-',
    valueX,
    startY,
    valueWidth,
    {
      fontSize: PDF_FONT_SIZES.sectionHeader,
      lineSpacing: 1.3,
      fontStyle: PDF_FONT_STYLES.normal,
    }
  );

  return Math.max(startY + 6, nextY + 2);
};

const drawAmountBox = (pdf, text, x, y, width) => {
  const height = 14;
  drawBox(pdf, x, y, width, height, {
    borderWidth: 1,
    borderColor: PDF_COLORS.black,
    fillColor: null,
  });

  pdf.setFont('helvetica', PDF_FONT_STYLES.bold);
  pdf.setFontSize(PDF_FONT_SIZES.sectionHeader);
  pdf.text(text, x + 5, y + 9);

  return y + height;
};

export const exportKwitansiToPDF = async (kwitansi) => {
  try {
    if (!kwitansi) {
      throw new Error('Data kwitansi tidak tersedia');
    }

    const invoice = resolveInvoice(kwitansi) || {};
    const grandTotal =
      kwitansi?.grand_total ??
      kwitansi?.grandTotal ??
      invoice?.total_price ??
      invoice?.totalPrice;

    const amountWords = formatAmountInWords(grandTotal);
    const amountCurrency = formatCurrencyCompact(grandTotal);
    const invoiceNumber = resolveInvoiceNumber(invoice);
    const invoiceDate = resolveInvoiceDate(invoice);
    const recipient = resolveCustomerName(kwitansi, invoice);
    const kwitansiNumber = resolveKwitansiNumber(kwitansi);
    const paymentDescription = resolveInvoiceDescription(invoiceNumber, invoiceDate);
    const companyProfile = getActiveCompanyProfile(
      kwitansi?.company,
      kwitansi?.companyProfile,
      invoice?.company,
      invoice?.companyProfile
    );

    const pdf = createPDFDocument();
    pdf.setLineHeightFactor(1.35);

    const margin = 15;
    const containerX = margin;
    const containerY = margin;
    const containerWidth = PDF_PAGE.width - margin * 2;
    const rightEdge = containerX + containerWidth;

    drawBox(pdf, containerX, containerY, containerWidth, PDF_PAGE.height - margin * 2, {
      borderWidth: 1.5,
      borderColor: PDF_COLORS.black,
    });

    const contentX = containerX + 12;
    let cursorY = containerY + 24;

    cursorY = drawCompanyHeader(pdf, contentX, cursorY, companyProfile);

    pdf.setFont('helvetica', PDF_FONT_STYLES.bold);
    pdf.setFontSize(20);
    pdf.setTextColor(...PDF_COLORS.black);
    pdf.text('KWITANSI', PDF_PAGE.width / 2, cursorY + 8, { align: 'center' });

    pdf.setFont('helvetica', PDF_FONT_STYLES.normal);
    pdf.setFontSize(PDF_FONT_SIZES.sectionHeader);
    pdf.text(`NO : ${kwitansiNumber}`, PDF_PAGE.width / 2, cursorY + 18, {
      align: 'center',
    });

    cursorY += 30;

    const infoPositions = {
      labelX: contentX,
      valueX: contentX + 60,
      startY: cursorY,
      valueWidth: rightEdge - (contentX + 60) - 12,
    };

    cursorY = drawInfoRow(pdf, 'SUDAH TERIMA DARI', recipient, infoPositions);
    infoPositions.startY = cursorY;
    cursorY = drawInfoRow(pdf, 'JUMLAH UANG', amountWords, infoPositions);
    infoPositions.startY = cursorY;
    cursorY = drawInfoRow(pdf, 'UNTUK PEMBAYARAN', paymentDescription, infoPositions);

    cursorY += 10;

    const documentDate = formatFullDate(kwitansi?.tanggal || kwitansi?.date);
    if (documentDate && documentDate !== '-') {
      const locationText = companyProfile?.city
        ? `${companyProfile.city}, ${documentDate}`
        : documentDate;
      pdf.text(locationText, rightEdge - 12, cursorY, { align: 'right' });
    }

    cursorY += 16;

    const amountTextWidth = pdf.getTextWidth(`JUMLAH : ${amountCurrency}`);
    const amountBoxWidth = Math.min(
      amountTextWidth + 12,
      containerWidth - 24
    );
    const amountBoxX = contentX;
    const amountBoxY = cursorY;

    cursorY = drawAmountBox(
      pdf,
      `JUMLAH : ${amountCurrency}`,
      amountBoxX,
      amountBoxY,
      amountBoxWidth
    ) + 12;

    const bankInfoLines = Array.isArray(companyProfile?.bankInfoLines)
      ? companyProfile.bankInfoLines.filter((line) => typeof line === 'string' && line.trim())
      : [];

    if (bankInfoLines.length > 0) {
      cursorY = drawMultilineText(
        pdf,
        bankInfoLines.join('\n'),
        contentX,
        cursorY,
        containerWidth - 24,
        {
          fontSize: PDF_FONT_SIZES.body,
          lineSpacing: 1.4,
        }
      ) + 12;
    }

    const signatureCenterX = rightEdge - 55;
    const signatureStartY = cursorY + 6;

    pdf.setFont('helvetica', PDF_FONT_STYLES.normal);
    pdf.setFontSize(PDF_FONT_SIZES.body);
    pdf.text('Hormat Kami,', signatureCenterX, signatureStartY, {
      align: 'center',
    });

    pdf.line(
      signatureCenterX - 25,
      signatureStartY + 35,
      signatureCenterX + 25,
      signatureStartY + 35
    );

    pdf.setFont('helvetica', PDF_FONT_STYLES.bold);
    const signerLabel = companyProfile?.signerName
      ? `(${companyProfile.signerName})`
      : '';
    pdf.text(signerLabel, signatureCenterX, signatureStartY + 42, {
      align: 'center',
    });

    pdf.setFont('helvetica', PDF_FONT_STYLES.normal);
    pdf.text(companyProfile?.companyName || '', signatureCenterX, signatureStartY + 50, {
      align: 'center',
    });

    const filename = generateFileName('KWITANSI', kwitansiNumber);
    pdf.save(filename);

    toast.success('Kwitansi berhasil di-export ke PDF', {
      position: 'top-right',
      autoClose: 3000,
    });
  } catch (error) {
    console.error('Error exporting kwitansi:', error);
    toast.error(`Gagal export kwitansi: ${error.message}`, {
      position: 'top-right',
      autoClose: 5000,
    });
  }
};

export default exportKwitansiToPDF;

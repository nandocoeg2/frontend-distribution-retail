import jsPDF from 'jspdf';
import {
  DOCUMENT_CONFIGS,
  PDF_COLORS,
  PDF_DEFAULTS,
  PDF_FONT_SIZES,
  PDF_FONT_STYLES,
  PDF_MARGINS,
  PDF_PAGE,
  TABLE_CONFIG,
} from './pdfConfig';

const DEFAULT_FONT = 'helvetica';
const DEFAULT_LINE_SPACING = 1.2;

const toSafeText = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.join(' ');
  }
  return String(value);
};

export const createPDFDocument = (options = {}) => {
  const config = { ...PDF_DEFAULTS, ...options };
  return new jsPDF(config);
};

export const drawText = (pdf, text, x, y, options = {}) => {
  const {
    fontSize = PDF_FONT_SIZES.body,
    fontStyle = PDF_FONT_STYLES.normal,
    color = PDF_COLORS.black,
    align = 'left',
    maxWidth = null,
  } = options;

  const content = toSafeText(text);
  pdf.setFont(DEFAULT_FONT, fontStyle);
  pdf.setFontSize(fontSize);
  pdf.setTextColor(...color);

  if (maxWidth) {
    const lines = pdf.splitTextToSize(content, maxWidth);
    pdf.text(lines, x, y, { align });
    const lineHeight = fontSize * 0.35 * DEFAULT_LINE_SPACING;
    return y + lines.length * lineHeight;
  }

  pdf.text(content, x, y, { align });
  return y + fontSize * 0.35;
};

export const drawMultilineText = (
  pdf,
  text,
  x,
  y,
  maxWidth,
  options = {}
) => {
  const {
    fontSize = PDF_FONT_SIZES.body,
    fontStyle = PDF_FONT_STYLES.normal,
    color = PDF_COLORS.black,
    lineSpacing = DEFAULT_LINE_SPACING,
    align = 'left',
  } = options;

  const content = toSafeText(text);
  pdf.setFont(DEFAULT_FONT, fontStyle);
  pdf.setFontSize(fontSize);
  pdf.setTextColor(...color);

  const lines = pdf.splitTextToSize(content, maxWidth);
  const lineHeight = fontSize * 0.35 * lineSpacing;

  let currentY = y;
  lines.forEach((line) => {
    pdf.text(line, x, currentY, { align });
    currentY += lineHeight;
  });

  return currentY;
};

export const drawBox = (pdf, x, y, width, height, options = {}) => {
  const {
    fillColor = null,
    borderColor = PDF_COLORS.black,
    borderWidth = 0.5,
    cornerRadius = 0,
  } = options;

  if (fillColor) {
    pdf.setFillColor(...fillColor);
    if (cornerRadius) {
      pdf.roundedRect(x, y, width, height, cornerRadius, cornerRadius, 'F');
    } else {
      pdf.rect(x, y, width, height, 'F');
    }
  }

  if (borderColor) {
    pdf.setDrawColor(...borderColor);
    pdf.setLineWidth(borderWidth);
    if (cornerRadius) {
      pdf.roundedRect(x, y, width, height, cornerRadius, cornerRadius, 'S');
    } else {
      pdf.rect(x, y, width, height, 'S');
    }
  }
};

export const drawLine = (pdf, x1, y1, x2, y2, options = {}) => {
  const { color = PDF_COLORS.black, lineWidth = 0.5 } = options;
  pdf.setDrawColor(...color);
  pdf.setLineWidth(lineWidth);
  pdf.line(x1, y1, x2, y2);
};

const resolveColumnWidths = (headers, explicitWidths = []) => {
  if (explicitWidths.length) {
    return explicitWidths;
  }
  const defaultWidth = PDF_PAGE.contentWidth / headers.length;
  return headers.map(() => defaultWidth);
};

const resolveAlignment = (alignments, index, fallback = 'left') => {
  if (Array.isArray(alignments) && alignments[index]) {
    return alignments[index];
  }
  return fallback;
};

export const drawTable = (
  pdf,
  headers,
  rows,
  startX,
  startY,
  options = {}
) => {
  const {
    columnWidths = [],
    fontSize = PDF_FONT_SIZES.tableBody,
    headerFontSize = PDF_FONT_SIZES.tableHeader,
    headerFontStyle = PDF_FONT_STYLES.bold,
    rowFontStyle = PDF_FONT_STYLES.normal,
    rowHeight = TABLE_CONFIG.rowHeight,
    headerHeight = TABLE_CONFIG.headerHeight,
    columnPadding = TABLE_CONFIG.columnPadding,
    borderColor = TABLE_CONFIG.lineColor,
    headerBgColor = TABLE_CONFIG.headerBgColor,
    alternateRowBg = TABLE_CONFIG.alternateRowBgColor,
    alignments = [],
    headerAlignments = [],
  } = options;

  const colWidths = resolveColumnWidths(headers, columnWidths);
  const totalWidth = colWidths.reduce((acc, width) => acc + width, 0);
  const baseLineHeight = fontSize * 0.35 * DEFAULT_LINE_SPACING;

  let currentY = startY;
  const pageLimit = PDF_PAGE.height - PDF_MARGINS.bottom;

  const drawHeader = () => {
    pdf.setDrawColor(...borderColor);
    pdf.setLineWidth(0.3);
    pdf.setFillColor(...headerBgColor);
    pdf.rect(startX, currentY, totalWidth, headerHeight, 'F');

    pdf.setFont(DEFAULT_FONT, headerFontStyle);
    pdf.setFontSize(headerFontSize);
    pdf.setTextColor(...PDF_COLORS.black);

    let headerCellX = startX;
    headers.forEach((header, index) => {
      const text = toSafeText(header);
      const align = resolveAlignment(headerAlignments, index, 'left');
      const textX =
        align === 'center'
          ? headerCellX + colWidths[index] / 2
          : align === 'right'
            ? headerCellX + colWidths[index] - columnPadding
            : headerCellX + columnPadding;

      pdf.text(
        text,
        textX,
        currentY + headerHeight / 2 + headerFontSize * 0.12,
        { align }
      );
      pdf.rect(headerCellX, currentY, colWidths[index], headerHeight);
      headerCellX += colWidths[index];
    });

    currentY += headerHeight;
  };

  drawHeader();

  // Rows
  pdf.setFont(DEFAULT_FONT, rowFontStyle);
  pdf.setFontSize(fontSize);

  const columnCount = headers.length;

  rows.forEach((row, rowIndex) => {
    let cellX = startX;
    const cells = Array.isArray(row) ? row : [];

    const processedCells = [];
    for (let i = 0; i < columnCount; i += 1) {
      const colWidth = colWidths[i];
      const usableWidth = Math.max(colWidth - columnPadding * 2, 1);
      const content = toSafeText(cells[i] ?? '');
      const lines = pdf.splitTextToSize(content, usableWidth);
      const lineCount = lines.length || 1;
      const height = Math.max(
        rowHeight,
        lineCount * baseLineHeight + columnPadding
      );
      const align = resolveAlignment(alignments, i, 'left');
      processedCells.push({ lines, height, align, colWidth });
    }

    const rowBlockHeight =
      processedCells.length > 0
        ? Math.max(...processedCells.map((cell) => cell.height))
        : rowHeight;

    if (currentY + rowBlockHeight > pageLimit) {
      pdf.addPage();
      currentY = PDF_MARGINS.top;
      drawHeader();
      pdf.setFont(DEFAULT_FONT, rowFontStyle);
      pdf.setFontSize(fontSize);
      cellX = startX;
    }

    // Alternate row shading
    if (alternateRowBg && rowIndex % 2 === 1) {
      pdf.setFillColor(...alternateRowBg);
      pdf.rect(cellX, currentY, totalWidth, rowBlockHeight, 'F');
    }

    processedCells.forEach((cell) => {
      const { colWidth } = cell;
      let textX;
      if (cell.align === 'center') {
        textX = cellX + cell.colWidth / 2;
      } else if (cell.align === 'right') {
        textX = cellX + cell.colWidth - columnPadding;
      } else {
        textX = cellX + columnPadding;
      }

      let textY = currentY + columnPadding + fontSize * 0.35;
      cell.lines.forEach((line) => {
        pdf.text(line, textX, textY, {
          align: cell.align,
        });
        textY += baseLineHeight;
      });

      pdf.rect(cellX, currentY, cell.colWidth, rowBlockHeight);
      cellX += cell.colWidth;
    });

    if (!processedCells.length) {
      pdf.rect(startX, currentY, totalWidth, rowBlockHeight);
    }

    currentY += rowBlockHeight;
  });

  return currentY;
};

export const checkAndAddPage = (pdf, currentY, requiredHeight = 30) => {
  const pageLimit = PDF_PAGE.height - PDF_MARGINS.bottom;
  if (currentY + requiredHeight > pageLimit) {
    pdf.addPage();
    return PDF_MARGINS.top;
  }
  return currentY;
};

export const generateFileName = (docType, docNumber) => {
  const config = DOCUMENT_CONFIGS[docType];
  const base = config?.filename || 'Document';
  const number = toSafeText(docNumber)
    .replace(/[^A-Za-z0-9_\-]/g, '_')
    .substring(0, 80);

  const filename = number ? `${base}_${number}` : base;
  return `${filename}.pdf`;
};

export const drawDocumentHeader = (pdf, headerConfig = {}) => {
  const {
    title = 'DOCUMENT',
    docNumber = '',
    docDate = '',
    metadata = [],
    showDivider = true,
  } = headerConfig;

  let yPosition = PDF_MARGINS.top;

  yPosition = drawText(pdf, title, PDF_MARGINS.left, yPosition, {
    fontSize: PDF_FONT_SIZES.title,
    fontStyle: PDF_FONT_STYLES.bold,
  });

  if (docNumber || docDate || metadata.length) {
    const lines = [];
    if (docNumber) {
      lines.push(`No: ${docNumber}`);
    }
    if (docDate) {
      lines.push(`Tanggal: ${docDate}`);
    }
    if (metadata.length) {
      lines.push(...metadata);
    }

    yPosition = drawMultilineText(
      pdf,
      lines.join('\n'),
      PDF_MARGINS.left,
      yPosition,
      PDF_PAGE.contentWidth,
      { fontSize: PDF_FONT_SIZES.small }
    );
  }

  if (showDivider) {
    drawLine(
      pdf,
      PDF_MARGINS.left,
      yPosition + 1,
      PDF_PAGE.width - PDF_MARGINS.right,
      yPosition + 1,
      { color: PDF_COLORS.lightGray, lineWidth: 0.4 }
    );
    yPosition += 5;
  }

  return yPosition;
};

export const drawSignatureArea = (
  pdf,
  startY,
  signatureLabels = ['Signature'],
  options = {}
) => {
  const {
    signatureHeight = 20,
    spacing = 50,
    columns = 3,
    lineWidth = 0.5,
  } = options;

  const perRow = Math.max(columns, 1);
  const availableWidth = PDF_PAGE.contentWidth;
  const columnWidth = availableWidth / perRow;

  let yPosition = startY + 15;

  signatureLabels.forEach((label, index) => {
    const row = Math.floor(index / perRow);
    const col = index % perRow;

    const x = PDF_MARGINS.left + col * columnWidth;
    const y = yPosition + row * spacing;

    drawLine(pdf, x, y, x + columnWidth - 10, y, {
      color: PDF_COLORS.darkGray,
      lineWidth,
    });

    drawText(pdf, label, x, y + 4, {
      fontSize: PDF_FONT_SIZES.small,
    });
  });

  const totalRows = Math.ceil(signatureLabels.length / perRow);
  return yPosition + totalRows * spacing + signatureHeight;
};

export const markYPosition = (pdf, y) => {
  drawLine(
    pdf,
    PDF_MARGINS.left,
    y,
    PDF_PAGE.width - PDF_MARGINS.right,
    y,
    { color: [255, 0, 0], lineWidth: 0.2 }
  );

  drawText(
    pdf,
    `Y: ${y.toFixed(2)}mm`,
    PDF_MARGINS.left + 2,
    y - 1,
    { fontSize: 7 }
  );
};

export default {
  createPDFDocument,
  drawText,
  drawMultilineText,
  drawBox,
  drawLine,
  drawTable,
  checkAndAddPage,
  generateFileName,
  drawDocumentHeader,
  drawSignatureArea,
  markYPosition,
};

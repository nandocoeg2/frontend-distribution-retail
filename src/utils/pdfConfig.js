// Shared PDF configuration constants
export const PDF_DEFAULTS = {
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  compress: true,
};

export const PDF_MARGINS = {
  top: 20,
  bottom: 20,
  left: 20,
  right: 20,
};

export const PDF_FONT_SIZES = {
  title: 16,
  sectionHeader: 12,
  body: 10,
  tableHeader: 9,
  tableBody: 9,
  small: 8,
};

export const PDF_FONT_STYLES = {
  normal: 'normal',
  bold: 'bold',
  italic: 'italic',
  boldItalic: 'bolditalic',
};

export const PDF_COLORS = {
  black: [0, 0, 0],
  darkGray: [64, 64, 64],
  mediumGray: [128, 128, 128],
  lightGray: [200, 200, 200],
  white: [255, 255, 255],
  blue: [0, 102, 204],
  red: [204, 0, 0],
};

export const PDF_PAGE = {
  width: 210,
  height: 297,
  get contentWidth() {
    return this.width - (PDF_MARGINS.left + PDF_MARGINS.right);
  },
  get contentHeight() {
    return this.height - (PDF_MARGINS.top + PDF_MARGINS.bottom);
  },
};

export const TABLE_CONFIG = {
  rowHeight: 6,
  headerHeight: 7,
  columnPadding: 2,
  lineColor: [200, 200, 200],
  headerBgColor: [240, 240, 240],
  alternateRowBgColor: [250, 250, 250],
};

export const DOCUMENT_CONFIGS = {
  SURAT_JALAN: {
    title: 'SURAT JALAN',
    filename: 'Surat_Jalan',
    multiPage: true,
  },
  INVOICE_PENGIRIMAN: {
    title: 'INVOICE PENGIRIMAN',
    filename: 'Invoice_Pengiriman',
    multiPage: false,
  },
  CHECKING_LIST: {
    title: 'CHECKING LIST SURAT JALAN',
    filename: 'Checking_List',
    multiPage: true,
  },
  PACKING_STICKER: {
    title: 'PACKING STICKER',
    filename: 'Packing_Sticker',
    multiPage: false,
  },
};

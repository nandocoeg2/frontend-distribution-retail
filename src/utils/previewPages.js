/**
 * Menampilkan dokumen cetak sebagai lembar A4 terpisah untuk preview dan Download.
 * Semua gaya hanya berlaku di layar, jadi hasil Print tidak berubah.
 */

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
// Selisih pembulatan piksel tidak boleh menghasilkan halaman kosong tambahan
const HEIGHT_TOLERANCE_MM = 2;

const BREAK_CLASSES = ['page-break', 'paket-break'];
const SHEET_CLASS = 'preview-sheet';

const isBreak = (node) =>
  node.nodeType === 1 && BREAK_CLASSES.some((name) => node.classList.contains(name));

const isVisibleContent = (node) => {
  if (node.nodeType === 1) return !['STYLE', 'SCRIPT'].includes(node.tagName);
  return node.nodeType === 3 && node.textContent.trim() !== '';
};

/**
 * Membungkus isi body di antara penanda batas halaman menjadi satu lembar per halaman.
 * @param {Document} doc dokumen preview
 * @returns {HTMLElement[]} daftar lembar sesuai urutan halaman
 */
export function splitIntoSheets(doc) {
  const { body } = doc;

  // Dibaca sebelum gaya lembar dipasang: Print memakai padding body sebagai margin kertas
  const bodyStyle = doc.defaultView?.getComputedStyle(body);
  const paddingTop = bodyStyle?.paddingTop || '0px';
  const paddingRight = bodyStyle?.paddingRight || '0px';
  const paddingLeft = bodyStyle?.paddingLeft || '0px';

  const groups = [[]];
  Array.from(body.childNodes).forEach((node) => {
    if (isBreak(node)) {
      groups.push([]);
    } else {
      groups[groups.length - 1].push(node);
    }
  });

  const sheets = groups
    .filter((nodes) => nodes.some(isVisibleContent))
    .map((nodes) => {
      const sheet = doc.createElement('div');
      sheet.className = SHEET_CLASS;
      body.insertBefore(sheet, nodes[0]);
      nodes.forEach((node) => sheet.appendChild(node));
      return sheet;
    });

  sheets[0]?.classList.add(`${SHEET_CLASS}--first`);

  const style = doc.createElement('style');
  style.textContent = `
    @media screen {
      html, body { background: #d1d5db !important; }
      body { padding: 0 !important; }
      .page-break, .paket-break { display: none !important; }
      .${SHEET_CLASS} {
        display: flow-root;
        box-sizing: border-box;
        width: ${A4_WIDTH_MM}mm;
        min-height: ${A4_HEIGHT_MM}mm;
        margin: 0 auto 24px auto;
        padding: 0 ${paddingRight} 0 ${paddingLeft};
        background: #ffffff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      .${SHEET_CLASS}--first { padding-top: ${paddingTop}; }
    }
  `;
  doc.head.appendChild(style);

  return sheets;
}

/**
 * Menulis setiap lembar ke halaman PDF tersendiri. Lembar yang isinya lebih
 * tinggi dari A4 dilanjutkan ke halaman berikutnya.
 */
export async function addSheetsToPdf(pdf, sheets, html2canvas) {
  let isFirstPage = true;

  for (const [index, sheet] of sheets.entries()) {
    const canvas = await html2canvas(sheet, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      // Lembar lain tidak ikut disalin agar dokumen bulk tidak lambat
      ignoreElements: (element) =>
        element !== sheet && Boolean(element.classList?.contains(SHEET_CLASS)),
    });

    const imageData = canvas.toDataURL('image/jpeg', 0.92);
    const imageHeight = (canvas.height * A4_WIDTH_MM) / canvas.width;
    const pageCount = Math.max(
      1,
      Math.ceil((imageHeight - HEIGHT_TOLERANCE_MM) / A4_HEIGHT_MM)
    );

    for (let page = 0; page < pageCount; page++) {
      if (!isFirstPage) pdf.addPage();
      isFirstPage = false;

      pdf.addImage(
        imageData,
        'JPEG',
        0,
        -page * A4_HEIGHT_MM,
        A4_WIDTH_MM,
        imageHeight,
        `sheet-${index}`
      );
    }
  }
}

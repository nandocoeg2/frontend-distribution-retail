import { describe, it, expect, vi } from 'vitest';
import { splitIntoSheets, addSheetsToPdf } from '../../utils/previewPages';

const createDocument = (body) => {
  const doc = document.implementation.createHTMLDocument('preview');
  doc.body.innerHTML = body;
  return doc;
};

describe('splitIntoSheets', () => {
  it('puts every part between page breaks on its own sheet, in order', () => {
    const doc = createDocument(`
      <div id="ttf">TTF</div>
      <div class="page-break"></div>
      <div id="kwitansi">Kwitansi</div>
      <div class="page-break"></div>
      <div id="lpb">LPB</div>
      <div class="paket-break"></div>
      <div id="next">Paket berikutnya</div>
    `);

    const sheets = splitIntoSheets(doc);

    expect(sheets.map((sheet) => sheet.firstElementChild.id)).toEqual([
      'ttf',
      'kwitansi',
      'lpb',
      'next',
    ]);
    // Penanda tetap di antara lembar supaya Print memotong halaman seperti semula
    expect(Array.from(doc.body.children).map((el) => el.className.split(' ')[0])).toEqual([
      'preview-sheet',
      'page-break',
      'preview-sheet',
      'page-break',
      'preview-sheet',
      'paket-break',
      'preview-sheet',
    ]);
  });

  it('does not create empty sheets', () => {
    const doc = createDocument(`
      <div class="page-break"></div>
      <div>A</div>
      <div class="page-break"></div>
      <style></style>
      <div class="paket-break"></div>
    `);

    expect(splitIntoSheets(doc)).toHaveLength(1);
  });

  it('applies the sheet styling to the screen only', () => {
    const doc = createDocument('<div>A</div>');

    splitIntoSheets(doc);

    expect(doc.head.querySelector('style').textContent.trim().startsWith('@media screen')).toBe(true);
  });
});

describe('addSheetsToPdf', () => {
  const createPdf = () => ({ addPage: vi.fn(), addImage: vi.fn() });
  // Lebar 210 membuat tinggi kanvas sama dengan tinggi gambar dalam mm
  const canvas = (height) => ({ width: 210, height, toDataURL: () => 'data:image/jpeg;base64,AA' });
  const sheets = (count) => Array.from({ length: count }, () => document.createElement('div'));

  it('writes one PDF page per sheet', async () => {
    const pdf = createPdf();
    const render = vi.fn().mockResolvedValue(canvas(297));

    await addSheetsToPdf(pdf, sheets(3), render);

    expect(pdf.addImage).toHaveBeenCalledTimes(3);
    expect(pdf.addPage).toHaveBeenCalledTimes(2);
  });

  it('ignores a rounding overflow but continues a tall sheet onto new pages', async () => {
    const pdf = createPdf();
    const render = vi
      .fn()
      .mockResolvedValueOnce(canvas(298))
      .mockResolvedValueOnce(canvas(400));

    await addSheetsToPdf(pdf, sheets(2), render);

    expect(pdf.addImage.mock.calls.map((call) => call[3] + 0)).toEqual([0, 0, -297]);
    expect(pdf.addPage).toHaveBeenCalledTimes(2);
  });
});

// Feature: stock-movement-export-excel, Property 4: Content-Disposition filename extraction
// **Validates: Requirements 4.2**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Extracted pure function matching the regex logic used in stockMovementService.exportExcel:
 *   const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
 */
function extractFilename(contentDisposition) {
  if (!contentDisposition) return null;
  const match = contentDisposition.match(/filename="?([^"]+)"?/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Arbitrary: generates valid filenames with alphanumeric chars, underscores, and .xlsx extension
 */
const filenameArb = fc
  .stringMatching(/^[a-zA-Z0-9_]{1,40}$/)
  .map((base) => `${base}.xlsx`);

describe('Property 4: Content-Disposition filename extraction', () => {
  it('should extract filename from quoted Content-Disposition header', () => {
    fc.assert(
      fc.property(filenameArb, (filename) => {
        const header = `attachment; filename="${filename}"`;
        const result = extractFilename(header);
        expect(result).toBe(filename);
      }),
      { numRuns: 100 }
    );
  });

  it('should extract filename from unquoted Content-Disposition header', () => {
    fc.assert(
      fc.property(filenameArb, (filename) => {
        const header = `attachment; filename=${filename}`;
        const result = extractFilename(header);
        expect(result).toBe(filename);
      }),
      { numRuns: 100 }
    );
  });

  it('should return null for missing Content-Disposition', () => {
    expect(extractFilename(null)).toBeNull();
    expect(extractFilename(undefined)).toBeNull();
    expect(extractFilename('')).toBeNull();
  });

  it('should return null for malformed headers without filename parameter', () => {
    const malformedHeaders = [
      'attachment',
      'attachment; name="file.xlsx"',
      'inline',
      'some-random-string',
    ];
    for (const header of malformedHeaders) {
      expect(extractFilename(header)).toBeNull();
    }
  });

  it('should handle typical Item_Stock timestamp filenames', () => {
    fc.assert(
      fc.property(
        fc.date({
          min: new Date('2020-01-01'),
          max: new Date('2030-12-31'),
        }),
        (date) => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          const filename = `Item_Stock_${y}${m}${d}.xlsx`;

          // Test both quoted and unquoted variants
          const quoted = `attachment; filename="${filename}"`;
          const unquoted = `attachment; filename=${filename}`;

          expect(extractFilename(quoted)).toBe(filename);
          expect(extractFilename(unquoted)).toBe(filename);
        }
      ),
      { numRuns: 100 }
    );
  });
});

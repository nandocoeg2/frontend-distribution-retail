import React, { useState } from 'react';
import { parseBulkUploadReason } from '../../utils/errorUtils';

const BulkUploadErrorDisplay = ({ reason }) => {
  const [showAllErrors, setShowAllErrors] = useState(false);
  const parsed = parseBulkUploadReason(reason);

  if (!parsed) return null;

  if (parsed.type === 'zod_validation') {
    return (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
        <span className="text-sm font-semibold text-red-800">
          Gagal Validasi Data pada Baris {parsed.row}:
        </span>
        <ul className="mt-1.5 space-y-1 pl-4 list-disc text-sm text-red-700">
          {parsed.errors.map((err, idx) => (
            <li key={idx}>
              <span className="font-medium">{err.field}:</span> {err.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (parsed.type === 'row_error') {
    return (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
        <span className="text-sm font-semibold text-red-800">
          Gagal pada Baris {parsed.row}:
        </span>
        <p className="text-sm text-red-700 mt-1">{parsed.message}</p>
      </div>
    );
  }

  if (parsed.type === 'multiple_errors') {
    const displayErrors = parsed.errors.slice(0, 3);
    const hiddenCount = parsed.errors.length - displayErrors.length;

    return (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-red-800">
            Alasan Gagal ({parsed.total} error):
          </span>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAllErrors(!showAllErrors)}
              className="text-xs font-medium text-red-600 hover:text-red-800 underline focus:outline-none"
            >
              {showAllErrors ? 'Sembunyikan' : `Lihat semua`}
            </button>
          )}
        </div>
        {!showAllErrors ? (
          <p className="text-sm text-red-700 mt-1">
            {displayErrors.join('; ')}
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllErrors(true)}
                className="ml-1 text-red-600 hover:text-red-800 underline font-medium focus:outline-none"
              >
                ...dan {hiddenCount} error lainnya
              </button>
            )}
          </p>
        ) : (
          <div className="mt-2 max-h-48 overflow-y-auto border border-red-200 rounded bg-white p-2">
            <ul className="space-y-1">
              {parsed.errors.map((error, index) => (
                <li key={index} className="text-sm text-red-700 flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Fallback to single_error
  return (
    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
      <span className="text-sm font-medium text-red-800">Alasan Gagal:</span>
      <p className="text-sm text-red-700 mt-1">{parsed.message}</p>
    </div>
  );
};

export default BulkUploadErrorDisplay;

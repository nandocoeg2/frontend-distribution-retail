import React, { useMemo } from 'react';

const defaultSummaryFormatter = ({ pagination, itemLabel }) => {
  const currentPage = pagination?.currentPage ?? 1;
  const totalItems = pagination?.totalItems ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const itemsPerPage = pagination?.itemsPerPage ?? 10;

  const displayedCount =
    currentPage >= totalPages ? totalItems : currentPage * itemsPerPage;

  return (
    <span className="text-sm text-gray-700">
      Menampilkan <span className="font-medium">{displayedCount}</span> dari{' '}
      <span className="font-medium">{totalItems}</span> {itemLabel}
    </span>
  );
};

const DataTablePagination = ({
  table,
  pagination,
  itemLabel = 'data',
  pageSizeOptions = [5, 10, 20, 50, 100],
  summaryFormatter = defaultSummaryFormatter,
  containerClassName = 'flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200',
  controlsWrapperClassName = 'flex items-center space-x-2',
  pageSizeLabel = 'Per halaman:',
  showPageSize = true,
  showGoTo = true,
  goToLabel = 'Ke halaman:',
  firstLabel = '<<',
  prevLabel = '<',
  nextLabel = '>',
  lastLabel = '>>',
  goToInputProps = {},
}) => {
  if (!table) {
    return null;
  }

  const paginationState = table.getState().pagination || { pageIndex: 0, pageSize: pageSizeOptions[0] };
  const pageIndex = paginationState.pageIndex ?? 0;
  const pageSize = paginationState.pageSize ?? pageSizeOptions[0];
  const pageCount = table.getPageCount() || 1;
  const canPrevious = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();

  const summaryNode = useMemo(
    () => summaryFormatter({ pagination, itemLabel, table, pageIndex, pageSize }),
    [summaryFormatter, pagination, itemLabel, table, pageIndex, pageSize]
  );

  return (
    <div className={containerClassName}>
      <div className="flex items-center space-x-2">{summaryNode}</div>

      <div className={controlsWrapperClassName}>
        {showPageSize && (
          <div className="flex items-center space-x-2">
            <label htmlFor="pageSizeSelector" className="text-sm text-gray-700">
              {pageSizeLabel}
            </label>
            <select
              id="pageSizeSelector"
              value={pageSize}
              onChange={(event) => table.setPageSize(Number(event.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => table.setPageIndex(0)}
            disabled={!canPrevious}
            className="px-2 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Halaman pertama"
          >
            {firstLabel}
          </button>
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!canPrevious}
            className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Halaman sebelumnya"
          >
            {prevLabel}
          </button>
          <span className="px-3 py-1 text-sm text-gray-700">
            Halaman <strong>{pageIndex + 1}</strong> dari {pageCount}
          </span>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!canNext}
            className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Halaman berikutnya"
          >
            {nextLabel}
          </button>
          <button
            type="button"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!canNext}
            className="px-2 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Halaman terakhir"
          >
            {lastLabel}
          </button>
        </div>

        {showGoTo && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">{goToLabel}</span>
            <input
              type="number"
              min="1"
              max={pageCount}
              defaultValue={pageIndex + 1}
              onBlur={(event) => {
                const value = event.target.value;
                if (!value) {
                  event.target.value = pageIndex + 1;
                  return;
                }

                const requestedPage = Number(value);
                if (Number.isNaN(requestedPage)) {
                  event.target.value = pageIndex + 1;
                  return;
                }

                if (requestedPage >= 1 && requestedPage <= pageCount) {
                  table.setPageIndex(requestedPage - 1);
                } else {
                  event.target.value = pageIndex + 1;
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.target.blur();
                }
              }}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              {...goToInputProps}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTablePagination;

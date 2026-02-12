import React, { useMemo } from 'react';

const defaultSummaryFormatter = ({ pagination, itemLabel }) => {
  const currentPage = pagination?.currentPage ?? 1;
  const totalItems = pagination?.totalItems ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const itemsPerPage = pagination?.itemsPerPage ?? 9999;
  const displayedCount = currentPage >= totalPages ? totalItems : currentPage * itemsPerPage;

  return (
    <span className="text-xs text-gray-600">
      <span className="font-medium">{displayedCount}</span>/<span className="font-medium">{totalItems}</span> {itemLabel}
    </span>
  );
};

const DataTablePagination = ({
  table,
  pagination,
  itemLabel = 'data',
  pageSizeOptions = [5, 10, 20, 50, 100],
  summaryFormatter = defaultSummaryFormatter,
  containerClassName = 'flex items-center justify-between px-2 py-1.5 bg-white border-t border-gray-200',
  controlsWrapperClassName = 'flex items-center gap-2',
  pageSizeLabel = '',
  showPageSize = true,
  showGoTo = true,
  goToLabel = '',
  firstLabel = '«',
  prevLabel = '‹',
  nextLabel = '›',
  lastLabel = '»',
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
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            title="Per halaman"
          >
            {pageSizeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        )}

        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => table.setPageIndex(0)} disabled={!canPrevious} className="px-1.5 py-0.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40" title="First">{firstLabel}</button>
          <button type="button" onClick={() => table.previousPage()} disabled={!canPrevious} className="px-1.5 py-0.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40" title="Prev">{prevLabel}</button>
          <span className="px-1.5 text-xs text-gray-600"><strong>{pageIndex + 1}</strong>/{pageCount}</span>
          <button type="button" onClick={() => table.nextPage()} disabled={!canNext} className="px-1.5 py-0.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40" title="Next">{nextLabel}</button>
          <button type="button" onClick={() => table.setPageIndex(pageCount - 1)} disabled={!canNext} className="px-1.5 py-0.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40" title="Last">{lastLabel}</button>
        </div>

        {showGoTo && (
          <input
            type="number"
            min="1"
            max={pageCount}
            defaultValue={pageIndex + 1}
            onBlur={(e) => {
              const val = Number(e.target.value);
              if (!val || Number.isNaN(val)) { e.target.value = pageIndex + 1; return; }
              if (val >= 1 && val <= pageCount) table.setPageIndex(val - 1);
              else e.target.value = pageIndex + 1;
            }}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            className="w-10 px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-center"
            title="Go to page"
            {...goToInputProps}
          />
        )}
      </div>
    </div>
  );
};

export default DataTablePagination;

import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

const defaultLoading = (message) => (
  <div className="flex items-center justify-center p-8 text-gray-500">
    <div className="w-8 h-8 mr-3 border-b-2 border-blue-600 rounded-full animate-spin"></div>
    <span>{message}</span>
  </div>
);

const defaultError = (message) => (
  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
    <p className="text-sm text-red-800">{message}</p>
  </div>
);

const resolveClassName = (value, context) => {
  if (typeof value === 'function') {
    return value(context);
  }

  return value || '';
};

const DataTable = ({
  table,
  isLoading = false,
  error = null,
  hasActiveFilters = false,
  loadingMessage = 'Memuat data...',
  errorMessage,
  emptyMessage = 'Tidak ada data.',
  emptyFilteredMessage,
  wrapperClassName = 'overflow-x-auto',
  tableClassName = 'min-w-full bg-white border border-gray-200',
  headerRowClassName = 'bg-gray-50',
  headerCellClassName = 'px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider',
  bodyClassName = 'bg-white divide-y divide-gray-200',
  rowClassName = 'hover:bg-gray-50',
  getRowClassName,
  cellClassName = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
  getCellClassName,
  emptyCellClassName = 'px-6 py-4 text-center text-gray-500',
  renderLoading = defaultLoading,
  renderError = defaultError,
}) => {
  if (!table) {
    return null;
  }

  if (isLoading) {
    return renderLoading(loadingMessage);
  }

  if (error) {
    const message = errorMessage || error?.message || 'Terjadi kesalahan.';
    return renderError(message);
  }

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  const columnCount = table.getVisibleLeafColumns().length || table.getAllLeafColumns().length || 1;

  const noDataMessage = hasActiveFilters && emptyFilteredMessage
    ? emptyFilteredMessage
    : emptyMessage;

  return (
    <div className={wrapperClassName}>
      <table className={tableClassName}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id} className={headerRowClassName}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const isSorted = header.column.getIsSorted();

                const content =
                  typeof header.column.columnDef.header === 'string'
                    ? header.column.columnDef.header
                    : flexRender(header.column.columnDef.header, header.getContext());

                return (
                  <th key={header.id} className={headerCellClassName}>
                    {header.isPlaceholder ? null : (
                      <div className="space-y-2">
                        {canSort ? (
                          <div
                            className="cursor-pointer select-none flex items-center space-x-1 hover:text-gray-700 font-medium"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span className="flex-1">{content}</span>
                            <span className="text-gray-400">
                              {isSorted === 'asc' ? (
                                <ArrowUpIcon className="h-4 w-4" />
                              ) : isSorted === 'desc' ? (
                                <ArrowDownIcon className="h-4 w-4" />
                              ) : (
                                <span className="opacity-50">⇅</span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <div className="font-medium">{content}</div>
                        )}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className={bodyClassName}>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className={emptyCellClassName}>
                {noDataMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const context = { row };
              const computedRowClass = [
                resolveClassName(rowClassName, context),
                resolveClassName(getRowClassName, context),
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <tr key={row.id} className={computedRowClass}>
                  {row.getVisibleCells().map((cell) => {
                    const cellContext = { row, cell };
                    const computedCellClass = [
                      resolveClassName(cellClassName, cellContext),
                      resolveClassName(getCellClassName, cellContext),
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <td key={cell.id} className={computedCellClass}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;

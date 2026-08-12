import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import useTableKeyboardNavigation from '../../hooks/useTableKeyboardNavigation';

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
  wrapperClassName = 'overflow-x-auto min-h-full',
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
  onRowClick,
  footerContent,
  footerRowClassName = 'bg-gray-50',
  footerCellClassName = 'px-2 py-1.5 text-xs',
  selectedRowId = null,
  idAttribute = 'id',
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

  useTableKeyboardNavigation({
    items: rows,
    selectedId: selectedRowId,
    onSelect: onRowClick,
    idAttribute,
  });

  const columnCount = table.getVisibleLeafColumns().length || table.getAllLeafColumns().length || 1;

  const noDataMessage = hasActiveFilters && emptyFilteredMessage
    ? emptyFilteredMessage
    : emptyMessage;

  const hasSizing = Object.keys(table.getState().columnSizing || {}).length > 0;

  return (
    <div className={`flex flex-col ${wrapperClassName}`}>
      <table
        className={`flex-grow min-h-full ${tableClassName}`}
        style={{
          width: hasSizing ? table.getTotalSize() : undefined,
          tableLayout: hasSizing ? 'fixed' : undefined,
        }}
      >
        <thead className="sticky top-0 z-10 bg-gray-50">
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id} className={headerRowClassName}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const isSorted = header.column.getIsSorted();

                const content =
                  typeof header.column.columnDef.header === 'string'
                    ? header.column.columnDef.header
                    : flexRender(header.column.columnDef.header, header.getContext());

                const width = hasSizing || header.column.columnDef.size !== 150 ? header.getSize() : undefined;

                return (
                  <th
                    key={header.id}
                    className={headerCellClassName}
                    style={{
                      width,
                      position: 'relative',
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="space-y-1 select-none">
                        {/* Header content - not wrapped in click handler to allow filter inputs */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">{content}</div>
                          {canSort && (
                            <div
                              className="cursor-pointer select-none ml-1 p-1 hover:bg-gray-200 rounded"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <span className="text-gray-400">
                                {isSorted === 'asc' ? (
                                  <ArrowUpIcon className="h-3 w-3" />
                                ) : isSorted === 'desc' ? (
                                  <ArrowDownIcon className="h-3 w-3" />
                                ) : (
                                  <span className="text-xs opacity-50">⇅</span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-blue-400 z-20 transition-colors ${
                          header.column.getIsResizing() ? 'bg-blue-500 w-1.5' : 'bg-gray-300 opacity-0 hover:opacity-100'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      />
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
            <>
              {rows.map((row) => {
                const context = { row };
                const computedRowClass = [
                  resolveClassName(rowClassName, context),
                  resolveClassName(getRowClassName, context),
                  onRowClick ? 'cursor-pointer' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                const handleRowClick = (e) => {
                  if (onRowClick) {
                    onRowClick(row.original, e);
                  }
                };

                return (
                  <tr
                    key={row.id}
                    data-row-id={row.original[idAttribute]}
                    className={computedRowClass}
                    onClick={handleRowClick}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const cellContext = { row, cell };
                      const computedCellClass = [
                        resolveClassName(cellClassName, cellContext),
                        resolveClassName(getCellClassName, cellContext),
                      ]
                        .filter(Boolean)
                        .join(' ');

                      const cellWidth = hasSizing || cell.column.columnDef.size !== 150 ? cell.column.getSize() : undefined;

                      return (
                        <td
                          key={cell.id}
                          className={computedCellClass}
                          style={{ width: cellWidth }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr style={{ height: '100%' }}>
                <td colSpan={columnCount} className="p-0 border-none bg-transparent" />
              </tr>
            </>
          )}
        </tbody>
        {footerContent && (
          <tfoot className={footerRowClassName}>
            {footerContent}
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default DataTable;

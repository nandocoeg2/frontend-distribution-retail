// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';
import DataTable from '../../components/table/DataTable';

const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor('id', {
    header: 'ID',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => info.getValue(),
  }),
];

const TestTableComponent = ({ theadClassName, footerRowClassName, footerContent }) => {
  const data = React.useMemo(() => [{ id: '1', name: 'Item 1' }], []);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <DataTable
      table={table}
      theadClassName={theadClassName}
      footerRowClassName={footerRowClassName}
      footerContent={footerContent}
    />
  );
};

describe('DataTable header and footer z-index', () => {
  it('renders thead with default sticky top-0 z-20 bg-gray-50', () => {
    const { container } = render(
      <TestTableComponent
        footerRowClassName="bg-gray-100 font-bold sticky bottom-0 border-t border-gray-300 z-10"
        footerContent={<tr><td>Footer</td></tr>}
      />
    );

    const thead = container.querySelector('thead');
    expect(thead).not.toBeNull();
    expect(thead.className).toContain('sticky');
    expect(thead.className).toContain('top-0');
    expect(thead.className).toContain('z-20');

    const tfoot = container.querySelector('tfoot');
    expect(tfoot).not.toBeNull();
    expect(tfoot.className).toContain('z-10');
  });

  it('allows custom theadClassName', () => {
    const { container } = render(
      <TestTableComponent theadClassName="custom-thead-class z-30" />
    );

    const thead = container.querySelector('thead');
    expect(thead).not.toBeNull();
    expect(thead.className).toBe('custom-thead-class z-30');
  });
});

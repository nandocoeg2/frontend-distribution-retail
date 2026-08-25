import { describe, it, expect } from 'vitest';

describe('Dynamic multi-select faceted filtering logic', () => {
  const invoiceRows = [
    {
      no_invoice: 'INV-001',
      customer: 'PT Alpha',
      top: '30',
      status: 'PAID',
      plu: 'PLU101',
      nama_barang: 'Barang A',
      grand_total: 100000,
    },
    {
      no_invoice: 'INV-002',
      customer: 'PT Alpha',
      top: '60',
      status: 'PENDING',
      plu: 'PLU102',
      nama_barang: 'Barang B',
      grand_total: 200000,
    },
    {
      no_invoice: 'INV-003',
      customer: 'PT Beta',
      top: '14',
      status: 'PENDING',
      plu: 'PLU103',
      nama_barang: 'Barang C',
      grand_total: 300000,
    },
    {
      no_invoice: 'INV-004',
      customer: 'PT Gamma',
      top: '30',
      status: 'CANCELLED',
      plu: 'PLU104',
      nama_barang: 'Barang D',
      grand_total: 400000,
    },
  ];

  const matchesInvoiceFilter = (row, filterId, filterValue) => {
    if (filterValue == null || filterValue === '') return true;
    if (Array.isArray(filterValue) && filterValue.length === 0) return true;

    if (
      filterId === 'customer' ||
      filterId === 'top' ||
      filterId === 'status' ||
      filterId === 'nama_barang'
    ) {
      if (!Array.isArray(filterValue)) return true;
      return filterValue.includes(row[filterId]);
    }

    const rowVal = String(row[filterId] ?? '').toLowerCase();
    return rowVal.includes(String(filterValue).toLowerCase().trim());
  };

  const getMatchingRowsExcluding = (rows, columnFilters, excludeFilterId) => {
    if (!rows || rows.length === 0) return [];
    if (!columnFilters || columnFilters.length === 0) return rows;

    return rows.filter((row) => {
      for (const filter of columnFilters) {
        if (filter.id === excludeFilterId) continue;
        if (!matchesInvoiceFilter(row, filter.id, filter.value)) {
          return false;
        }
      }
      return true;
    });
  };

  const getDynamicOptions = (rows, columnFilters, columnId) => {
    const matchingRows = getMatchingRowsExcluding(rows, columnFilters, columnId);
    const map = new Map();
    matchingRows.forEach((row) => {
      if (row[columnId] && row[columnId] !== '-') {
        map.set(row[columnId], { id: row[columnId], name: row[columnId] });
      }
    });

    const activeFilter = columnFilters.find((f) => f.id === columnId);
    const selectedValues = Array.isArray(activeFilter?.value) ? activeFilter.value : [];
    selectedValues.forEach((val) => {
      if (val && !map.has(val)) {
        map.set(val, { id: val, name: val });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  it('returns all options when no filters are active', () => {
    const filters = [];
    const customerOpts = getDynamicOptions(invoiceRows, filters, 'customer');
    expect(customerOpts.map((o) => o.id)).toEqual(['PT Alpha', 'PT Beta', 'PT Gamma']);

    const topOpts = getDynamicOptions(invoiceRows, filters, 'top');
    expect(topOpts.map((o) => o.id)).toEqual(['14', '30', '60']);

    const statusOpts = getDynamicOptions(invoiceRows, filters, 'status');
    expect(statusOpts.map((o) => o.id)).toEqual(['CANCELLED', 'PAID', 'PENDING']);

    const barangOpts = getDynamicOptions(invoiceRows, filters, 'nama_barang');
    expect(barangOpts.map((o) => o.id)).toEqual(['Barang A', 'Barang B', 'Barang C', 'Barang D']);
  });

  it('filters TOP and nama_barang options dynamically based on active customer filter', () => {
    const filters = [{ id: 'customer', value: ['PT Alpha'] }];
    const topOpts = getDynamicOptions(invoiceRows, filters, 'top');
    // PT Alpha only has TOP 30 and 60 (not 14)
    expect(topOpts.map((o) => o.id)).toEqual(['30', '60']);

    const barangOpts = getDynamicOptions(invoiceRows, filters, 'nama_barang');
    // PT Alpha has Barang A and Barang B
    expect(barangOpts.map((o) => o.id)).toEqual(['Barang A', 'Barang B']);
  });

  it('preserves multi-select within the same column while other column filters are active', () => {
    const filters = [
      { id: 'status', value: ['PENDING'] },
      { id: 'customer', value: ['PT Alpha'] },
    ];
    // For customer column, we exclude customer's own filter, so it should show all customers matching status=PENDING
    // PENDING rows are: INV-002 (PT Alpha), INV-003 (PT Beta)
    const customerOpts = getDynamicOptions(invoiceRows, filters, 'customer');
    expect(customerOpts.map((o) => o.id)).toEqual(['PT Alpha', 'PT Beta']);

    const barangOpts = getDynamicOptions(invoiceRows, filters, 'nama_barang');
    // Only INV-002 matches both status=PENDING and customer=PT Alpha
    expect(barangOpts.map((o) => o.id)).toEqual(['Barang B']);
  });

  it('retains currently selected options even if cross-filters produce no matches for that option', () => {
    const filters = [
      { id: 'status', value: ['CANCELLED'] },
      { id: 'customer', value: ['PT NonExistent'] },
    ];
    const customerOpts = getDynamicOptions(invoiceRows, filters, 'customer');
    expect(customerOpts.some((o) => o.id === 'PT NonExistent')).toBe(true);
  });
});

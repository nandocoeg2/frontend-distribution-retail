import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PurchaseOrderExportPreviewModal from '../../components/purchaseOrders/PurchaseOrderExportPreviewModal';

describe('PurchaseOrderExportPreviewModal sorting functionality', () => {
  const sampleData = {
    headers: [
      'PO',
      'COMPANY',
      'GROUP CUSTOMER',
      'CUSTOMER',
      'TANGGAL MASUK',
      'TANGGAL KIRIM',
      'TOP',
      'TYPE',
      'STATUS',
      'PLU',
      'BARCODE',
      'INTERNAL KODE BARANG',
      'NAMA BARANG',
      'QTY (PCS)',
      'HARGA (BASE)',
      'POT A',
      'HARGA POT A',
      'POT B',
      'HARGA POT B',
      'NETTO',
      'PPN',
      'TOTAL',
      'GRAND TOTAL',
    ],
    data: [
      {
        po: 'PO-002',
        company: 'PT Distribution',
        groupCustomer: 'Group B',
        customer: 'Customer Beta',
        tanggal_masuk: '21/10/2026',
        tanggal_kirim: '22/10/2026',
        top: 'TOP 30',
        type: 'REGULAR',
        status: 'OPEN',
        plu: 'PLU02',
        barcode: '123456789002',
        internal_item_code: 'ITEM-02',
        nama_barang: 'Zebra Snack',
        qty: 5,
        harga: 10000,
        potongan_a: 0,
        harga_after_potongan_a: 10000,
        potongan_b: 0,
        harga_after_potongan_b: 10000,
        harga_netto: 10000,
        vatRate: 11,
        total_pembelian: 50000,
        grand_total: 55500,
      },
      {
        po: 'PO-001',
        company: 'PT Distribution',
        groupCustomer: 'Group A',
        customer: 'Customer Alpha',
        tanggal_masuk: '15/01/2025',
        tanggal_kirim: '16/01/2025',
        top: 'TOP 14',
        type: 'REGULAR',
        status: 'OPEN',
        plu: 'PLU01',
        barcode: '123456789001',
        internal_item_code: 'ITEM-01',
        nama_barang: 'Apple Pie',
        qty: 50,
        harga: 5000,
        potongan_a: 0,
        harga_after_potongan_a: 5000,
        potongan_b: 0,
        harga_after_potongan_b: 5000,
        harga_netto: 5000,
        vatRate: 11,
        total_pembelian: 250000,
        grand_total: 277500,
      },
    ],
    totalItems: 2,
  };

  it('renders modal with table rows when open', () => {
    render(
      <PurchaseOrderExportPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        previewData={sampleData}
        previewLoading={false}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByText(/Preview Hasil Export Excel Purchase Order/i)).toBeDefined();
    expect(screen.getByText('Apple Pie')).toBeDefined();
    expect(screen.getByText('Zebra Snack')).toBeDefined();
  });

  it('sorts string column ascending and descending when sort button is clicked', () => {
    const { container } = render(
      <PurchaseOrderExportPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        previewData={sampleData}
        previewLoading={false}
        onExport={vi.fn()}
      />
    );

    // Initial order in tbody: Zebra Snack (row 0), Apple Pie (row 1)
    let tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows[0].textContent).toContain('Zebra Snack');
    expect(tbodyRows[1].textContent).toContain('Apple Pie');

    // Find the header for "Nama Barang"
    const thElements = Array.from(container.querySelectorAll('th'));
    const namaBarangTh = thElements.find((th) => th.textContent.includes('Nama Barang'));
    expect(namaBarangTh).toBeDefined();

    // Click the sort button in Nama Barang th
    const sortBtn = namaBarangTh.querySelector('.cursor-pointer');
    expect(sortBtn).toBeDefined();

    // 1st click: Sort ascending -> Apple Pie first, Zebra Snack second
    fireEvent.click(sortBtn);
    tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows[0].textContent).toContain('Apple Pie');
    expect(tbodyRows[1].textContent).toContain('Zebra Snack');

    // 2nd click: Sort descending -> Zebra Snack first, Apple Pie second
    fireEvent.click(sortBtn);
    tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows[0].textContent).toContain('Zebra Snack');
    expect(tbodyRows[1].textContent).toContain('Apple Pie');
  });

  it('sorts numeric column (qty) properly', () => {
    const { container } = render(
      <PurchaseOrderExportPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        previewData={sampleData}
        previewLoading={false}
        onExport={vi.fn()}
      />
    );

    // Initial order: Zebra Snack (qty: 5), Apple Pie (qty: 50)
    const thElements = Array.from(container.querySelectorAll('th'));
    const qtyTh = thElements.find((th) => th.textContent.includes('Qty (Pcs)'));
    expect(qtyTh).toBeDefined();

    const sortBtn = qtyTh.querySelector('.cursor-pointer');

    // In TanStack Table, numeric columns sort desc first (50 first, then 5)
    fireEvent.click(sortBtn);
    let tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows[0].textContent).toContain('Apple Pie');
    expect(tbodyRows[1].textContent).toContain('Zebra Snack');

    // 2nd click: Ascending (5 first, then 50)
    fireEvent.click(sortBtn);
    tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows[0].textContent).toContain('Zebra Snack');
    expect(tbodyRows[1].textContent).toContain('Apple Pie');
  });

  it('sorts date column (tanggal_masuk) chronologically properly', () => {
    const { container } = render(
      <PurchaseOrderExportPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        previewData={sampleData}
        previewLoading={false}
        onExport={vi.fn()}
      />
    );

    // 15/01/2025 is earlier than 21/10/2026
    const thElements = Array.from(container.querySelectorAll('th'));
    const dateTh = thElements.find((th) => th.textContent.includes('Tgl Masuk'));
    expect(dateTh).toBeDefined();

    const sortBtn = dateTh.querySelector('.cursor-pointer');

    // 1st click: Ascending -> 15/01/2025 (Apple Pie) first, 21/10/2026 (Zebra Snack) second
    fireEvent.click(sortBtn);
    let tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows[0].textContent).toContain('Apple Pie');
    expect(tbodyRows[1].textContent).toContain('Zebra Snack');

    // 2nd click: Descending -> 21/10/2026 (Zebra Snack) first, 15/01/2025 (Apple Pie) second
    fireEvent.click(sortBtn);
    tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows[0].textContent).toContain('Zebra Snack');
    expect(tbodyRows[1].textContent).toContain('Apple Pie');
  });
});

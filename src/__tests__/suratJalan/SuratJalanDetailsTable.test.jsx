// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SuratJalanDetailsTable from '../../components/suratJalan/SuratJalanDetailsTable';

describe('SuratJalanDetailsTable', () => {
  it('renders empty message when no data is provided', () => {
    render(<SuratJalanDetailsTable packingBoxes={[]} />);
    expect(screen.getByText('No details available.')).toBeDefined();
  });

  it('renders table rows correctly from packingBoxes data structure', () => {
    const mockPackingBoxes = [
      {
        id: 'box-1',
        no_box: '1',
        total_quantity_in_box: 10,
        packingBoxItems: [
          {
            id: 'item-1',
            itemId: 'ITM001',
            nama_barang: 'Product Alpha',
            quantity: 5,
            satuan: 'PCS',
            keterangan: 'Fragile',
            item: { plu: 'PLU001' },
          },
          {
            id: 'item-2',
            itemId: 'ITM002',
            nama_barang: 'Product Beta',
            quantity: 5,
            satuan: 'PCS',
            keterangan: 'Normal',
            item: { plu: 'PLU002' },
          },
        ],
      },
      {
        id: 'box-2',
        no_box: '2',
        total_quantity_in_box: 15,
        packingBoxItems: [
          {
            id: 'item-3',
            itemId: 'ITM003',
            nama_barang: 'Product Gamma',
            quantity: 15,
            satuan: 'BOX',
            keterangan: '-',
            item: { plu: 'PLU003' },
          },
        ],
      },
    ];

    render(<SuratJalanDetailsTable packingBoxes={mockPackingBoxes} />);

    // Check headers
    expect(screen.getByText('No. Box')).toBeDefined();
    expect(screen.getByText('PLU')).toBeDefined();
    expect(screen.getByText('Nama Barang')).toBeDefined();
    expect(screen.getByText('Qty')).toBeDefined();
    expect(screen.getByText('Satuan')).toBeDefined();
    expect(screen.getByText('Keterangan')).toBeDefined();

    // Check box badges/numbers
    expect(screen.getAllByText('Box #1')).toHaveLength(2);
    expect(screen.getByText('Box #2')).toBeDefined();

    // Check items
    expect(screen.getByText('Product Alpha')).toBeDefined();
    expect(screen.getByText('Product Beta')).toBeDefined();
    expect(screen.getByText('Product Gamma')).toBeDefined();

    // Check PLU
    expect(screen.getByText('PLU001')).toBeDefined();
    expect(screen.getByText('PLU002')).toBeDefined();
    expect(screen.getByText('PLU003')).toBeDefined();

    // Check footer sum of quantity (5 + 5 + 15 = 25)
    expect(screen.getByText('25')).toBeDefined();
  });

  it('renders table rows correctly from pre-flattened details prop', () => {
    const mockDetails = [
      {
        id: 'd-1',
        no_box: 'Box 10',
        plu: 'PLU999',
        nama_barang: 'Direct Item',
        quantity: 20,
        satuan: 'DUS',
        keterangan: 'Special Request',
      },
    ];

    render(<SuratJalanDetailsTable details={mockDetails} />);

    expect(screen.getByText('Box 10')).toBeDefined();
    expect(screen.getByText('PLU999')).toBeDefined();
    expect(screen.getByText('Direct Item')).toBeDefined();
    // 20 is present in the row cell and in the footer sum
    expect(screen.getAllByText('20').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('DUS')).toBeDefined();
    expect(screen.getByText('Special Request')).toBeDefined();
  });
});

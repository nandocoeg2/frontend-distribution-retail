import { describe, it, expect } from 'vitest';

describe('StockInTable data transformation and filtering', () => {
  const sampleMovements = [
    {
      id: 'mov-1',
      type: 'STOCK_IN',
      createdAt: '2026-08-24T10:00:00.000Z',
      no_surat_jalan: 'SJ-001',
      supplier: { id: 'sup-1', name: 'PT Sumber Makmur' },
      items: [
        {
          id: 'item-1',
          quantity: 100,
          item: { id: 'itm-1', nama_barang: 'Beras Pandan Wangi 5kg', plu: '1001' },
        },
        {
          id: 'item-2',
          quantity: 50,
          item: { id: 'itm-2', nama_barang: 'Minyak Goreng 2L', plu: '1002' },
        },
      ],
    },
    {
      id: 'mov-2',
      type: 'STOCK_OUT', // Should be ignored in stock in table
      createdAt: '2026-08-24T11:00:00.000Z',
      no_surat_jalan: 'SJ-OUT-001',
      supplier: { id: 'sup-2', name: 'PT Other' },
      items: [
        {
          id: 'item-3',
          quantity: 20,
          item: { id: 'itm-3', nama_barang: 'Gula Pasir 1kg', plu: '1003' },
        },
      ],
    },
  ];

  it('correctly filters for STOCK_IN type only and flattens items into table rows', () => {
    const flatRows = [];

    sampleMovements.forEach((movement) => {
      if (movement.type && movement.type !== 'STOCK_IN') {
        return;
      }

      const supplierName =
        movement?.supplier?.name ||
        movement?.supplierName ||
        movement?.reportPoSuppliers?.[0]?.supplier?.name ||
        '-';

      const suratJalanNo =
        movement?.no_surat_jalan ||
        movement?.reportPoSuppliers?.[0]?.no_surat_jalan ||
        '-';

      const movementDate = movement?.createdAt || null;
      const items = Array.isArray(movement?.items) ? movement.items : [];

      if (items.length === 0) {
        flatRows.push({
          id: movement.id,
          movementId: movement.id,
          createdAt: movementDate,
          no_surat_jalan: suratJalanNo,
          nama_barang: '-',
          plu: '-',
          qty: 0,
          quantity: 0,
          nama_supplier: supplierName,
          source: movement,
        });
      } else {
        items.forEach((itemObj, idx) => {
          const itemInfo = itemObj?.item || itemObj?.inventory || {};
          flatRows.push({
            id: `${movement.id}-${idx}`,
            movementId: movement.id,
            createdAt: movementDate,
            no_surat_jalan: suratJalanNo,
            nama_barang: itemInfo?.nama_barang || itemInfo?.name || '-',
            plu: itemInfo?.plu || '-',
            qty: Number(itemObj?.quantity || 0),
            quantity: Number(itemObj?.quantity || 0),
            nama_supplier: supplierName,
            source: movement,
          });
        });
      }
    });

    expect(flatRows).toHaveLength(2);
    expect(flatRows[0].nama_barang).toBe('Beras Pandan Wangi 5kg');
    expect(flatRows[0].qty).toBe(100);
    expect(flatRows[0].no_surat_jalan).toBe('SJ-001');
    expect(flatRows[0].nama_supplier).toBe('PT Sumber Makmur');

    expect(flatRows[1].nama_barang).toBe('Minyak Goreng 2L');
    expect(flatRows[1].qty).toBe(50);
  });
});

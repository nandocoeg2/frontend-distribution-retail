import { describe, it, expect } from 'vitest';

describe('StockOutTable data transformation and calculation', () => {
  const sampleMovements = [
    {
      id: 'mov-out-1',
      type: 'STOCK_OUT',
      createdAt: '2026-08-24T10:00:00.000Z',
      no_po: 'PO-2026-001',
      no_invoice: 'INV-2026-001',
      customer: { id: 'cust-1', namaCustomer: 'Supermarket A' },
      purchaseOrder: {
        po_number: 'PO-2026-001',
        grand_total: 500000,
        laporanPenerimaanBarang: {
          tanggal_po: '2026-08-25T10:00:00.000Z',
        },
        purchaseOrderDetails: [
          { itemId: 'itm-1', plu: '1001', total_quantity_order: 100 },
          { itemId: 'itm-2', plu: '1002', quantity_pcs: 50 },
        ],
        invoicePenagihan: [
          {
            invoicePenagihanDetails: [
              { itemId: 'itm-1', PLU: '1001', quantity: 90 },
              { itemId: 'itm-2', PLU: '1002', quantity: 50 },
            ],
          },
        ],
      },
      items: [
        {
          id: 'mov-item-1',
          itemId: 'itm-1',
          quantity: 90,
          item: { id: 'itm-1', nama_barang: 'Beras 5kg', plu: '1001' },
        },
        {
          id: 'mov-item-2',
          itemId: 'itm-2',
          quantity: 40,
          item: { id: 'itm-2', nama_barang: 'Minyak 2L', plu: '1002' },
        },
      ],
    },
    {
      id: 'mov-in-1',
      type: 'STOCK_IN', // Non-STOCK_OUT should be excluded
      createdAt: '2026-08-24T11:00:00.000Z',
      no_po: 'PO-IN-001',
      items: [
        {
          id: 'item-3',
          quantity: 20,
          item: { id: 'itm-3', nama_barang: 'Gula 1kg', plu: '1003' },
        },
      ],
    },
  ];

  it('correctly filters for STOCK_OUT type only and computes selisih & stok gantung', () => {
    const flatRows = [];

    sampleMovements.forEach((movement) => {
      if (movement.type && movement.type !== 'STOCK_OUT') {
        return;
      }

      const customerName =
        movement?.customer?.namaCustomer ||
        movement?.customerName ||
        '-';

      const movementDate = movement?.createdAt || null;
      const poNumber = movement?.no_po || movement?.purchaseOrder?.po_number || '-';
      const invoiceNumber = movement?.no_invoice || '-';

      const lpb =
        movement?.purchaseOrder?.laporanPenerimaanBarang ||
        movement?.suratJalan?.purchaseOrder?.laporanPenerimaanBarang;
      const hasLpb = Boolean(lpb);
      const tanggalLpbVal = lpb?.tanggal_po || lpb?.createdAt || null;

      const items = Array.isArray(movement?.items) ? movement.items : [];
      const poDetails = Array.isArray(movement?.purchaseOrder?.purchaseOrderDetails)
        ? movement.purchaseOrder.purchaseOrderDetails
        : [];

      const groupedItemsMap = new Map();
      items.forEach((itemObj) => {
        const itemInfo = itemObj?.item || itemObj?.inventory || {};
        const itemId = itemObj?.itemId || itemInfo?.id;
        const key = itemId || itemInfo?.plu || itemInfo?.nama_barang || JSON.stringify(itemInfo);

        if (groupedItemsMap.has(key)) {
          const existing = groupedItemsMap.get(key);
          existing.quantity += Number(itemObj?.quantity || 0);
        } else {
          groupedItemsMap.set(key, {
            ...itemObj,
            itemInfo,
            itemId,
            quantity: Number(itemObj?.quantity || 0),
          });
        }
      });

      const groupedItems = Array.from(groupedItemsMap.values());

      groupedItems.forEach((itemObj, idx) => {
        const itemInfo = itemObj.itemInfo;
        const itemId = itemObj.itemId;
        const totalPengiriman = itemObj.quantity;

        const matchingPoDetails = poDetails.filter(
          (pod) =>
            (itemId && pod.itemId === itemId) ||
            (itemInfo?.plu && (pod?.plu === itemInfo?.plu || pod?.PLU === itemInfo?.plu)) ||
            (itemInfo?.nama_barang && pod?.nama_barang === itemInfo?.nama_barang)
        );
        const poQuantity = matchingPoDetails.length > 0
          ? matchingPoDetails.reduce(
              (sum, pod) =>
                sum +
                Number(
                  pod.total_quantity_order ??
                  pod.quantity_pcs ??
                  pod.quantity ??
                  pod.qty_po ??
                  pod.qty ??
                  0
                ),
              0
            )
          : (poDetails.length > 0 ? 0 : totalPengiriman);

        const invoicePenagihanList = Array.isArray(movement?.purchaseOrder?.invoicePenagihan)
          ? movement.purchaseOrder.invoicePenagihan
          : [];

        const matchingInvoiceDetails = invoicePenagihanList.flatMap(
          (inv) => inv?.invoicePenagihanDetails || []
        ).filter(
          (det) => det?.itemId === itemId || (itemInfo?.plu && det?.PLU === itemInfo?.plu)
        );

        const totalPenagihan = matchingInvoiceDetails.reduce(
          (sum, det) => sum + Number(det?.quantity || 0),
          0
        );

          // Calculate Total LPB (Qty LPB) for this item
          const lpbDetails = Array.isArray(lpb?.detailItems) ? lpb.detailItems : [];
          const matchingLpbDetails = lpbDetails.filter(
            (det) =>
              (itemInfo?.plu && (det?.plu === itemInfo?.plu || det?.PLU === itemInfo?.plu)) ||
              (itemInfo?.nama_barang && det?.nama_barang === itemInfo?.nama_barang)
          );

          const totalLpb = hasLpb
            ? matchingLpbDetails.length > 0
              ? matchingLpbDetails.reduce(
                  (sum, det) =>
                    sum +
                    Number(
                      det?.total_quantity_order ??
                      det?.quantity_pcs ??
                      det?.quantity ??
                      0
                    ),
                  0
                )
              : (totalPenagihan > 0 ? totalPenagihan : totalPengiriman)
            : 0;

          const selisih = poQuantity - totalPengiriman;
          const stokGantung = hasLpb ? (totalPenagihan - totalPengiriman) : 0;

          flatRows.push({
            id: `${movement.id}-${idx}`,
            movementId: movement.id,
            tgl: movementDate,
            noInvoice: invoiceNumber,
            plu: itemInfo?.plu || '-',
            namaCustomer: customerName,
            namaBarang: itemInfo?.nama_barang || '-',
            totalPengiriman,
            poQuantity,
            selisih,
            noPo: poNumber,
            totalLpb,
            stokGantung,
            source: movement,
          });
        });
      });

    expect(flatRows).toHaveLength(2);

    // Item 1: Beras 5kg
    expect(flatRows[0].namaBarang).toBe('Beras 5kg');
    expect(flatRows[0].totalPengiriman).toBe(90);
    expect(flatRows[0].poQuantity).toBe(100);
    expect(flatRows[0].selisih).toBe(10); // 100 - 90
    expect(flatRows[0].totalLpb).toBe(90);
    expect(flatRows[0].stokGantung).toBe(0); // 90 - 90

    // Item 2: Minyak 2L
    expect(flatRows[1].namaBarang).toBe('Minyak 2L');
    expect(flatRows[1].totalPengiriman).toBe(40);
    expect(flatRows[1].poQuantity).toBe(50);
    expect(flatRows[1].selisih).toBe(10); // 50 - 40
    expect(flatRows[1].totalLpb).toBe(50);
    expect(flatRows[1].stokGantung).toBe(10); // 50 - 40
  });
});

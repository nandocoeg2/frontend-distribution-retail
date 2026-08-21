// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, renderHook, act } from '@testing-library/react';
import usePackingForm from '../../hooks/usePackingForm';
import PackingForm from '../../components/packings/PackingForm';

const mockFetchPackingStatuses = vi.fn();
vi.mock('../../hooks/useStatuses', () => ({
  default: () => ({
    packingStatuses: [
      { id: 'status-1', status_name: 'Pending Packing', status_code: 'PENDING PACKING' },
      { id: 'status-2', status_name: 'Completed Packing', status_code: 'COMPLETED PACKING' },
    ],
    loading: { packing: false },
    fetchPackingStatuses: mockFetchPackingStatuses,
  }),
}));

vi.mock('../../hooks/useItemsLookup', () => ({
  default: () => ({
    items: [
      { id: 'item-1', nama_barang: 'Item Alpha', plu: 'PLU001' },
      { id: 'item-2', nama_barang: 'Item Beta', plu: 'PLU002' },
    ],
    loading: false,
  }),
}));

vi.mock('../../hooks/usePackingOperations', () => ({
  default: () => ({
    isCreating: false,
    isUpdating: false,
    createPackingData: vi.fn(),
    updatePackingData: vi.fn(),
  }),
}));

vi.mock('../../hooks/useMixedCartonValidation', () => ({
  default: () => ({
    loadItemsRelationships: vi.fn().mockResolvedValue([]),
    canAddItemToBox: () => ({ canAdd: true, reason: '' }),
    getCompatibleItems: () => [],
    getMixingInfo: () => ({ allowMixed: true, mixedWithItemIds: [] }),
    loading: false,
  }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('usePackingForm hook for Edit Packing', () => {
  it('validates packing boxes without requiring header fields (tanggal, status, PO)', () => {
    const { result } = renderHook(() =>
      usePackingForm({
        id: 'packing-1',
        packingBoxes: [
          {
            no_box: 'BOX-001',
            statusId: 'status-1',
            packingBoxItems: [
              {
                nama_barang: 'Item Alpha',
                quantity: '10',
                itemId: 'item-1',
                keterangan: 'Box 1 note',
              },
            ],
          },
        ],
      })
    );

    let isValid = false;
    act(() => {
      isValid = result.current.validateForm();
    });

    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({});

    const formatted = result.current.getFormattedData();
    expect(formatted.packingBoxes).toHaveLength(1);
    expect(formatted.packingBoxes[0].packingBoxItems[0].quantity).toBe(10);
  });

  it('fails validation when a box has no items or empty no_box', () => {
    const { result } = renderHook(() =>
      usePackingForm({
        id: 'packing-1',
        packingBoxes: [
          {
            no_box: '',
            statusId: 'status-1',
            packingBoxItems: [],
          },
        ],
      })
    );

    let isValid = false;
    act(() => {
      isValid = result.current.validateForm();
    });

    expect(isValid).toBe(false);
    expect(result.current.errors['packingBoxes.0.no_box']).toBe('Nomor box harus diisi');
    expect(result.current.errors['packingBoxes.0.items']).toBe('Minimal satu item per box');
  });
});

describe('PackingForm component', () => {
  it('renders packing boxes directly without Tanggal Packing, Status, and Purchase Order header fields', () => {
    const initialData = {
      id: 'packing-1',
      packing_number: 'PCK-001',
      packingBoxes: [
        {
          no_box: 'BOX-001',
          statusId: 'status-1',
          packingBoxItems: [
            {
              nama_barang: 'Item Alpha',
              quantity: 5,
              itemId: 'item-1',
              keterangan: '',
            },
          ],
        },
      ],
    };

    const { unmount } = render(
      <PackingForm initialData={initialData} onSuccess={vi.fn()} onCancel={vi.fn()} />
    );

    // Header fields should NOT be in the document
    expect(screen.queryByText('Tanggal Packing *')).toBeNull();
    expect(screen.queryByText('Purchase Order *')).toBeNull();

    // Packing Boxes section should be rendered directly
    expect(screen.getByText('Packing Boxes *')).toBeDefined();
    expect(screen.getByDisplayValue('BOX-001')).toBeDefined();
    expect(screen.getByDisplayValue('Item Alpha')).toBeDefined();

    unmount();
  });
});

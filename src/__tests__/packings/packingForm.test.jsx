// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, renderHook, act } from '@testing-library/react';
import usePackingForm from '../../hooks/usePackingForm';
import PackingForm from '../../components/packings/PackingForm';

const mockFetchPackingStatuses = vi.fn();
const mockFetchPackingItemStatuses = vi.fn();

const MOCK_PACKING_STATUSES = [
  { id: 'status-pack-1', status_name: 'Pending Packing', status_code: 'PENDING PACKING' },
  { id: 'status-pack-2', status_name: 'Completed Packing', status_code: 'COMPLETED PACKING' },
];

const MOCK_PACKING_ITEM_STATUSES = [
  { id: 'status-box-1', status_name: 'Pending Item', status_code: 'PENDING ITEM' },
  { id: 'status-box-2', status_name: 'Processed Item', status_code: 'PROCESSED ITEM' },
];

const MOCK_ITEMS = [
  { id: 'item-1', nama_barang: 'Item Alpha', plu: 'PLU001' },
  { id: 'item-2', nama_barang: 'Item Beta', plu: 'PLU002' },
];

vi.mock('../../hooks/useStatuses', () => ({
  default: () => ({
    packingStatuses: MOCK_PACKING_STATUSES,
    packingItemStatuses: MOCK_PACKING_ITEM_STATUSES,
    loading: { packing: false, packingItem: false },
    fetchPackingStatuses: mockFetchPackingStatuses,
    fetchPackingItemStatuses: mockFetchPackingItemStatuses,
  }),
}));

vi.mock('../../hooks/useItemsLookup', () => ({
  default: () => ({
    items: MOCK_ITEMS,
    loading: false,
  }),
}));

const mockPackingOperations = {
  isCreating: false,
  isUpdating: false,
  createPackingData: vi.fn(),
  updatePackingData: vi.fn(),
};

vi.mock('../../hooks/usePackingOperations', () => ({
  default: () => mockPackingOperations,
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
            statusId: 'status-box-1',
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
    expect(formatted.packingBoxes[0].statusId).toBe('status-box-1');
    expect(formatted.packingBoxes[0].packingBoxItems[0].quantity).toBe(10);
    expect(formatted.packingBoxes[0].packingBoxItems[0].itemId).toBe('item-1');
  });

  it('auto-resolves missing itemId when nama_barang matches an item from catalog', () => {
    const { result } = renderHook(() =>
      usePackingForm({
        id: 'packing-1',
        packingBoxes: [
          {
            no_box: 'BOX-001',
            statusId: 'status-box-1',
            packingBoxItems: [
              {
                nama_barang: 'Item Beta',
                quantity: '5',
                itemId: '', // Initially empty
                keterangan: '',
              },
            ],
          },
        ],
      })
    );

    expect(result.current.formData.packingBoxes[0].packingBoxItems[0].itemId).toBe('item-2');
  });

  it('fails validation when a box has no items or empty no_box', () => {
    const { result } = renderHook(() =>
      usePackingForm({
        id: 'packing-1',
        packingBoxes: [
          {
            no_box: '',
            statusId: 'status-box-1',
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
  it('renders packing boxes and populates status and items properly', () => {
    const initialData = {
      id: 'packing-1',
      packing_number: 'PCK-001',
      packingBoxes: [
        {
          no_box: 'BOX-001',
          statusId: 'status-box-1',
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
    expect(screen.getAllByDisplayValue('Item Alpha').length).toBeGreaterThan(0);

    // Status box dropdown should contain option for Pending Item
    expect(screen.getByText('Pending Item')).toBeDefined();

    unmount();
  });
});

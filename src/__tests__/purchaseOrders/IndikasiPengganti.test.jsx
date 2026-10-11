import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IndikasiPenggantiDialog from '../../components/purchaseOrders/IndikasiPenggantiDialog';
import BulkUploadHistory from '../../pages/BulkUploadHistory';
import AddPurchaseOrderModal from '../../components/purchaseOrders/AddPurchaseOrderModal';
import bulkPurchaseOrderService from '@/services/bulkPurchaseOrderService';
import fileService from '@/services/fileService';

vi.mock('@/services/bulkPurchaseOrderService', () => ({
  default: {
    getAll: vi.fn(),
    getFileById: vi.fn(),
    retryFile: vi.fn(),
    retryFileTextExtraction: vi.fn(),
    resolveIndikasiPengganti: vi.fn(),
  },
}));

vi.mock('@/services/fileService', () => ({
  default: {
    uploadBulkPurchaseOrders: vi.fn(),
    uploadBulkPurchaseOrdersTextExtraction: vi.fn(),
  },
}));

vi.mock('@/services/authService', () => ({
  default: { getCompanyData: () => ({ id: 'co1' }), getToken: () => 't' },
}));

vi.mock('@/services/scheduledPriceService', () => ({ default: {} }));

vi.mock('@/services/toastService', () => ({
  default: { success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

vi.mock('@/components/purchaseOrders/PurchaseOrderForm.jsx', () => ({ default: () => null }));
vi.mock('@/components/purchaseOrders/PurchaseOrderDetailsForm.jsx', () => ({ default: () => null }));

const item = {
  fileId: 'f1',
  filename: 'po-1.pdf',
  poNumber: 'UZ01POI26013269',
  poDate: '2026-09-18',
  deliveryDate: '2026-09-18',
};

describe('IndikasiPenggantiDialog', () => {
  it('shows the PO info and calls the right handler for Iya / Tidak', () => {
    const onYes = vi.fn();
    const onNo = vi.fn();
    render(<IndikasiPenggantiDialog show item={item} onYes={onYes} onNo={onNo} />);

    expect(screen.getByText('UZ01POI26013269')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Iya' }));
    expect(onYes).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Tidak' }));
    expect(onNo).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when hidden', () => {
    const { container } = render(
      <IndikasiPenggantiDialog show={false} item={item} onYes={vi.fn()} onNo={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });
});

describe('BulkUploadHistory - awaiting confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bulkPurchaseOrderService.getAll.mockResolvedValue({
      data: [
        {
          id: 'f1',
          filename: 'po-1.pdf',
          createdAt: '2026-09-18T00:00:00Z',
          updatedAt: '2026-09-18T00:00:00Z',
          status: { status_code: 'AWAITING CONFIRMATION BULK PURCHASE ORDER' },
        },
      ],
    });
    bulkPurchaseOrderService.getFileById.mockResolvedValue({
      data: {
        id: 'f1',
        pendingIndikasi: { poNumber: 'UZ01POI26013269', poDate: '2026-09-18', deliveryDate: '2026-09-18' },
      },
    });
    bulkPurchaseOrderService.resolveIndikasiPengganti.mockResolvedValue({ data: { result: 'success' } });
  });

  it('opens the popup from the Konfirmasi button and sends confirm=true on Iya', async () => {
    render(<BulkUploadHistory />);

    fireEvent.click(await screen.findByText('Konfirmasi'));
    expect(await screen.findByText('UZ01POI26013269')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Iya' }));
    await waitFor(() =>
      expect(bulkPurchaseOrderService.resolveIndikasiPengganti).toHaveBeenCalledWith('f1', true)
    );
  });

  it('sends confirm=false on Tidak', async () => {
    bulkPurchaseOrderService.resolveIndikasiPengganti.mockResolvedValue({ data: { result: 'rejected' } });
    render(<BulkUploadHistory />);

    fireEvent.click(await screen.findByText('Konfirmasi'));
    await screen.findByText('UZ01POI26013269');
    fireEvent.click(screen.getByRole('button', { name: 'Tidak' }));

    await waitFor(() =>
      expect(bulkPurchaseOrderService.resolveIndikasiPengganti).toHaveBeenCalledWith('f1', false)
    );
  });
});

describe('AddPurchaseOrderModal - bulk upload with held Indikasi Pengganti PO', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bulkPurchaseOrderService.resolveIndikasiPengganti.mockResolvedValue({ data: { result: 'success' } });
  });

  it('asks Iya/Tidak for each held file before finishing the upload', async () => {
    fileService.uploadBulkPurchaseOrdersTextExtraction.mockResolvedValue({
      success: true,
      data: {
        data: {
          totalFiles: 2,
          successFiles: 0,
          errorFiles: 0,
          failedFiles: [],
          awaitingFiles: [
            { ...item, fileId: 'f1' },
            { ...item, fileId: 'f2', filename: 'po-2.pdf', poNumber: 'PO-2' },
          ],
        },
      },
    });
    const onClose = vi.fn();
    const onFinished = vi.fn();
    const { container } = render(
      <AddPurchaseOrderModal isOpen onClose={onClose} onFinished={onFinished} createPurchaseOrder={vi.fn()} />
    );

    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'po-1.pdf', { type: 'application/pdf' })] },
    });
    fireEvent.click(await screen.findByText('Upload File'));

    // First held file
    expect(await screen.findByText('UZ01POI26013269')).toBeDefined();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Iya' }));

    // Second held file
    expect(await screen.findByText('PO-2')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Tidak' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(bulkPurchaseOrderService.resolveIndikasiPengganti).toHaveBeenNthCalledWith(1, 'f1', true);
    expect(bulkPurchaseOrderService.resolveIndikasiPengganti).toHaveBeenNthCalledWith(2, 'f2', false);
  });
});

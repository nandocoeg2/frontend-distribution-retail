import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InvoicePengirimanDetailCard from '../../components/invoicePengiriman/InvoicePengirimanDetailCard';

describe('InvoicePengirimanDetailCard', () => {
  const mockInvoice = {
    id: 'inv-1',
    no_invoice: 'BJM/00899/INV/SAT/VI/26',
    invoiceDetails: [
      {
        id: 'det-1',
        plu: 'PLU01',
        item: { item_name: 'Product A' },
        quantity: 10,
        harga: 50000,
        total: 500000,
      },
    ],
  };

  it('renders detail card without Ringkasan tab and directly shows items', () => {
    render(
      <InvoicePengirimanDetailCard
        invoice={mockInvoice}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('BJM/00899/INV/SAT/VI/26')).toBeDefined();
    // Tab Ringkasan should NOT exist
    expect(screen.queryByText('Ringkasan')).toBeNull();
  });
});

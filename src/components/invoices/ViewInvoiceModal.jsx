import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ViewInvoiceModal = ({ show, onClose, invoice }) => {
  if (!show || !invoice) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Invoice Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
              <p className="mt-1 text-sm text-gray-900">{invoice.no_invoice}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(invoice.tanggal)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Deliver To</label>
              <p className="mt-1 text-sm text-gray-900">{invoice.deliver_to}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <p className="mt-1 text-sm text-gray-900">{invoice.type}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Sub Total</label>
              <p className="mt-1 text-sm text-gray-900">{formatCurrency(invoice.sub_total)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Total Discount</label>
              <p className="mt-1 text-sm text-gray-900">{formatCurrency(invoice.total_discount)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Total Price</label>
              <p className="mt-1 text-sm text-gray-900">{formatCurrency(invoice.total_price)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">PPN Percentage</label>
              <p className="mt-1 text-sm text-gray-900">{invoice.ppn_percentage}%</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">PPN Rupiah</label>
              <p className="mt-1 text-sm text-gray-900">{formatCurrency(invoice.ppn_rupiah)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Grand Total</label>
              <p className="mt-1 text-sm text-gray-900 font-bold">{formatCurrency(invoice.grand_total)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">TOP</label>
              <p className="mt-1 text-sm text-gray-900">{invoice.TOP}</p>
            </div>
          </div>

          {invoice.invoiceDetails && invoice.invoiceDetails.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Invoice Details</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PLU</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.invoiceDetails.map((detail, index) => (
                      <tr key={detail.id || index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{detail.nama_barang}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{detail.PLU}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{detail.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{detail.satuan}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(detail.harga)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(detail.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewInvoiceModal;

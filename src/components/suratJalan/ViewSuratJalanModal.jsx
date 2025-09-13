import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ViewSuratJalanModal = ({ show, onClose, suratJalan }) => {
  if (!show || !suratJalan) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Surat Jalan Details</h3>
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
              <label className="block text-sm font-medium text-gray-700">No Surat Jalan</label>
              <p className="mt-1 text-sm text-gray-900">{suratJalan.no_surat_jalan}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Deliver To</label>
              <p className="mt-1 text-sm text-gray-900">{suratJalan.deliver_to}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">PIC</label>
              <p className="mt-1 text-sm text-gray-900">{suratJalan.PIC}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Alamat Tujuan</label>
              <p className="mt-1 text-sm text-gray-900">{suratJalan.alamat_tujuan}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Printed</label>
              <p className="mt-1 text-sm text-gray-900">{suratJalan.is_printed ? 'Yes' : 'No'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Print Counter</label>
              <p className="mt-1 text-sm text-gray-900">{suratJalan.print_counter}</p>
            </div>
          </div>

          {suratJalan.invoice && (
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">Invoice Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice No</label>
                  <p className="mt-1 text-sm text-gray-900">{suratJalan.invoice.no_invoice}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice Deliver To</label>
                  <p className="mt-1 text-sm text-gray-900">{suratJalan.invoice.deliver_to}</p>
                </div>
              </div>
            </div>
          )}

          {suratJalan.suratJalanDetails && suratJalan.suratJalanDetails.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">Surat Jalan Details</h4>
              {suratJalan.suratJalanDetails.map((detail, detailIndex) => (
                <div key={detail.id || detailIndex} className="mb-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">No Box</label>
                      <p className="mt-1 text-sm text-gray-900">{detail.no_box}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Quantity in Box</label>
                      <p className="mt-1 text-sm text-gray-900">{detail.total_quantity_in_box}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Isi Box</label>
                      <p className="mt-1 text-sm text-gray-900">{detail.isi_box}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sisa</label>
                      <p className="mt-1 text-sm text-gray-900">{detail.sisa}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Box</label>
                      <p className="mt-1 text-sm text-gray-900">{detail.total_box}</p>
                    </div>
                  </div>

                  {detail.suratJalanDetailItems && detail.suratJalanDetailItems.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Items</h5>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Barang</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PLU</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Satuan</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Box</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {detail.suratJalanDetailItems.map((item, itemIndex) => (
                              <tr key={item.id || itemIndex}>
                                <td className="px-4 py-2 text-sm text-gray-900">{item.nama_barang}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{item.PLU}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{item.satuan}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{item.total_box}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{item.keterangan}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
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

export default ViewSuratJalanModal;

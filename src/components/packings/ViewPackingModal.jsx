import React from 'react';

const ViewPackingModal = ({ packing, onClose }) => {
  if (!packing) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Packing Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">PO Number</p>
            <p className="text-lg font-semibold">{packing.purchaseOrder?.po_number || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tanggal Packing</p>
            <p className="text-lg">{new Date(packing.tanggal_packing).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="text-lg font-semibold text-indigo-600">{packing.status?.status_name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Surat Jalan</p>
            <p className="text-lg">{packing.purchaseOrder?.suratJalan || 'N/A'}</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Packed Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-50 border border-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Carton</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Isi/Carton</th>
                </tr>
              </thead>
              <tbody>
                {packing.packingItems?.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-2">{item.nama_barang}</td>
                    <td className="px-4 py-2">{item.total_qty}</td>
                    <td className="px-4 py-2">{item.jumlah_carton}</td>
                    <td className="px-4 py-2">{item.isi_per_carton}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPackingModal;


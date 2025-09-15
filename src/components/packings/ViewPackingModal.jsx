import React from 'react';

const ViewPackingModal = ({ packing, onClose }) => {
  if (!packing) return null;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',  
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDateOnly = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full p-6 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Packing Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            &times;
          </button>
        </div>
        
        {/* Basic Packing Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Packing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Packing ID</p>
              <p className="text-lg font-mono text-gray-800">{packing.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Packing Number</p>
              <p className="text-lg font-semibold text-blue-600">{packing.packing_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tanggal Packing</p>
              <p className="text-lg">{formatDate(packing.tanggal_packing)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="flex flex-col">
                <p className="text-lg font-semibold text-indigo-600">{packing.status?.status_name || 'Unknown'}</p>
                <p className="text-sm text-gray-500">({packing.status?.status_code})</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created At</p>
              <p className="text-lg">{formatDate(packing.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Updated At</p>
              <p className="text-lg">{formatDate(packing.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Purchase Order Information */}
        {packing.purchaseOrder && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Purchase Order</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">PO ID</p>
                <p className="text-lg font-mono text-gray-800">{packing.purchaseOrder.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">PO Number</p>
                <p className="text-lg font-semibold text-blue-600">{packing.purchaseOrder.po_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tanggal Order</p>
                <p className="text-lg">{formatDateOnly(packing.purchaseOrder.tanggal_order)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">PO Type</p>
                <p className="text-lg font-semibold text-green-600">{packing.purchaseOrder.po_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-lg">{packing.purchaseOrder.total_items}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer ID</p>
                <p className="text-lg font-mono text-gray-600">{packing.purchaseOrder.customerId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Surat Jalan</p>
                <p className="text-lg">{packing.purchaseOrder.suratJalan || 'Belum ada'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Invoice Pengiriman</p>
                <p className="text-lg">{packing.purchaseOrder.invoicePengiriman || 'Belum ada'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Surat PO</p>
                <p className="text-lg">{packing.purchaseOrder.suratPO || 'Belum ada'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Surat Penagihan</p>
                <p className="text-lg">{packing.purchaseOrder.suratPenagihan || 'Belum ada'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Supplier ID</p>
                <p className="text-lg">{packing.purchaseOrder.supplierId || 'Tidak ada'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">PO Created</p>
                <p className="text-lg">{formatDate(packing.purchaseOrder.createdAt)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Packing Items */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail Items Packing</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Barang</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jumlah Carton</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Isi/Carton</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No Box</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Inventory ID</th>
                </tr>
              </thead>
              <tbody>
                {packing.packingItems?.map((item, index) => (
                  <tr key={item.id} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{item.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{item.nama_barang}</td>
                    <td className="px-4 py-3 text-center font-semibold text-blue-600">{item.total_qty}</td>
                    <td className="px-4 py-3 text-center font-semibold text-green-600">{item.jumlah_carton}</td>
                    <td className="px-4 py-3 text-center">{item.isi_per_carton}</td>
                    <td className="px-4 py-3">{item.no_box || 'Tidak ada'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-purple-600">{item.status?.status_name}</span>
                        <span className="text-xs text-gray-500">({item.status?.status_code})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{item.inventoryId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Item Details */}
          {packing.packingItems && packing.packingItems.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Detail Status Items</h4>
              <div className="space-y-3">
                {packing.packingItems.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Item Created</p>
                        <p className="text-sm">{formatDate(item.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Item Updated</p>
                        <p className="text-sm">{formatDate(item.updatedAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status Description</p>
                        <p className="text-sm">{item.status?.status_description || 'No description'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status Created</p>
                        <p className="text-sm">{formatDate(item.status?.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status Information */}
        {packing.status && (
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail Status Packing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status ID</p>
                <p className="text-lg font-mono text-gray-800">{packing.status.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status Code</p>
                <p className="text-lg font-semibold text-indigo-600">{packing.status.status_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status Name</p>
                <p className="text-lg font-semibold text-green-600">{packing.status.status_name}</p>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-sm text-gray-500">Status Description</p>
                <p className="text-lg">{packing.status.status_description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status Created</p>
                <p className="text-lg">{formatDate(packing.status.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status Updated</p>
                <p className="text-lg">{formatDate(packing.status.updatedAt)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Tambahan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Updated By</p>
              <p className="text-lg font-mono text-gray-800">{packing.updatedBy}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Purchase Order ID</p>
              <p className="text-lg font-mono text-gray-800">{packing.purchaseOrderId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Packing Items</p>
              <p className="text-lg font-semibold text-blue-600">{packing.packingItems?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPackingModal;


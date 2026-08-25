import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import CheckingListForm from './CheckingListForm';

const CheckingListModal = ({
  isOpen,
  onClose,
  initialData = null,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const handleSuccess = (data) => {
    onSuccess?.(data);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const suratJalanList = Array.isArray(initialData?.suratJalan)
    ? initialData.suratJalan
    : initialData?.suratJalan
      ? [initialData.suratJalan]
      : [];

  const firstSj = suratJalanList[0];
  const poNumber = firstSj?.purchaseOrder?.po_number || firstSj?.po_number || initialData?.purchaseOrder?.po_number;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Checklist Surat Jalan
                </h3>
                {initialData && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {firstSj?.no_surat_jalan ? `Surat Jalan: ${firstSj.no_surat_jalan}` : ''}
                    {poNumber ? ` • PO: ${poNumber}` : ''}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <CheckingListForm
              initialValues={initialData}
              onSubmit={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckingListModal;

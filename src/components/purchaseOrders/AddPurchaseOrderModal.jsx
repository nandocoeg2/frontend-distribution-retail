import React, { useState, useEffect, useRef } from 'react';
import fileService from '../../services/fileService.js';
import PurchaseOrderForm from './PurchaseOrderForm.jsx';
import PurchaseOrderDetailsForm from './PurchaseOrderDetailsForm.jsx';
import { toast } from 'react-toastify';
import useStatuses from '../../hooks/useStatuses';
import { TabContainer, Tab, TabContent, TabPanel } from '../ui/Tabs.jsx';
import HeroIcon from '../atoms/HeroIcon.jsx';
import { useNavigate } from 'react-router-dom';

const AddPurchaseOrderModal = ({
  isOpen,
  onClose,
  onFinished,
  createPurchaseOrder,
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customerId: '',
    po_number: '',
    total_items: 1,
    tanggal_masuk_po: new Date().toISOString().split('T')[0],
    tanggal_batas_kirim: '',
    termin_bayar: '',
    po_type: 'SINGLE',
    status_code: 'PENDING PURCHASE ORDER',
    suratJalan: '',
    invoicePengiriman: '',
    suratPO: '',
    suratPenagihan: '',
  });

  const [purchaseOrderDetails, setPurchaseOrderDetails] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('manual');

  // Refs for file inputs
  const manualFileInputRef = useRef(null);
  const bulkFileInputRef = useRef(null);

  // Get purchase order statuses using hook
  const {
    purchaseOrderStatuses,
    loading: statusLoading,
    error: statusError,
    fetchPurchaseOrderStatuses,
  } = useStatuses();

  // Fetch purchase order statuses on component mount
  useEffect(() => {
    fetchPurchaseOrderStatuses();
  }, [fetchPurchaseOrderStatuses]);

  useEffect(() => {
    if (isOpen) {
      // Reset everything when modal opens
      setActiveTab('manual');
      resetForm();
    } else {
      // Clear everything when modal closes
      setActiveTab('manual');
      setError(null);
      setSelectedFile(null);
      setLoading(false);
    }
  }, [isOpen]);

  // Additional effect to ensure state is cleared when tab changes
  useEffect(() => {
    if (isOpen) {
      console.log(`Active tab changed to: ${activeTab}`);
      // Force clear selected file when tab changes to prevent cross-tab contamination
      setSelectedFile(null);
    }
  }, [activeTab, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleFileChange = (e) => {
    setError(null);
    const files = e.target.files;
    if (activeTab === 'bulk') {
      if (!files || files.length === 0) {
        setSelectedFile(null);
        return;
      }
      const allPdf = Array.from(files).every((file) =>
        file.name.toLowerCase().endsWith('.pdf')
      );
      if (!allPdf) {
        setError('Please select PDF files only.');
        setSelectedFile(null);
        if (bulkFileInputRef.current) {
          bulkFileInputRef.current.value = '';
        }
        return;
      }
      setSelectedFile(files);
    } else {
      setSelectedFile(files && files.length > 0 ? files[0] : null);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile || selectedFile.length === 0) {
      setError('Please select a PDF (.pdf) file to upload.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fileService.uploadBulkPurchaseOrders(selectedFile);
      if (result.success) {
        toast.success(result.data.message || 'File uploaded successfully!');
        setSelectedFile(null);
        if (bulkFileInputRef.current) {
          bulkFileInputRef.current.value = '';
        }
        if (onFinished) onFinished();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to upload bulk files';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId || !formData.po_number) {
      setError('Please fill in all required fields.');
      return;
    }

    // Validate purchase order details if PO type is SINGLE
    if (formData.po_type === 'SINGLE' && purchaseOrderDetails.length === 0) {
      setError(
        'Please add at least one purchase order detail for SINGLE type.'
      );
      return;
    }

    // Validate each detail
    for (let i = 0; i < purchaseOrderDetails.length; i++) {
      const detail = purchaseOrderDetails[i];
      if (
        !detail.plu ||
        !detail.nama_barang ||
        !detail.quantity ||
        !detail.isi ||
        !detail.harga ||
        !detail.harga_netto
      ) {
        setError(`Please fill in all required fields for detail #${i + 1}.`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    // Prepare data for API
    const submitData = {
      ...formData,
      purchaseOrderDetails:
        formData.po_type === 'SINGLE'
          ? JSON.stringify(purchaseOrderDetails)
          : undefined,
    };

    const newOrder = await createPurchaseOrder(submitData, selectedFile || []);
    setLoading(false);
    if (newOrder) {
      if (onFinished) onFinished();
    } else {
      setError(
        'Failed to create purchase order. Please check the form and try again.'
      );
    }
  };

  const resetForm = () => {
    console.log('Resetting form and clearing all states...');

    // Reset form data to initial values
    setFormData({
      customerId: '',
      po_number: '',
      total_items: 1,
      tanggal_masuk_po: new Date().toISOString().split('T')[0],
      tanggal_batas_kirim: '',
      termin_bayar: '',
      po_type: 'SINGLE',
      status_code: 'PENDING PURCHASE ORDER',
      suratJalan: '',
      invoicePengiriman: '',
      suratPO: '',
      suratPenagihan: '',
    });

    // Clear purchase order details
    setPurchaseOrderDetails([]);

    // Clear all component states
    setError(null);
    setSelectedFile(null);
    setLoading(false);

    // Clear file input elements using refs to ensure UI is also cleared
    if (manualFileInputRef.current) {
      manualFileInputRef.current.value = '';
      console.log('Cleared manual file input');
    }
    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = '';
      console.log('Cleared bulk file input');
    }

    console.log('Form reset completed');
  };

  const generatePONumber = () => {
    const today = new Date();
    const poNumber = `PO-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${Math.floor(
      Math.random() * 1000
    )
      .toString()
      .padStart(3, '0')}`;
    setFormData((prev) => ({ ...prev, po_number: poNumber }));
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75'>
      <div className='bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-medium text-gray-900'>
            Add New Purchase Order
          </h3>
          <button
            type='button'
            onClick={onClose}
            className='text-gray-400 hover:text-gray-500'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className='p-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded-md'>
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <TabContainer
          activeTab={activeTab}
          onTabChange={(tabId) => {
            console.log(`Switching from ${activeTab} to ${tabId}`);
            setActiveTab(tabId);
            resetForm();
          }}
          variant='underline'
          className='mb-6'
        >
          <Tab
            id='manual'
            label='Manual Input'
            icon={
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                />
              </svg>
            }
          />
          <Tab
            id='bulk'
            label='Bulk Upload'
            icon={
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10'
                />
              </svg>
            }
          />
        </TabContainer>

        {/* Tab Content */}
        <TabContent activeTab={activeTab}>
          <TabPanel tabId='manual'>
            <div className='manual-input-tab'>
              <form onSubmit={handleSubmit}>
                <div className='mb-4'>
                  <label className='block mb-1 text-sm font-medium text-gray-700'>
                    Purchase Order Document (Optional)
                  </label>
                  <div className='flex items-center space-x-2'>
                    <input
                      ref={manualFileInputRef}
                      type='file'
                      onChange={handleFileChange}
                      className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                    />
                  </div>
                  {selectedFile && (
                    <div className='p-3 mt-2 border rounded-md bg-gray-50'>
                      <p className='mb-2 text-sm text-gray-600'>
                        File dipilih:
                      </p>
                      <div className='flex items-center space-x-2 text-sm'>
                        <svg
                          className='flex-shrink-0 w-4 h-4 text-blue-500'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                          />
                        </svg>
                        <span
                          className='text-gray-700 truncate'
                          title={selectedFile.name}
                        >
                          {selectedFile.name}
                        </span>
                        <span className='text-xs text-gray-500'>
                          ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <hr className='my-4' />
                <PurchaseOrderForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                  onGeneratePONumber={generatePONumber}
                  purchaseOrderDetails={purchaseOrderDetails}
                />

                {/* Purchase Order Details - Only show for SINGLE type */}
                {formData.po_type === 'SINGLE' && (
                  <>
                    <hr className='my-6' />
                    <PurchaseOrderDetailsForm
                      details={purchaseOrderDetails}
                      onDetailsChange={setPurchaseOrderDetails}
                      onRemoveDetail={(index) => {
                        const updatedDetails = purchaseOrderDetails.filter(
                          (_, i) => i !== index
                        );
                        setPurchaseOrderDetails(updatedDetails);
                      }}
                      onAddDetail={(newDetail) => {
                        setPurchaseOrderDetails([
                          ...purchaseOrderDetails,
                          newDetail,
                        ]);
                      }}
                    />
                  </>
                )}
                <div className='flex justify-end mt-6 space-x-3'>
                  <button
                    type='button'
                    onClick={onClose}
                    className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50'
                    disabled={
                      loading ||
                      !formData.customerId ||
                      !formData.po_number ||
                      (formData.po_type === 'SINGLE' &&
                        purchaseOrderDetails.length === 0)
                    }
                  >
                    {loading ? 'Creating...' : 'Add Purchase Order'}
                  </button>
                </div>
              </form>
            </div>
          </TabPanel>

          <TabPanel tabId='bulk'>
            <div className='bulk-upload-tab'>
              {/* History Upload Bulk Button */}
              <div className='p-4 mb-4 border border-blue-200 rounded-md bg-blue-50'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <svg
                      className='w-4 h-4 text-blue-500 mt-0.5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    <div>
                      <h4 className='text-sm font-medium text-blue-800'>
                        Riwayat Upload Bulk
                      </h4>
                      <p className='text-sm text-blue-700'>
                        Lihat history upload bulk sebelumnya
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/po/purchase-orders/bulk-history')}
                    className='inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors'
                  >
                    <HeroIcon name='clock' className='w-4 h-4 mr-1' />
                    Lihat History
                  </button>
                </div>
              </div>

              <div className='space-y-4'>
                <div>
                  <label className='block mb-1 text-sm font-medium text-gray-700'>
                    Upload Bulk Purchase Orders (PDF)
                  </label>
                  <div className='flex items-center space-x-2'>
                    <input
                      ref={bulkFileInputRef}
                      type='file'
                      onChange={handleFileChange}
                      accept='.pdf'
                      className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                    />
                  </div>
                  {selectedFile && selectedFile.length > 0 && (
                    <div className='p-3 mt-2 border rounded-md bg-gray-50'>
                      <p className='mb-2 text-sm text-gray-600'>
                        <strong>{selectedFile.length}</strong> file PDF dipilih
                        untuk upload:
                      </p>
                      <div className='space-y-1'>
                        {Array.from(selectedFile).map((file, index) => (
                          <div
                            key={index}
                            className='flex items-center space-x-2 text-sm'
                          >
                            <svg
                              className='flex-shrink-0 w-4 h-4 text-blue-500'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                              />
                            </svg>
                            <span
                              className='text-gray-700 truncate'
                              title={file.name}
                            >
                              {file.name}
                            </span>
                            <span className='text-xs text-gray-500'>
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className='p-3 border border-yellow-200 rounded-md bg-yellow-50'>
                  <div className='flex'>
                    <svg
                      className='w-4 h-4 text-yellow-500 mt-0.5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                      />
                    </svg>
                    <div>
                      <h4 className='text-sm font-medium text-yellow-800'>
                        Format File yang Didukung
                      </h4>
                      <p className='mt-1 text-sm text-yellow-700'>PDF (.pdf)</p>
                    </div>
                  </div>
                </div>

                <div className='flex justify-end mt-6 space-x-3'>
                  <button
                    type='button'
                    onClick={onClose}
                    className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type='button'
                    onClick={handleBulkUpload}
                    className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50'
                    disabled={!selectedFile || loading}
                  >
                    {loading ? 'Uploading...' : 'Upload File'}
                  </button>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabContent>
      </div>
    </div>
  );
};

export default AddPurchaseOrderModal;

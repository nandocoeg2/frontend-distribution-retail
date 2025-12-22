import React, { useState, useEffect, useRef } from 'react';
import fileService from '../../services/fileService.js';
import authService from '../../services/authService.js';
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
  const [activeTab, setActiveTab] = useState('bulk');
  const [uploadMode, setUploadMode] = useState('files');
  const [processingMethod, setProcessingMethod] = useState('text-extraction');

  // Refs for file inputs
  const manualFileInputRef = useRef(null);
  const bulkFileInputRef = useRef(null);
  const folderInputRef = useRef(null);

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
      setActiveTab('bulk');
      resetForm();
    } else {
      // Clear everything when modal closes
      setActiveTab('bulk');
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
      setUploadMode('files');
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
      const allowedExtensions = ['.pdf', '.edi'];

      // Filter files based on allowed extensions
      const filteredFiles = Array.from(files).filter((file) =>
        allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
      );

      // If in folder mode, automatically filter and allow upload
      if (uploadMode === 'folder') {
        if (filteredFiles.length === 0) {
          setError('No PDF (.pdf) or EDI (.edi) files found in the selected folder.');
          setSelectedFile(null);
          if (folderInputRef.current) {
            folderInputRef.current.value = '';
          }
          return;
        }
        // Create a new FileList-like object with filtered files
        const dataTransfer = new DataTransfer();
        filteredFiles.forEach(file => dataTransfer.items.add(file));
        setSelectedFile(dataTransfer.files);
      } else {
        // In files mode, all files must be valid
        const allAllowed = Array.from(files).every((file) =>
          allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
        );
        if (!allAllowed) {
          setError('Please select PDF (.pdf) or EDI (.edi) files only.');
          setSelectedFile(null);
          if (bulkFileInputRef.current) {
            bulkFileInputRef.current.value = '';
          }
          return;
        }
        setSelectedFile(files);
      }
    } else {
      setSelectedFile(files && files.length > 0 ? files[0] : null);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile || selectedFile.length === 0) {
      setError('Please select at least one PDF (.pdf) or EDI (.edi) file to upload.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Get user's selected company from authService
      const companyId = authService.getCompanyData()?.id;

      // Use selected processing method
      const result = processingMethod === 'ai'
        ? await fileService.uploadBulkPurchaseOrders(selectedFile, companyId)
        : await fileService.uploadBulkPurchaseOrdersTextExtraction(selectedFile, companyId);

      if (result.success) {
        const methodLabel = processingMethod === 'ai' ? 'AI' : 'Text Extraction';
        const data = result.data?.data || result.data;
        const totalFiles = data?.totalFiles || selectedFile.length;

        // Show info toast (blue) for background processing
        toast.info(
          `${totalFiles} file sedang diproses di background (${methodLabel}). Anda akan menerima notifikasi saat selesai.`,
          { autoClose: 5000 }
        );

        // Clear inputs
        setSelectedFile(null);
        if (bulkFileInputRef.current) {
          bulkFileInputRef.current.value = '';
        }
        if (folderInputRef.current) {
          folderInputRef.current.value = '';
        }

        // Close modal and notify parent
        onClose();
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
        !detail.harga ||
        !detail.harga_netto
      ) {
        setError(`Please fill in all required fields for detail #${i + 1}.`);
        return;
      }

      // Validate that at least one quantity is provided
      if ((detail.quantity_pcs || 0) === 0 && (detail.quantity_carton || 0) === 0) {
        setError(`Detail #${i + 1}: Must order at least 1 carton or 1 pcs.`);
        return;
      }

      // Validate qty_per_carton
      if (!detail.qty_per_carton || detail.qty_per_carton < 1) {
        setError(`Detail #${i + 1}: Qty per carton must be at least 1.`);
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
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
      console.log('Cleared folder input');
    }
    setUploadMode('files');

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
                      customerId={formData.customerId}
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
                  <label className='block mb-2 text-sm font-medium text-gray-700'>
                    Upload Bulk Purchase Orders (PDF / EDI)
                  </label>

                  {/* Processing Method Selection */}
                  <div className='mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md'>
                    <label className='block mb-2 text-sm font-medium text-gray-700'>
                      Processing Method
                    </label>
                    <div className='flex items-start space-x-6'>
                      <label className='flex items-start space-x-2 cursor-pointer'>
                        <input
                          type='radio'
                          name='processingMethod'
                          value='text-extraction'
                          checked={processingMethod === 'text-extraction'}
                          onChange={(e) => setProcessingMethod(e.target.value)}
                          className='w-4 h-4 text-blue-600 mt-0.5'
                        />
                        <div>
                          <span className='text-sm font-medium text-gray-700'>Normal Method</span>
                        </div>
                      </label>
                      <label className='flex items-start space-x-2 cursor-pointer'>
                        <input
                          type='radio'
                          name='processingMethod'
                          value='ai'
                          checked={processingMethod === 'ai'}
                          onChange={(e) => setProcessingMethod(e.target.value)}
                          className='w-4 h-4 text-blue-600 mt-0.5'
                        />
                        <div>
                          <span className='text-sm font-medium text-gray-700'>AI Method</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Upload Mode Selection */}
                  <div className='flex items-center space-x-6 mb-3 p-3 bg-gray-50 border border-gray-200 rounded-md'>
                    <label className='flex items-center space-x-2 cursor-pointer'>
                      <input
                        type='radio'
                        name='uploadMode'
                        value='files'
                        checked={uploadMode === 'files'}
                        onChange={(e) => {
                          setUploadMode(e.target.value);
                          setSelectedFile(null);
                          if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
                          if (folderInputRef.current) folderInputRef.current.value = '';
                        }}
                        className='w-4 h-4 text-blue-600'
                      />
                      <span className='text-sm text-gray-700'>Upload Files</span>
                    </label>
                    <label className='flex items-center space-x-2 cursor-pointer'>
                      <input
                        type='radio'
                        name='uploadMode'
                        value='folder'
                        checked={uploadMode === 'folder'}
                        onChange={(e) => {
                          setUploadMode(e.target.value);
                          setSelectedFile(null);
                          if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
                          if (folderInputRef.current) folderInputRef.current.value = '';
                        }}
                        className='w-4 h-4 text-blue-600'
                      />
                      <span className='text-sm text-gray-700'>Upload Folder</span>
                    </label>
                  </div>

                  {/* File Input */}
                  {uploadMode === 'files' && (
                    <div className='flex items-center space-x-2'>
                      <input
                        ref={bulkFileInputRef}
                        type='file'
                        multiple
                        onChange={handleFileChange}
                        accept='.pdf,.edi'
                        className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                      />
                    </div>
                  )}

                  {/* Folder Input */}
                  {uploadMode === 'folder' && (
                    <div className='flex items-center space-x-2'>
                      <input
                        ref={folderInputRef}
                        type='file'
                        webkitdirectory=''
                        directory=''
                        multiple
                        onChange={handleFileChange}
                        className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100'
                      />
                    </div>
                  )}
                </div>

                <div className='p-3 border border-yellow-200 rounded-md bg-yellow-50'>
                  <div className='flex'>
                    <svg
                      className='w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0'
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
                        Informasi Upload
                      </h4>
                      <p className='mt-1 text-sm text-yellow-700'>
                        <strong>Upload Files:</strong> Pilih satu atau beberapa file PDF (.pdf) atau EDI (.edi)
                      </p>
                      <p className='mt-1 text-sm text-yellow-700'>
                        <strong>Upload Folder:</strong> Pilih folder yang berisi file PDF/EDI. Hanya file dengan ekstensi .pdf dan .edi yang akan diupload.
                      </p>
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

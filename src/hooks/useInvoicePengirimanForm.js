import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';

const buildInitialFormState = () => ({
  no_invoice: '',
  deliver_to: '',
  sub_total: 0,
  total_discount: 0,
  total_price: 0,
  ppn_percentage: 11,
  ppn_rupiah: 0,
  grand_total: 0,
  expired_date: '',
  TOP: '',
  type: 'PENGIRIMAN',
  statusPembayaranId: null,
  purchaseOrderId: null,
  invoiceDetails: []
});

const useInvoicePengirimanForm = () => {
  const [formData, setFormData] = useState(buildInitialFormState());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Sesi berakhir. Silakan login kembali.');
  }, [navigate]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.no_invoice.trim()) {
      newErrors.no_invoice = 'Nomor invoice harus diisi';
    }

    if (!formData.deliver_to.trim()) {
      newErrors.deliver_to = 'Alamat tujuan harus diisi';
    }

    if (formData.sub_total <= 0) {
      newErrors.sub_total = 'Sub total harus lebih dari 0';
    }

    if (formData.total_discount < 0) {
      newErrors.total_discount = 'Total diskon tidak boleh negatif';
    }

    if (formData.total_price <= 0) {
      newErrors.total_price = 'Total harga harus lebih dari 0';
    }

    if (formData.ppn_percentage < 0) {
      newErrors.ppn_percentage = 'PPN (%) tidak boleh negatif';
    }

    if (formData.ppn_rupiah < 0) {
      newErrors.ppn_rupiah = 'PPN (Rp) tidak boleh negatif';
    }

    if (formData.grand_total <= 0) {
      newErrors.grand_total = 'Grand total harus lebih dari 0';
    }

    if (formData.invoiceDetails.length === 0) {
      newErrors.invoiceDetails = 'Minimal harus ada satu detail invoice pengiriman';
    }

    formData.invoiceDetails.forEach((detail, index) => {
      if (!detail.nama_barang?.trim()) {
        newErrors[invoiceDetails..nama_barang] = 'Nama barang harus diisi';
      }
      if (!detail.PLU?.trim()) {
        newErrors[invoiceDetails..PLU] = 'PLU harus diisi';
      }
      if (!detail.quantity || detail.quantity <= 0) {
        newErrors[invoiceDetails..quantity] = 'Quantity harus lebih dari 0';
      }
      if (!detail.satuan?.trim()) {
        newErrors[invoiceDetails..satuan] = 'Satuan harus diisi';
      }
      if (!detail.harga || detail.harga <= 0) {
        newErrors[invoiceDetails..harga] = 'Harga harus lebih dari 0';
      }
      if (!detail.total || detail.total <= 0) {
        newErrors[invoiceDetails..total] = 'Total harus lebih dari 0';
      }
      if (detail.discount_percentage < 0) {
        newErrors[invoiceDetails..discount_percentage] = 'Diskon (%) tidak boleh negatif';
      }
      if (detail.discount_rupiah < 0) {
        newErrors[invoiceDetails..discount_rupiah] = 'Diskon (Rp) tidak boleh negatif';
      }
      if (detail.PPN_pecentage < 0) {
        newErrors[invoiceDetails..PPN_pecentage] = 'PPN (%) tidak boleh negatif';
      }
      if (detail.ppn_rupiah < 0) {
        newErrors[invoiceDetails..ppn_rupiah] = 'PPN (Rp) tidak boleh negatif';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [errors]);

  const handleDetailChange = useCallback((index, field, value) => {
    setFormData(prev => ({
      ...prev,
      invoiceDetails: prev.invoiceDetails.map((detail, i) => (
        i === index
          ? {
              ...detail,
              [field]: value
            }
          : detail
      ))
    }));

    const errorKey = invoiceDetails..;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  }, [errors]);

  const addInvoiceDetail = useCallback(() => {
    const newDetail = {
      nama_barang: '',
      PLU: '',
      quantity: 1,
      satuan: '',
      harga: 0,
      total: 0,
      discount_percentage: 0,
      discount_rupiah: 0,
      PPN_pecentage: 11,
      ppn_rupiah: 0
    };

    setFormData(prev => ({
      ...prev,
      invoiceDetails: [...prev.invoiceDetails, newDetail]
    }));
  }, []);

  const removeInvoiceDetail = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      invoiceDetails: prev.invoiceDetails.filter((_, i) => i !== index)
    }));
  }, []);

  const calculateTotals = useCallback(() => {
    const subTotal = formData.invoiceDetails.reduce((sum, detail) => sum + (detail.total || 0), 0);
    const totalDiscount = formData.invoiceDetails.reduce((sum, detail) => sum + (detail.discount_rupiah || 0), 0);
    const totalPrice = subTotal - totalDiscount;
    const ppnRupiah = Math.round(totalPrice * (formData.ppn_percentage / 100));
    const grandTotal = totalPrice + ppnRupiah;

    setFormData(prev => ({
      ...prev,
      sub_total: subTotal,
      total_discount: totalDiscount,
      total_price: totalPrice,
      ppn_rupiah: ppnRupiah,
      grand_total: grandTotal
    }));
  }, [formData.invoiceDetails, formData.ppn_percentage]);

  const calculateDetailTotal = useCallback((detail) => {
    const quantity = detail.quantity || 0;
    const harga = detail.harga || 0;
    const discountRupiah = detail.discount_rupiah || 0;
    const ppnRupiah = detail.ppn_rupiah || 0;

    return (quantity * harga) - discountRupiah + ppnRupiah;
  }, []);

  const resetForm = useCallback(() => {
    setFormData(buildInitialFormState());
    setErrors({});
  }, []);

  const loadInvoiceData = useCallback((invoice) => {
    setFormData({
      no_invoice: invoice.no_invoice || '',
      deliver_to: invoice.deliver_to || '',
      sub_total: invoice.sub_total || 0,
      total_discount: invoice.total_discount || 0,
      total_price: invoice.total_price || 0,
      ppn_percentage: invoice.ppn_percentage || 11,
      ppn_rupiah: invoice.ppn_rupiah || 0,
      grand_total: invoice.grand_total || 0,
      expired_date: invoice.expired_date ? invoice.expired_date.split('T')[0] : '',
      TOP: invoice.TOP || '',
      type: invoice.type || 'PENGIRIMAN',
      statusPembayaranId: invoice.statusPembayaranId || null,
      purchaseOrderId: invoice.purchaseOrderId || null,
      invoiceDetails: invoice.invoiceDetails || []
    });
    setErrors({});
  }, []);

  return {
    formData,
    setFormData,
    loading,
    setLoading,
    errors,
    setErrors,
    validateForm,
    handleInputChange,
    handleDetailChange,
    addInvoiceDetail,
    removeInvoiceDetail,
    calculateTotals,
    calculateDetailTotal,
    resetForm,
    loadInvoiceData,
    handleAuthError
  };
};

export default useInvoicePengirimanForm;

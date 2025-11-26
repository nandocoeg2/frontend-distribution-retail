import { get } from './apiService';

class StatusService {
  /**
   * Get all statuses
   */
  async getAllStatuses() {
    try {
      const response = await get('/statuses');
      return response;
    } catch (error) {
      console.error('Error fetching all statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for purchase order
   */
  async getPurchaseOrderStatuses() {
    try {
      const response = await get('/statuses/purchase_order');
      return response;
    } catch (error) {
      console.error('Error fetching purchase order statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for bulk file
   */
  async getBulkFileStatuses() {
    try {
      const response = await get('/statuses/bulk_file');
      return response;
    } catch (error) {
      console.error('Error fetching bulk file statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for packing
   */
  async getPackingStatuses() {
    try {
      const response = await get('/statuses/packing');
      return response;
    } catch (error) {
      console.error('Error fetching packing statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for invoice
   */
  async getInvoiceStatuses() {
    try {
      const response = await get('/statuses/invoice-penagihan');
      return response;
    } catch (error) {
      console.error('Error fetching invoice statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for surat jalan
   */
  async getSuratJalanStatuses() {
    try {
      const response = await get('/statuses/surat_jalan');
      return response;
    } catch (error) {
      console.error('Error fetching surat jalan statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for packing item
   */
  async getPackingItemStatuses() {
    try {
      const response = await get('/statuses/packing_item');
      return response;
    } catch (error) {
      console.error('Error fetching packing item statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for laporan penerimaan barang
   */
  async getLaporanPenerimaanBarangStatuses() {
    try {
      const response = await get('/statuses/laporan_penerimaan_barang');
      return response;
    } catch (error) {
      console.error('Error fetching laporan penerimaan barang statuses:', error);
      throw error;
    }
  }

  /**
   * Get all status categories
   */
  async getCategories() {
    try {
      const response = await get('/statuses/categories');
      return response;
    } catch (error) {
      console.error('Error fetching status categories:', error);
      throw error;
    }
  }

  /**
   * Get statuses by category (dynamic)
   */
  async getStatusesByCategory(category) {
    try {
      const response = await get(`/statuses/category/${encodeURIComponent(category)}`);
      return response;
    } catch (error) {
      console.error(`Error fetching statuses for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get all statuses for bulk purchase order
   */
  async getBulkPurchaseOrderStatuses() {
    try {
      const response = await get('/statuses/bulk-purchase-order');
      return response;
    } catch (error) {
      console.error('Error fetching bulk purchase order statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for checklist surat jalan
   */
  async getChecklistSuratJalanStatuses() {
    try {
      const response = await get('/statuses/checklist-surat-jalan');
      return response;
    } catch (error) {
      console.error('Error fetching checklist surat jalan statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for invoice pengiriman
   */
  async getInvoicePengirimanStatuses() {
    try {
      const response = await get('/statuses/invoice_pengiriman');
      return response;
    } catch (error) {
      console.error('Error fetching invoice pengiriman statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for kwitansi
   */
  async getKwitansiStatuses() {
    try {
      const response = await get('/statuses/kwitansi');
      return response;
    } catch (error) {
      console.error('Error fetching kwitansi statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for faktur pajak
   */
  async getFakturPajakStatuses() {
    try {
      const response = await get('/statuses/faktur-pajak');
      return response;
    } catch (error) {
      console.error('Error fetching faktur pajak statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for tanda terima faktur
   */
  async getTandaTerimaFakturStatuses() {
    try {
      const response = await get('/statuses/tanda-terima-faktur');
      return response;
    } catch (error) {
      console.error('Error fetching tanda terima faktur statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for bulk laporan penerimaan barang
   */
  async getBulkLaporanPenerimaanBarangStatuses() {
    try {
      const response = await get('/statuses/bulk-laporan-penerimaan-barang');
      return response;
    } catch (error) {
      console.error('Error fetching bulk laporan penerimaan barang statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for bulk item
   */
  async getBulkItemStatuses() {
    try {
      const response = await get('/statuses/bulk-item');
      return response;
    } catch (error) {
      console.error('Error fetching bulk item statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for bulk group customer
   */
  async getBulkGroupCustomerStatuses() {
    try {
      const response = await get('/statuses/bulk-group-customer');
      return response;
    } catch (error) {
      console.error('Error fetching bulk group customer statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for bulk customer
   */
  async getBulkCustomerStatuses() {
    try {
      const response = await get('/statuses/bulk-customer');
      return response;
    } catch (error) {
      console.error('Error fetching bulk customer statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for bulk region
   */
  async getBulkRegionStatuses() {
    try {
      const response = await get('/statuses/bulk-region');
      return response;
    } catch (error) {
      console.error('Error fetching bulk region statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for bulk term of payment
   */
  async getBulkTermOfPaymentStatuses() {
    try {
      const response = await get('/statuses/bulk-term-of-payment');
      return response;
    } catch (error) {
      console.error('Error fetching bulk term of payment statuses:', error);
      throw error;
    }
  }

  /**
   * Get all statuses for bulk supplier
   */
  async getBulkSupplierStatuses() {
    try {
      const response = await get('/statuses/bulk-supplier');
      return response;
    } catch (error) {
      console.error('Error fetching bulk supplier statuses:', error);
      throw error;
    }
  }
}

export default new StatusService();

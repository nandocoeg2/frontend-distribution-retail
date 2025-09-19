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
      const response = await get('/statuses/invoice');
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
}

export default new StatusService();
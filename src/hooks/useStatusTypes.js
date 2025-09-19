import statusService from '../services/statusService';
import useStatus from './useStatus';

/**
 * Hook for managing purchase order statuses
 */
export const usePurchaseOrderStatuses = () =>
  useStatus(statusService.getPurchaseOrderStatuses, 'purchase order');

/**
 * Hook for managing packing statuses
 */
export const usePackingStatuses = () =>
  useStatus(statusService.getPackingStatuses, 'packing');

/**
 * Hook for managing invoice statuses
 */
export const useInvoiceStatuses = () =>
  useStatus(statusService.getInvoiceStatuses, 'invoice');

/**
 * Hook for managing surat jalan statuses
 */
export const useSuratJalanStatuses = () =>
  useStatus(statusService.getSuratJalanStatuses, 'surat jalan');

/**
 * Hook for managing bulk file statuses
 */
export const useBulkFileStatuses = () =>
  useStatus(statusService.getBulkFileStatuses, 'bulk file');
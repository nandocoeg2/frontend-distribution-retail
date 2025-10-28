import { useMutation, useQueryClient } from '@tanstack/react-query';
import laporanPenerimaanBarangService from '../services/laporanPenerimaanBarangService';
import toastService from '../services/toastService';

const useLaporanPenerimaanBarangOperations = () => {
  const queryClient = useQueryClient();

  const assignMutation = useMutation({
    mutationFn: ({ lpbId, purchaseOrderId }) =>
      laporanPenerimaanBarangService.assignPurchaseOrder(lpbId, purchaseOrderId),
    onSuccess: () => {
      // Invalidate and refetch all laporan penerimaan barang queries
      queryClient.invalidateQueries({ queryKey: ['laporanPenerimaanBarang'] });
      toastService.success('Purchase Order berhasil di-assign ke LPB');
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        'Gagal meng-assign Purchase Order';
      toastService.error(errorMessage);
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (lpbId) =>
      laporanPenerimaanBarangService.unassignPurchaseOrder(lpbId),
    onSuccess: () => {
      // Invalidate and refetch all laporan penerimaan barang queries
      queryClient.invalidateQueries({ queryKey: ['laporanPenerimaanBarang'] });
      toastService.success('Purchase Order berhasil di-unassign dari LPB');
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        'Gagal meng-unassign Purchase Order';
      toastService.error(errorMessage);
    },
  });

  const assignPurchaseOrder = async (lpbId, purchaseOrderId) => {
    return assignMutation.mutateAsync({ lpbId, purchaseOrderId });
  };

  const unassignPurchaseOrder = async (lpbId) => {
    return unassignMutation.mutateAsync(lpbId);
  };

  return {
    isAssigning: assignMutation.isLoading,
    isUnassigning: unassignMutation.isLoading,
    assignPurchaseOrder,
    unassignPurchaseOrder,
  };
};

export default useLaporanPenerimaanBarangOperations;


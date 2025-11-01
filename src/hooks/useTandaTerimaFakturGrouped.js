import { useQuery, useQueryClient } from '@tanstack/react-query';
import tandaTerimaFakturService from '@/services/tandaTerimaFakturService';

export const useTandaTerimaFakturGrouped = (params = {}) => {
  return useQuery({
    queryKey: ['tandaTerimaFaktur', 'grouped', params],
    queryFn: async () => {
      const response = await tandaTerimaFakturService.getGrouped(params);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useTandaTerimaFakturGroupedDetail = (
  groupCustomerId,
  params = {}
) => {
  return useQuery({
    queryKey: ['tandaTerimaFaktur', 'groupedDetail', groupCustomerId, params],
    queryFn: async () => {
      if (!groupCustomerId) return null;
      const response = await tandaTerimaFakturService.getGroupedDetail(
        groupCustomerId,
        params
      );
      return response.data || null;
    },
    enabled: !!groupCustomerId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export default useTandaTerimaFakturGrouped;

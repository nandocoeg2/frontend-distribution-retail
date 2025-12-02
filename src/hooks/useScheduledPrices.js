import { useQuery } from '@tanstack/react-query';
import scheduledPriceService from '../services/scheduledPriceService';

export const useScheduledPrices = (params = {}) => {
  return useQuery({
    queryKey: ['scheduled-prices', params],
    queryFn: async () => {
      const response = await scheduledPriceService.getAllSchedules(params);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });
};

export const useScheduledPrice = (id) => {
  return useQuery({
    queryKey: ['scheduled-price', id],
    queryFn: async () => {
      const response = await scheduledPriceService.getScheduleById(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useScheduledPricesByItemPrice = (itemPriceId) => {
  return useQuery({
    queryKey: ['scheduled-prices-by-item', itemPriceId],
    queryFn: async () => {
      const response = await scheduledPriceService.getSchedulesByItemPrice(itemPriceId);
      return response.data;
    },
    enabled: !!itemPriceId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useEffectivePrice = (itemId, date, customerId = null, enabled = true) => {
  return useQuery({
    queryKey: ['effective-price', itemId, date, customerId],
    queryFn: async () => {
      if (!itemId || !date) return null;
      
      const response = await scheduledPriceService.getEffectivePrice(itemId, date, customerId);
      return response.data;
    },
    enabled: enabled && !!itemId && !!date,
    staleTime: 0, // Always fetch fresh data for pricing
    retry: false, // Don't retry if no schedule exists
  });
};

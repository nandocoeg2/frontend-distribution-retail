import { useEffect } from 'react';
import { useEffectivePrice } from './useScheduledPrices';
import toastService from '../services/toastService';
import { formatDate } from '../utils/formatUtils';

/**
 * Custom hook to fetch and apply effective price for PO based on item and date
 * @param {string} itemId - The item ID
 * @param {Date|string} poDate - The PO date
 * @param {Function} onPriceLoad - Callback function to update form with price data
 * @param {boolean} enabled - Whether the hook should fetch data
 * @returns {Object} - { effectivePrice, isLoading, isScheduledPrice }
 */
export const useEffectivePriceForPO = (itemId, poDate, onPriceLoad, enabled = true) => {
  const { data: effectivePrice, isLoading } = useEffectivePrice(
    itemId,
    poDate,
    enabled && !!itemId && !!poDate
  );

  const isScheduledPrice = effectivePrice?.source === 'scheduled';

  useEffect(() => {
    if (effectivePrice && onPriceLoad) {
      // Call the callback with the price data
      onPriceLoad({
        harga: effectivePrice.harga,
        pot1: effectivePrice.pot1,
        harga1: effectivePrice.harga1,
        pot2: effectivePrice.pot2,
        harga2: effectivePrice.harga2,
        ppn: effectivePrice.ppn,
        isScheduled: isScheduledPrice
      });

      // Show notification if using scheduled price
      if (isScheduledPrice) {
        toastService.info(
          `Using scheduled price for ${formatDate(poDate)}`,
          {
            autoClose: 3000
          }
        );
      }
    }
  }, [effectivePrice, onPriceLoad, isScheduledPrice, poDate]);

  return {
    effectivePrice,
    isLoading,
    isScheduledPrice
  };
};

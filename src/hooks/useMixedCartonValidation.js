import { useState, useEffect, useCallback } from 'react';
import { getItemById } from '../services/itemService';

/**
 * Hook for managing mixed carton validation and compatibility checks
 */
const useMixedCartonValidation = () => {
  const [itemRelationships, setItemRelationships] = useState(new Map());
  const [loading, setLoading] = useState(false);

  /**
   * Load relationships for a single item
   */
  const loadItemRelationships = useCallback(async (itemId) => {
    if (!itemId || itemRelationships.has(itemId)) {
      return itemRelationships.get(itemId) || [];
    }

    try {
      const response = await getItemById(itemId);
      const item = response.data;
      
      // Extract IDs of items this item can be mixed with
      const mixedIds = item.mixedWithItems?.map(rel => rel.mixedWithItemId) || [];
      
      setItemRelationships(prev => {
        const updated = new Map(prev);
        updated.set(itemId, {
          allowMixed: item.allow_mixed_carton || false,
          mixedWithItemIds: mixedIds,
          itemName: item.nama_barang,
          plu: item.plu
        });
        return updated;
      });

      return mixedIds;
    } catch (error) {
      console.error('Failed to load item relationships:', error);
      return [];
    }
  }, [itemRelationships]);

  /**
   * Load relationships for multiple items
   */
  const loadItemsRelationships = useCallback(async (itemIds) => {
    if (!itemIds || itemIds.length === 0) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      await Promise.all(itemIds.map(id => loadItemRelationships(id)));
    } catch (error) {
      console.error('Failed to load items relationships:', error);
    } finally {
      setLoading(false);
    }
  }, [loadItemRelationships]);

  /**
   * Check if a new item can be added to a box with existing items
   * Returns { canAdd: boolean, reason: string }
   */
  const canAddItemToBox = useCallback((newItemId, existingItemIds) => {
    // Empty box can accept any item
    if (!existingItemIds || existingItemIds.length === 0) {
      return { canAdd: true, reason: '' };
    }

    // If same item already in box, allow (quantity increase)
    if (existingItemIds.includes(newItemId)) {
      return { canAdd: true, reason: '' };
    }

    const newItemRel = itemRelationships.get(newItemId);
    if (!newItemRel) {
      return { 
        canAdd: false, 
        reason: 'Loading item information...' 
      };
    }

    // Check if new item allows mixed carton
    if (!newItemRel.allowMixed) {
      return { 
        canAdd: false, 
        reason: `${newItemRel.itemName} tidak mengizinkan mixed carton` 
      };
    }

    // Check bidirectional compatibility with all existing items
    for (const existingItemId of existingItemIds) {
      if (existingItemId === newItemId) continue;

      const existingItemRel = itemRelationships.get(existingItemId);
      if (!existingItemRel) {
        return { 
          canAdd: false, 
          reason: 'Loading existing item information...' 
        };
      }

      // Check if existing item allows mixed
      if (!existingItemRel.allowMixed) {
        return { 
          canAdd: false, 
          reason: `${existingItemRel.itemName} tidak mengizinkan mixed carton` 
        };
      }

      // Check bidirectional relationship
      const newCanMixWithExisting = newItemRel.mixedWithItemIds.includes(existingItemId);
      const existingCanMixWithNew = existingItemRel.mixedWithItemIds.includes(newItemId);

      if (!newCanMixWithExisting || !existingCanMixWithNew) {
        return { 
          canAdd: false, 
          reason: `${newItemRel.itemName} tidak dapat dicampur dengan ${existingItemRel.itemName}` 
        };
      }
    }

    return { canAdd: true, reason: '' };
  }, [itemRelationships]);

  /**
   * Get items that can be mixed with items in a box
   */
  const getCompatibleItems = useCallback((boxItemIds, availableItems) => {
    if (!boxItemIds || boxItemIds.length === 0) {
      return availableItems; // All items are compatible with empty box
    }

    return availableItems.filter(item => {
      const { canAdd } = canAddItemToBox(item.id, boxItemIds);
      return canAdd;
    });
  }, [canAddItemToBox]);

  /**
   * Get mixing information for an item
   */
  const getMixingInfo = useCallback((itemId) => {
    return itemRelationships.get(itemId) || null;
  }, [itemRelationships]);

  /**
   * Clear all cached relationships
   */
  const clearCache = useCallback(() => {
    setItemRelationships(new Map());
  }, []);

  return {
    loadItemRelationships,
    loadItemsRelationships,
    canAddItemToBox,
    getCompatibleItems,
    getMixingInfo,
    itemRelationships,
    loading,
    clearCache
  };
};

export default useMixedCartonValidation;

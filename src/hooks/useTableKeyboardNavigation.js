import { useEffect } from 'react';

/**
 * Custom hook to enable ArrowUp/ArrowDown keyboard navigation for tables.
 * 
 * @param {object} params
 * @param {Array} params.items - The list of items/rows in the table.
 * @param {any} params.selectedId - The currently selected item's ID.
 * @param {Function} params.onSelect - Callback when an item is selected via arrow keys.
 * @param {string} [params.idAttribute='id'] - The attribute of the item representing its unique ID.
 * @param {string} [params.dataAttributeName='data-row-id'] - The HTML data attribute set on the <tr> element.
 */
export default function useTableKeyboardNavigation({
  items,
  selectedId,
  onSelect,
  idAttribute = 'id',
  dataAttributeName = 'data-row-id',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!items || items.length === 0 || !onSelect) return;

      // Prevent triggering shortcut while typing in inputs, textareas, etc.
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();

        const currentIndex = items.findIndex((item) => {
          const rawItem = item?.original || item;
          return rawItem[idAttribute] === selectedId;
        });

        let nextIndex = -1;

        if (e.key === 'ArrowDown') {
          if (currentIndex === -1) {
            nextIndex = 0;
          } else if (currentIndex < items.length - 1) {
            nextIndex = currentIndex + 1;
          }
        } else if (e.key === 'ArrowUp') {
          if (currentIndex === -1) {
            nextIndex = items.length - 1;
          } else if (currentIndex > 0) {
            nextIndex = currentIndex - 1;
          }
        }

        if (nextIndex !== -1 && nextIndex < items.length) {
          const nextItem = items[nextIndex];
          const targetItem = nextItem?.original || nextItem;
          onSelect(targetItem);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [items, selectedId, onSelect, idAttribute]);

  useEffect(() => {
    if (selectedId) {
      const activeRow = document.querySelector(`tr[${dataAttributeName}="${selectedId}"]`);
      if (activeRow) {
        activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedId, dataAttributeName]);
}

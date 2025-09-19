import { useState } from 'react';

/**
 * Hook untuk menangani konfirmasi delete
 * Menggantikan window.confirm dengan state management
 * 
 * @param {function} deleteFunction - Function yang akan dipanggil untuk delete
 * @param {string} message - Pesan konfirmasi
 * @param {string} title - Judul dialog
 * @returns {object} - Object berisi state dan functions untuk dialog konfirmasi
 */
export const useDeleteConfirmation = (deleteFunction, message = "Apakah Anda yakin ingin menghapus item ini?", title = "Konfirmasi Hapus") => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  const showDeleteConfirmation = (id) => {
    setItemToDelete(id);
    setShowConfirm(true);
  };

  const hideDeleteConfirmation = () => {
    setShowConfirm(false);
    setItemToDelete(null);
    setLoading(false);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    setLoading(true);
    try {
      await deleteFunction(itemToDelete);
      hideDeleteConfirmation();
    } catch (error) {
      console.error('Error deleting item:', error);
      setLoading(false);
    }
  };

  return {
    showConfirm,
    itemToDelete,
    loading,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    confirmDelete,
    message,
    title
  };
};

export default useDeleteConfirmation;

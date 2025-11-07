import React from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

/**
 * ConfirmationDialog Component
 * A reusable confirmation dialog that replaces window.confirm
 * 
 * @param {boolean} show - Whether to show the dialog
 * @param {function} onClose - Function to call when dialog is closed
 * @param {function} onConfirm - Function to call when user confirms
 * @param {string} title - Dialog title
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Text for confirm button (default: "Ya")
 * @param {string} cancelText - Text for cancel button (default: "Batal")
 * @param {string} type - Dialog type: "warning", "danger", "success" (default: "warning")
 * @param {boolean} loading - Whether the confirm action is loading
 */
export const ConfirmationDialog = ({
  show,
  onClose,
  onConfirm,
  title = "Konfirmasi",
  message = "Apakah Anda yakin?",
  confirmText = "Ya",
  cancelText = "Batal",
  type = "warning",
  loading = false
}) => {
  if (!show) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <XCircleIcon className="w-8 h-8" />,
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          confirmBg: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
          borderColor: "border-red-200"
        };
      case 'success':
        return {
          icon: <CheckCircleIcon className="w-8 h-8" />,
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          confirmBg: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
          borderColor: "border-green-200"
        };
      default: // warning
        return {
          icon: <ExclamationTriangleIcon className="w-8 h-8" />,
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          confirmBg: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
          borderColor: "border-yellow-200"
        };
    }
  };

  const config = getTypeConfig();

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center p-6 border-b border-gray-200">
          <div className={`flex-shrink-0 w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center mr-4`}>
            <span className={config.iconColor}>
              {config.icon}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 px-6 pb-6">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${config.confirmBg}`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook untuk menggunakan ConfirmationDialog
 * Memudahkan penggunaan dialog konfirmasi dengan state management
 */
export const useConfirmationDialog = () => {
  const [dialogState, setDialogState] = React.useState({
    show: false,
    title: "Konfirmasi",
    message: "Apakah Anda yakin?",
    confirmText: "Ya",
    cancelText: "Batal",
    type: "warning",
    loading: false
  });

  const showDialog = (options = {}) => {
    setDialogState(prev => ({
      ...prev,
      show: true,
      ...options,
      loading: false
    }));
  };

  const hideDialog = () => {
    setDialogState(prev => ({
      ...prev,
      show: false,
      loading: false
    }));
  };

  const setLoading = (loading) => {
    setDialogState(prev => ({
      ...prev,
      loading
    }));
  };

  const ConfirmationDialogComponent = ({ onConfirm }) => (
    <ConfirmationDialog
      {...dialogState}
      onClose={hideDialog}
      onConfirm={onConfirm || dialogState.onConfirm}
    />
  );

  return {
    showDialog,
    hideDialog,
    setLoading,
    ConfirmationDialog: ConfirmationDialogComponent,
    dialogState
  };
};

export default ConfirmationDialog;

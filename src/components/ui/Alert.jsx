import React, { useState, useEffect } from 'react';
import HeroIcon from '../atoms/HeroIcon';

const Alert = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info'
  showCloseButton = true,
  autoClose = false,
  autoCloseDelay = 3000
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 200); // Wait for animation to complete
  };

  const getAlertStyles = () => {
    const baseStyles = "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-200";
    
    switch (type) {
      case 'success':
        return {
          container: baseStyles,
          alert: "bg-green-50 border-green-200 text-green-800",
          icon: "text-green-400",
          iconName: "check-circle"
        };
      case 'error':
        return {
          container: baseStyles,
          alert: "bg-red-50 border-red-200 text-red-800",
          icon: "text-red-400",
          iconName: "warning"
        };
      case 'warning':
        return {
          container: baseStyles,
          alert: "bg-yellow-50 border-yellow-200 text-yellow-800",
          icon: "text-yellow-400",
          iconName: "warning"
        };
      default: // info
        return {
          container: baseStyles,
          alert: "bg-blue-50 border-blue-200 text-blue-800",
          icon: "text-blue-400",
          iconName: "exclamation-circle"
        };
    }
  };

  const styles = getAlertStyles();

  if (!isOpen) return null;

  return (
    <div className={`${styles.container} ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className={`
          ${styles.alert}
          border rounded-lg shadow-lg p-6 max-w-md w-full mx-4
          transform transition-transform duration-200
          ${isVisible ? 'scale-100' : 'scale-95'}
        `}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <HeroIcon 
              name={styles.iconName} 
              className={`h-6 w-6 ${styles.icon}`} 
            />
          </div>
          <div className="ml-3 flex-1">
            {title && (
              <h3 className="text-lg font-medium mb-2">
                {title}
              </h3>
            )}
            <div className="text-sm">
              {message}
            </div>
          </div>
          {showCloseButton && (
            <div className="ml-4 flex-shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              >
                <span className="sr-only">Tutup</span>
                <HeroIcon name="x" className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook untuk menggunakan Alert dengan mudah
export const useAlert = () => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    autoClose: false
  });

  const showAlert = ({ title, message, type = 'info', autoClose = false }) => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
      autoClose
    });
  };

  const showSuccess = (message, title = 'Berhasil') => {
    showAlert({ title, message, type: 'success', autoClose: true });
  };

  const showError = (message, title = 'Error') => {
    showAlert({ title, message, type: 'error' });
  };

  const showWarning = (message, title = 'Peringatan') => {
    showAlert({ title, message, type: 'warning' });
  };

  const showInfo = (message, title = 'Informasi') => {
    showAlert({ title, message, type: 'info', autoClose: true });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  const AlertComponent = () => (
    <Alert
      isOpen={alertState.isOpen}
      onClose={hideAlert}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
      autoClose={alertState.autoClose}
    />
  );

  return {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideAlert,
    AlertComponent
  };
};

export default Alert;

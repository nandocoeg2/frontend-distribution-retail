import { useState } from 'react';

export const useModal = () => {
  const [modalState, setModalState] = useState({
    add: false,
    edit: false,
    view: false,
    delete: false,
    selectedData: null,
  });

  const openModal = (type, data = null) => {
    setModalState((prev) => ({ ...prev, [type]: true, selectedData: data }));
  };

  const closeModal = (type) => {
    setModalState((prev) => ({ ...prev, [type]: false, selectedData: null }));
  };

  return {
    modalState,
    openModal,
    closeModal,
  };
};

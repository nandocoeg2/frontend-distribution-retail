// Test file untuk hooks group customers
// Ini adalah contoh penggunaan hooks yang telah dibuat

import { 
  useGroupCustomersPage, 
  useGroupCustomerForm, 
  useGroupCustomerOperations, 
  useGroupCustomerSearch 
} from './useGroupCustomers';

// Contoh penggunaan useGroupCustomersPage
export const ExampleGroupCustomersPage = () => {
  const {
    groupCustomers,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteGroupCustomer,
    refreshData,
    clearSearch
  } = useGroupCustomersPage();

  return {
    groupCustomers,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteGroupCustomer,
    refreshData,
    clearSearch
  };
};

// Contoh penggunaan useGroupCustomerForm
export const ExampleGroupCustomerForm = (initialData) => {
  const {
    formData,
    setFormData,
    loading,
    errors,
    handleInputChange,
    handleSubmit,
    resetForm,
    setFieldError,
    clearErrors,
    validateForm
  } = useGroupCustomerForm(initialData);

  return {
    formData,
    setFormData,
    loading,
    errors,
    handleInputChange,
    handleSubmit,
    resetForm,
    setFieldError,
    clearErrors,
    validateForm
  };
};

// Contoh penggunaan useGroupCustomerOperations
export const ExampleGroupCustomerOperations = () => {
  const {
    loading,
    createGroupCustomer,
    updateGroupCustomer,
    deleteGroupCustomer,
    getGroupCustomerById
  } = useGroupCustomerOperations();

  return {
    loading,
    createGroupCustomer,
    updateGroupCustomer,
    deleteGroupCustomer,
    getGroupCustomerById
  };
};

// Contoh penggunaan useGroupCustomerSearch
export const ExampleGroupCustomerSearch = () => {
  const {
    searchResults,
    setSearchResults,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    searchGroupCustomers,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    clearSearch,
    refreshSearch
  } = useGroupCustomerSearch();

  return {
    searchResults,
    setSearchResults,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    searchGroupCustomers,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    clearSearch,
    refreshSearch
  };
};

// Export semua contoh
export default {
  ExampleGroupCustomersPage,
  ExampleGroupCustomerForm,
  ExampleGroupCustomerOperations,
  ExampleGroupCustomerSearch
};

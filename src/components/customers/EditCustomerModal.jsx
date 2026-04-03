import CustomerForm from '@/components/customers/CustomerForm';
import useCustomerOperations from '../../hooks/useCustomerOperations';

const EditCustomerModal = ({ onClose, customer, onCustomerUpdated }) => {
  const { updateCustomer, loading, error } = useCustomerOperations();

  const handleSubmit = async (formData) => {
    try {
      await updateCustomer(customer.id, formData);
      if (onCustomerUpdated) {
        onCustomerUpdated();
      }
      onClose();
    } catch (error) {
      console.error('Update customer error:', error);
    }
  };

  if (!customer) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200">
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200">
          <h2 className="text-xl font-bold">Edit Customer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <div className="px-5 py-4 overflow-y-auto max-h-[calc(85vh-60px)]">
        <CustomerForm 
          onSubmit={handleSubmit} 
          onClose={onClose} 
          loading={loading}
          error={error}
          initialData={customer}
        />
        </div>
      </div>
    </div>
  );
};

export default EditCustomerModal;

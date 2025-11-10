import React from 'react';
import { PlusIcon, TrashIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';

const CustomerPICForm = ({ pics = [], onChange, disabled = false }) => {
  const ensureOneDefault = (updatedPics) => {
    const hasDefault = updatedPics.some(pic => pic.default === true);
    
    if (!hasDefault && updatedPics.length > 0) {
      // Set first PIC as default if none is set
      updatedPics[0].default = true;
    }
    
    return updatedPics;
  };

  const handleAddPIC = () => {
    const newPIC = {
      nama_pic: '',
      dept: '',
      telpon: '',
      default: pics.length === 0 // First PIC is default
    };
    onChange([...pics, newPIC]);
  };

  const handleRemovePIC = (index) => {
    const updatedPics = pics.filter((_, i) => i !== index);
    onChange(ensureOneDefault(updatedPics));
  };

  const handlePICChange = (index, field, value) => {
    const updatedPics = [...pics];
    
    // If setting default, unset all others first
    if (field === 'default' && value === true) {
      updatedPics.forEach((pic, i) => {
        pic.default = i === index;
      });
    } else {
      updatedPics[index] = { ...updatedPics[index], [field]: value };
    }
    
    onChange(updatedPics);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          Customer PICs (Person In Charge)
        </label>
        <button
          type="button"
          onClick={handleAddPIC}
          disabled={disabled}
          className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add PIC
        </button>
      </div>

      {pics.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No PICs added yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add PIC" to add a person in charge</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pics.map((pic, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-2 transition-all ${
                pic.default 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">
                    PIC #{index + 1}
                  </span>
                  {pic.default && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
                      Default
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePIC(index)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove PIC"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Nama PIC */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={pic.nama_pic}
                    onChange={(e) => handlePICChange(index, 'nama_pic', e.target.value)}
                    disabled={disabled}
                    required
                    placeholder="Enter PIC name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    value={pic.dept}
                    onChange={(e) => handlePICChange(index, 'dept', e.target.value)}
                    disabled={disabled}
                    required
                    placeholder="e.g., Purchasing, Finance"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={pic.telpon}
                    onChange={(e) => handlePICChange(index, 'telpon', e.target.value)}
                    disabled={disabled}
                    required
                    placeholder="081234567890"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {/* Set as Default */}
                <div className="flex items-end">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="defaultPIC"
                      checked={pic.default || false}
                      onChange={() => handlePICChange(index, 'default', true)}
                      disabled={disabled}
                      className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="ml-2 text-sm text-gray-700">Set as default contact</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pics.length > 0 && (
        <p className="text-xs text-gray-500 italic">
          * The default PIC will be used as the primary contact for this customer
        </p>
      )}
    </div>
  );
};

export default CustomerPICForm;

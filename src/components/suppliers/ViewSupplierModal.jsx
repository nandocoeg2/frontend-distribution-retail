import React, { useState } from 'react';
import { AccordionItem, InfoCard, InfoTable } from '../ui';
import { formatDateTime } from '../../utils/formatUtils';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
const ViewSupplierModal = ({ show, onClose, supplier }) => {
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    contactInfo: false,
    bankInfo: false,
    metaInfo: false,
  });

  if (!show || !supplier) {
    return null;
  }

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
      <div className='bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50'>
          <div className='flex items-center space-x-4'>
            <div className='p-2 bg-purple-100 rounded-lg'>
              <span className='text-2xl'>
                <BuildingOfficeIcon className='w-6 h-6' />
              </span>
            </div>
            <div>
              <h2 className='text-2xl font-bold text-gray-900'>
                Detail Supplier
              </h2>
              <p className='text-sm text-gray-600'>{supplier.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 transition-colors rounded-lg hover:bg-gray-100'
          >
            <svg
              className='w-6 h-6 text-gray-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 p-6 overflow-y-auto'>
          <div className='space-y-6'>
            {/* Basic Information */}
            <AccordionItem
              title='Informasi Dasar'
              isExpanded={expandedSections.basicInfo}
              onToggle={() => toggleSection('basicInfo')}
              bgColor='bg-gradient-to-r from-purple-50 to-purple-100'
            >
              <InfoTable
                data={[
                  { label: 'Nama Supplier', value: supplier.name },
                  { label: 'Kode Supplier', value: supplier.code },
                  { label: 'ID Supplier', value: supplier.id, copyable: true },
                  { label: 'Alamat', value: supplier.address },
                ]}
              />
            </AccordionItem>

            {/* Contact Information */}
            <AccordionItem
              title='Informasi Kontak'
              isExpanded={expandedSections.contactInfo}
              onToggle={() => toggleSection('contactInfo')}
              bgColor='bg-gradient-to-r from-blue-50 to-blue-100'
            >
              <InfoTable
                data={[{ label: 'Nomor Telepon', value: supplier.phoneNumber }]}
              />
            </AccordionItem>

            {/* Bank Information */}
            {supplier.bank && (
              <AccordionItem
                title='Informasi Bank'
                isExpanded={expandedSections.bankInfo}
                onToggle={() => toggleSection('bankInfo')}
                bgColor='bg-gradient-to-r from-green-50 to-green-100'
              >
                <InfoTable
                  data={[
                    { label: 'Nama Bank', value: supplier.bank.name },
                    {
                      label: 'Nama Pemegang Rekening',
                      value: supplier.bank.holder,
                    },
                    {
                      label: 'Nomor Rekening',
                      value: supplier.bank.account,
                      copyable: true,
                    },
                  ]}
                />
              </AccordionItem>
            )}

            {/* System Information */}
            <AccordionItem
              title='Informasi Sistem'
              isExpanded={expandedSections.metaInfo}
              onToggle={() => toggleSection('metaInfo')}
              bgColor='bg-gradient-to-r from-gray-50 to-gray-100'
            >
              <InfoTable
                data={[
                  {
                    label: 'Dibuat Pada',
                    value: formatDateTime(supplier.createdAt),
                  },
                  {
                    label: 'Diperbarui Pada',
                    value: formatDateTime(supplier.updatedAt),
                  },
                ]}
              />
            </AccordionItem>
          </div>
        </div>

        {/* Footer */}
        <div className='p-6 border-t border-gray-200 bg-gray-50'>
          <div className='flex justify-end space-x-3'>
            <button
              onClick={onClose}
              className='px-6 py-2 font-medium text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600'
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSupplierModal;

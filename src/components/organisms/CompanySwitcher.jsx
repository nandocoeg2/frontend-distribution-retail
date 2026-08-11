import React, { useState, useEffect, useRef } from 'react';
import { BuildingStorefrontIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { getCompanies } from '../../services/companyService';
import { getActiveCompanyName } from '../../utils/companyUtils';

const CompanySwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentCompany, setCurrentCompany] = useState(() => getActiveCompanyName());
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Listen for company update events
    const updateHandler = () => {
      setCurrentCompany(getActiveCompanyName());
    };
    window.addEventListener('company:updated', updateHandler);
    return () => window.removeEventListener('company:updated', updateHandler);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    // Fetch companies when dropdown is opened for the first time
    if (isOpen && companies.length === 0) {
      fetchCompanies();
    }
  }, [isOpen]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCompanies(1, 100);
      let companiesData = [];
      if (Array.isArray(response)) {
        companiesData = response;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        companiesData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        companiesData = response.data;
      } else if (response.results && Array.isArray(response.results)) {
        companiesData = response.results;
      }
      setCompanies(companiesData);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setError('Gagal memuat perusahaan');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (company) => {
    setIsOpen(false);
    if (company) {
      localStorage.setItem('company', JSON.stringify(company));
      setCurrentCompany(company.nama_perusahaan || company.name || getActiveCompanyName());
      window.dispatchEvent(new Event('company:updated'));
      window.location.reload();
    }
  };

  return (
    <div className='relative' ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type='button'
        onClick={() => setIsOpen((prev) => !prev)}
        className='flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
        title='Ganti Perusahaan / Company'
      >
        <div className='flex items-center justify-center w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex-shrink-0'>
          <BuildingStorefrontIcon className='w-4 h-4' aria-hidden='true' />
        </div>
        <span className='max-w-[140px] sm:max-w-[200px] truncate font-bold text-gray-900'>
          {currentCompany}
        </span>
        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className='absolute right-0 mt-2 w-64 rounded-xl bg-white border border-gray-200 shadow-xl z-50 overflow-hidden py-1 divide-y divide-gray-100'>
          <div className='px-3 py-2 bg-gray-50/80 border-b border-gray-100'>
            <p className='text-[10px] font-bold uppercase tracking-wider text-gray-500'>
              Pilih Perusahaan / Company
            </p>
          </div>

          <div className='max-h-60 overflow-y-auto divide-y divide-gray-50'>
            {loading ? (
              <div className='p-4 text-center text-xs text-gray-400'>
                Memuat daftar perusahaan...
              </div>
            ) : error ? (
              <div className='p-4 text-center text-xs text-red-500'>
                {error}
              </div>
            ) : companies.length === 0 ? (
              <div className='p-4 text-center text-xs text-gray-400'>
                Tidak ada perusahaan tersedia
              </div>
            ) : (
              companies.map((comp) => {
                const compName = comp.nama_perusahaan || comp.name || '';
                const isSelected = compName === currentCompany;
                return (
                  <button
                    key={comp.id || compName}
                    type='button'
                    onClick={() => handleCompanySelect(comp)}
                    className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between transition-colors hover:bg-indigo-50/70 ${
                      isSelected
                        ? 'bg-indigo-50 font-bold text-indigo-700'
                        : 'text-gray-700'
                    }`}
                  >
                    <div className='flex items-center gap-2 min-w-0 pr-2'>
                      <BuildingStorefrontIcon className='w-4 h-4 text-gray-400 flex-shrink-0' />
                      <span className='truncate'>{compName}</span>
                    </div>
                    {isSelected && (
                      <CheckIcon className='w-4 h-4 text-indigo-600 flex-shrink-0' />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySwitcher;

import React, { useState, useEffect, useRef } from 'react';
import { BuildingStorefrontIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { getCompanies } from '../../services/companyService';

const CompanySwitcher = ({ companyName, onCompanyChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

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
    // Fetch companies when dropdown is opened
    if (isOpen && companies.length === 0) {
      fetchCompanies();
    }
  }, [isOpen]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCompanies(1, 100);
      // Handle different response structures
      let companiesData = [];
      if (Array.isArray(response)) {
        companiesData = response;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Nested structure: response.data.data
        companiesData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        companiesData = response.data;
      } else if (response.results && Array.isArray(response.results)) {
        companiesData = response.results;
      }
      setCompanies(companiesData);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (company) => {
    setIsOpen(false);
    if (onCompanyChange) {
      onCompanyChange(company);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Company Header - Clickable */}
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-3 w-full text-left hover:bg-white/5 rounded-lg transition-all duration-200 group"
      >
        <div className="flex items-center justify-center w-10 h-10 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex-shrink-0">
          <BuildingStorefrontIcon
            className="w-6 h-6 text-white"
            aria-hidden="true"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-transparent bg-gradient-to-r from-white to-slate-200 bg-clip-text truncate">
            {companyName}
          </h1>
          <p className="text-xs text-slate-400 truncate">{companyName}</p>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 group-hover:text-white flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              Loading companies...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-400 text-sm">
              {error}
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {companies.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm">
                  No companies available
                </div>
              ) : (
                companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleCompanySelect(company)}
                    className={`w-full flex items-center space-x-3 p-3 hover:bg-white/10 transition-all duration-150 ${
                      company.nama_perusahaan === companyName
                        ? 'bg-blue-500/20 text-white'
                        : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-lg flex-shrink-0">
                      <BuildingStorefrontIcon
                        className="w-5 h-5"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">
                        {company.nama_perusahaan}
                      </p>
                      {company.kode_company_surat && (
                        <p className="text-xs text-slate-400 truncate">
                          {company.kode_company_surat}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default CompanySwitcher;

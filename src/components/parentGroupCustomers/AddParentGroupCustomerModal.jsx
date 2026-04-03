import { useState } from 'react';
import { parentGroupCustomerService } from '@/services/parentGroupCustomerService';
import toastService from '@/services/toastService';
import { XMarkIcon } from '@heroicons/react/24/outline';

const AddParentGroupCustomerModal = ({ show, onClose, onParentGroupCustomerAdded }) => {
    const [formData, setFormData] = useState({
        kode_parent: '',
        nama_parent: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.kode_parent.trim()) {
            newErrors.kode_parent = 'Kode parent group wajib diisi';
        }

        if (!formData.nama_parent.trim()) {
            newErrors.nama_parent = 'Nama parent group wajib diisi';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toastService.error('Mohon perbaiki error pada form');
            return;
        }

        try {
            setLoading(true);
            setErrors({});

            const submitData = {
                kode_parent: formData.kode_parent.trim(),
                nama_parent: formData.nama_parent.trim(),
            };

            const result = await parentGroupCustomerService.createParentGroupCustomer(submitData);

            if (result.success) {
                toastService.success('Parent group customer berhasil dibuat');
                setFormData({ kode_parent: '', nama_parent: '' });
                if (onParentGroupCustomerAdded) {
                    onParentGroupCustomerAdded(result.data);
                }
                onClose();
            } else {
                throw new Error(result.error?.message || 'Failed to create parent group customer');
            }
        } catch (err) {
            let errorMessage = 'Gagal menyimpan parent group customer';

            if (err.message.includes('409')) {
                errorMessage = 'Kode parent group sudah digunakan';
                setErrors({ kode_parent: 'Kode parent group sudah digunakan' });
            } else if (err.message) {
                errorMessage = err.message;
            }

            toastService.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!show) {
        return null;
    }

    return (
        <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
            onClick={onClose}
        >
            <div
                className='w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'
                onClick={(e) => e.stopPropagation()}
            >
                <div className='flex items-center justify-between border-b border-gray-200 bg-blue-600 px-5 py-3 text-white'>
                    <h3 className='text-base font-semibold'>
                        Parent Group Customer
                    </h3>
                    <button
                        onClick={onClose}
                        className='rounded p-1 hover:bg-white/20 focus:outline-none'
                        aria-label='Tutup'
                    >
                        <XMarkIcon className='h-5 w-5' />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="px-5 py-4 space-y-4">
                        {/* Kode Parent Group */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Kode Parent Group *
                            </label>
                            <input
                                type="text"
                                name="kode_parent"
                                value={formData.kode_parent}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 ${errors.kode_parent ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="cth. PGC001"
                            />
                            {errors.kode_parent && (
                                <p className="mt-1 text-xs text-red-600">{errors.kode_parent}</p>
                            )}
                        </div>

                        {/* Nama Parent Group */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Nama Parent Group *
                            </label>
                            <input
                                type="text"
                                name="nama_parent"
                                value={formData.nama_parent}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 ${errors.nama_parent ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="cth. Induk Group Nasional"
                            />
                            {errors.nama_parent && (
                                <p className="mt-1 text-xs text-red-600">{errors.nama_parent}</p>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddParentGroupCustomerModal;

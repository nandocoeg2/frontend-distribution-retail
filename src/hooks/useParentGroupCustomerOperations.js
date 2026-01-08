import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { parentGroupCustomerService } from '../services/parentGroupCustomerService';

const useParentGroupCustomerOperations = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAuthError = useCallback(() => {
        localStorage.clear();
        navigate('/login');
        toastService.error('Sesi telah berakhir. Silakan login kembali.');
    }, [navigate]);

    const createParentGroupCustomer = useCallback(async (data) => {
        try {
            setLoading(true);
            const result = await parentGroupCustomerService.createParentGroupCustomer(data);

            if (result.success) {
                toastService.success('Parent group customer berhasil dibuat');
                return result.data;
            } else {
                throw new Error(result.error?.message || 'Failed to create parent group customer');
            }
        } catch (err) {
            if (err.message === 'Unauthorized' || err.message.includes('401')) {
                handleAuthError();
                return;
            }

            let errorMessage = 'Gagal membuat parent group customer';

            if (err.message.includes('400')) {
                errorMessage = 'Data yang dimasukkan tidak valid';
            } else if (err.message.includes('409')) {
                errorMessage = 'Kode parent group customer sudah digunakan';
            } else if (err.message.includes('500')) {
                errorMessage = 'Terjadi kesalahan server. Silakan coba lagi.';
            } else if (err.message.includes('Network')) {
                errorMessage = 'Koneksi jaringan bermasalah. Periksa koneksi internet Anda.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            toastService.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [handleAuthError]);

    const updateParentGroupCustomer = useCallback(async (id, data) => {
        try {
            setLoading(true);
            const result = await parentGroupCustomerService.updateParentGroupCustomer(id, data);

            if (result.success) {
                toastService.success('Parent group customer berhasil diperbarui');
                return result.data;
            } else {
                throw new Error(result.error?.message || 'Failed to update parent group customer');
            }
        } catch (err) {
            if (err.message === 'Unauthorized' || err.message.includes('401')) {
                handleAuthError();
                return;
            }

            let errorMessage = 'Gagal memperbarui parent group customer';

            if (err.message.includes('400')) {
                errorMessage = 'Data yang dimasukkan tidak valid';
            } else if (err.message.includes('404')) {
                errorMessage = 'Parent group customer tidak ditemukan';
            } else if (err.message.includes('409')) {
                errorMessage = 'Kode parent group customer sudah digunakan';
            } else if (err.message.includes('500')) {
                errorMessage = 'Terjadi kesalahan server. Silakan coba lagi.';
            } else if (err.message.includes('Network')) {
                errorMessage = 'Koneksi jaringan bermasalah. Periksa koneksi internet Anda.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            toastService.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [handleAuthError]);

    const deleteParentGroupCustomer = useCallback(async (id) => {
        try {
            setLoading(true);
            const result = await parentGroupCustomerService.deleteParentGroupCustomer(id);

            if (result.success) {
                toastService.success('Parent group customer berhasil dihapus');
                return true;
            } else {
                throw new Error(result.error?.message || 'Failed to delete parent group customer');
            }
        } catch (err) {
            if (err.message === 'Unauthorized' || err.message.includes('401')) {
                handleAuthError();
                return;
            }

            let errorMessage = 'Gagal menghapus parent group customer';

            if (err.message.includes('404')) {
                errorMessage = 'Parent group customer tidak ditemukan';
            } else if (err.message.includes('400')) {
                errorMessage = err.message || 'Parent group customer tidak dapat dihapus karena masih digunakan';
            } else if (err.message.includes('500')) {
                errorMessage = 'Terjadi kesalahan server. Silakan coba lagi.';
            } else if (err.message.includes('Network')) {
                errorMessage = 'Koneksi jaringan bermasalah. Periksa koneksi internet Anda.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            toastService.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [handleAuthError]);

    const getParentGroupCustomerById = useCallback(async (id) => {
        try {
            setLoading(true);
            const result = await parentGroupCustomerService.getParentGroupCustomerById(id);

            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.error?.message || 'Failed to fetch parent group customer');
            }
        } catch (err) {
            if (err.message === 'Unauthorized' || err.message.includes('401')) {
                handleAuthError();
                return;
            }

            let errorMessage = 'Gagal mengambil data parent group customer';

            if (err.message.includes('404')) {
                errorMessage = 'Parent group customer tidak ditemukan';
            } else if (err.message.includes('500')) {
                errorMessage = 'Terjadi kesalahan server. Silakan coba lagi.';
            } else if (err.message.includes('Network')) {
                errorMessage = 'Koneksi jaringan bermasalah. Periksa koneksi internet Anda.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            toastService.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [handleAuthError]);

    return {
        loading,
        createParentGroupCustomer,
        updateParentGroupCustomer,
        deleteParentGroupCustomer,
        getParentGroupCustomerById
    };
};

export default useParentGroupCustomerOperations;

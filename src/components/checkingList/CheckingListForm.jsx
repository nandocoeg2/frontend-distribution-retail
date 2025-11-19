import React, { useEffect, useState } from 'react';
import Autocomplete from '../common/Autocomplete';
import statusService from '../../services/statusService';

const defaultValues = {
    statusId: '',
    tanggal: '',
    checker: '',
    driver: '',
    mobil: '',
    kota: '',
};

const toDateTimeLocalValue = (value) => {
    if (!value) {
        return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
};

const toIsoString = (value) => {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString();
};

const normalizeInitialValues = (initialValues) => {
    if (!initialValues || typeof initialValues !== 'object') {
        return defaultValues;
    }

    return {
        statusId: initialValues.statusId || initialValues.status?.id || '',
        tanggal: toDateTimeLocalValue(initialValues.tanggal),
        checker: initialValues.checker || '',
        driver: initialValues.driver || '',
        mobil: initialValues.mobil || '',
        kota: initialValues.kota || '',
    };
};

const CheckingListForm = ({
    initialValues,
    onSubmit,
    onCancel,
    isSubmitting = false,
    formId,
}) => {
    const [formData, setFormData] = useState(defaultValues);
    const [statusOptions, setStatusOptions] = useState([]);
    const [loadingStatuses, setLoadingStatuses] = useState(false);

    useEffect(() => {
        fetchStatuses();
    }, []);

    useEffect(() => {
        if (initialValues) {
            setFormData(normalizeInitialValues(initialValues));
        } else {
            setFormData(defaultValues);
        }
    }, [initialValues]);

    const fetchStatuses = async () => {
        setLoadingStatuses(true);
        try {
            const response = await statusService.getSuratJalanStatuses();
            const statuses = response?.data?.data || response?.data || [];
            setStatusOptions(statuses);
        } catch (error) {
            console.error('Failed to fetch statuses:', error);
            setStatusOptions([]);
        } finally {
            setLoadingStatuses(false);
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!onSubmit) {
            return;
        }

        const payload = {
            statusId: formData.statusId?.trim(),
            checker: formData.checker?.trim(),
            driver: formData.driver?.trim(),
            mobil: formData.mobil?.trim(),
            kota: formData.kota?.trim(),
        };

        const isoTanggal = toIsoString(formData.tanggal);
        if (isoTanggal) {
            payload.tanggal = isoTanggal;
        }

        onSubmit(payload);
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <div className='md:col-span-2'>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>
                        Status ID <span className='text-red-500'>*</span>
                    </label>
                    <input
                        type='text'
                        value={initialValues?.status?.status_code || initialValues?.status?.status_name || formData.statusId || '-'}
                        disabled
                        className='w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-100 text-gray-700 cursor-not-allowed'
                    />
                </div>

                <div>
                    <label
                        htmlFor='tanggal'
                        className='mb-1 block text-sm font-medium text-gray-700'
                    >
                        Tanggal Checklist <span className='text-red-500'>*</span>
                    </label>
                    <input
                        id='tanggal'
                        name='tanggal'
                        type='datetime-local'
                        value={formData.tanggal}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
                    />
                </div>

                <div>
                    <label
                        htmlFor='checker'
                        className='mb-1 block text-sm font-medium text-gray-700'
                    >
                        Nama Checker <span className='text-red-500'>*</span>
                    </label>
                    <input
                        id='checker'
                        name='checker'
                        type='text'
                        value={formData.checker}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        placeholder='Nama checker'
                        className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
                    />
                </div>

                <div>
                    <label
                        htmlFor='driver'
                        className='mb-1 block text-sm font-medium text-gray-700'
                    >
                        Nama Driver <span className='text-red-500'>*</span>
                    </label>
                    <input
                        id='driver'
                        name='driver'
                        type='text'
                        value={formData.driver}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        placeholder='Nama driver'
                        className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
                    />
                </div>

                <div>
                    <label
                        htmlFor='mobil'
                        className='mb-1 block text-sm font-medium text-gray-700'
                    >
                        Nomor Kendaraan <span className='text-red-500'>*</span>
                    </label>
                    <input
                        id='mobil'
                        name='mobil'
                        type='text'
                        value={formData.mobil}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        placeholder='Contoh: B 1234 XYZ'
                        className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
                    />
                </div>

                <div>
                    <label
                        htmlFor='kota'
                        className='mb-1 block text-sm font-medium text-gray-700'
                    >
                        Kota Tujuan <span className='text-red-500'>*</span>
                    </label>
                    <input
                        id='kota'
                        name='kota'
                        type='text'
                        value={formData.kota}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        placeholder='Kota tujuan pengiriman'
                        className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
                    />
                </div>
            </div>
        </form>
    );
};

export default CheckingListForm;

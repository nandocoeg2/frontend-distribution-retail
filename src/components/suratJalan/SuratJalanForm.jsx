import React, { useState, useEffect, useMemo } from 'react';
import {
    DocumentTextIcon,
    ArchiveBoxIcon,
    ReceiptPercentIcon,
} from '@heroicons/react/24/outline';
import { getPackingBoxes } from '../../utils/suratJalanHelpers';
import SuratJalanDetailsTable from './SuratJalanDetailsTable';
import { useAuth } from '../../hooks/useAuth';

const ROMAN_MONTHS = [
    { value: 'I', label: 'I' },
    { value: 'II', label: 'II' },
    { value: 'III', label: 'III' },
    { value: 'IV', label: 'IV' },
    { value: 'V', label: 'V' },
    { value: 'VI', label: 'VI' },
    { value: 'VII', label: 'VII' },
    { value: 'VIII', label: 'VIII' },
    { value: 'IX', label: 'IX' },
    { value: 'X', label: 'X' },
    { value: 'XI', label: 'XI' },
    { value: 'XII', label: 'XII' },
];

const ReadOnlyBoxDetails = React.memo(({ packingBoxes }) => {
    if (!packingBoxes || packingBoxes.length === 0) {
        return (
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                    <ArchiveBoxIcon className="mr-2 h-5 w-5 text-indigo-600" aria-hidden="true" />
                    Box Details (Read-only)
                </h3>
                <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50/30">
                    <p className="text-sm text-gray-700">
                        ℹ️ No packing boxes available. Box details come from packing and cannot be edited here.
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                        To add or edit boxes, please update the packing data in the Purchase Order.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <ArchiveBoxIcon className="mr-2 h-5 w-5 text-indigo-600" aria-hidden="true" />
                Box Details (Read-only) <span className="ml-2 text-xs text-green-600">from Packing</span>
            </h3>
            <div className="overflow-hidden bg-white border border-gray-200 rounded">
                <SuratJalanDetailsTable packingBoxes={packingBoxes} />
            </div>
        </div>
    );
});

const SuratJalanForm = ({ suratJalan, onSubmit, onCancel, isSubmitting, formId }) => {
    const { company: activeCompany } = useAuth();

    const [formData, setFormData] = useState({
        no_surat_jalan: '',
        deliver_to: '',
        PIC: '',
        alamat_tujuan: '',
        invoiceId: '',
    });

    // Segmented parts for single field
    const [companyCode, setCompanyCode] = useState('');
    const [seq, setSeq] = useState('');
    const [groupCode, setGroupCode] = useState('');
    const [romanMonth, setRomanMonth] = useState('I');
    const [year, setYear] = useState('');

    useEffect(() => {
        if (suratJalan) {
            const rawNo = suratJalan.no_surat_jalan || '';
            const parts = rawNo.split('/');

            const resolvedCompany = activeCompany?.kode_company_surat ||
                activeCompany?.kode_company ||
                suratJalan?.purchaseOrder?.company?.kode_company_surat ||
                suratJalan?.purchaseOrder?.company?.kode_company ||
                (parts.length === 6 ? parts[0] : 'BJM');

            const resolvedGroup = suratJalan?.purchaseOrder?.customer?.groupCustomer?.group_code ||
                suratJalan?.purchaseOrder?.customer?.group_code ||
                (parts.length === 6 ? parts[3] : 'SAT');

            const initialSeq = parts.length === 6 ? parts[1] : (parts[0] || '0001');
            const initialMonth = parts.length === 6 ? parts[4] : 'I';
            const initialYear = parts.length === 6 ? parts[5] : String(new Date().getFullYear()).slice(-2);

            setCompanyCode(resolvedCompany);
            setGroupCode(resolvedGroup);
            setSeq(initialSeq);
            setRomanMonth(initialMonth);
            setYear(initialYear);

            const initialConstructedNumber = parts.length === 6
                ? `${resolvedCompany}/${initialSeq}/SJ/${resolvedGroup}/${initialMonth}/${initialYear}`
                : rawNo;

            setFormData({
                no_surat_jalan: initialConstructedNumber,
                deliver_to: suratJalan.deliver_to || '',
                PIC: suratJalan.PIC || '',
                alamat_tujuan: suratJalan.alamat_tujuan || '',
                invoiceId: suratJalan.invoiceId || '',
            });
        }
    }, [suratJalan?.id, activeCompany]);

    const packingBoxes = useMemo(() => getPackingBoxes(suratJalan), [suratJalan]);

    const handleSeqChange = (e) => {
        const val = e.target.value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
        setSeq(val);
        const combined = `${companyCode}/${val}/SJ/${groupCode}/${romanMonth}/${year}`;
        setFormData(prev => ({
            ...prev,
            no_surat_jalan: combined
        }));
    };

    const handleMonthChange = (e) => {
        const val = e.target.value;
        setRomanMonth(val);
        const combined = `${companyCode}/${seq}/SJ/${groupCode}/${val}/${year}`;
        setFormData(prev => ({
            ...prev,
            no_surat_jalan: combined
        }));
    };

    const handleYearChange = (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        setYear(val);
        const combined = `${companyCode}/${seq}/SJ/${groupCode}/${romanMonth}/${val}`;
        setFormData(prev => ({
            ...prev,
            no_surat_jalan: combined
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const invoiceNumberDisplay = suratJalan?.invoice?.no_invoice;

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-6">
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                    <DocumentTextIcon className="mr-2 h-5 w-5 text-blue-600" aria-hidden="true" />
                    Informasi Dasar
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Unified Single Input Field with Locked & Editable Segments */}
                    <div>
                        <label htmlFor="no_surat_jalan_seq" className="block mb-1 text-sm font-medium text-gray-700">
                            No Surat Jalan <span className="text-red-500">*</span>
                        </label>

                        {/* Single unified input bar styled exactly like a text input */}
                        <div className="flex items-center w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white font-mono text-sm shadow-xs transition-colors">
                            {/* Company (Locked) */}
                            <span
                                title="Company aktif (otomatis, tidak dapat diubah)"
                                className="text-gray-600 select-none font-bold bg-gray-100 px-1.5 py-0.5 rounded text-xs border border-gray-200 cursor-not-allowed"
                            >
                                {companyCode}
                            </span>
                            <span className="text-gray-400 font-bold px-1 select-none">/</span>

                            {/* Sequence (Editable) */}
                            <input
                                type="text"
                                id="no_surat_jalan_seq"
                                value={seq}
                                onChange={handleSeqChange}
                                maxLength={6}
                                placeholder="0001"
                                title="Nomor urut (dapat diedit)"
                                className="w-16 text-center font-bold text-blue-700 bg-transparent focus:outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5 text-sm"
                                required
                            />
                            <span className="text-gray-400 font-bold px-0.5 select-none">/</span>

                            {/* Tag SJ (Fixed) */}
                            <span className="text-gray-500 select-none font-bold px-0.5 text-xs">
                                SJ
                            </span>
                            <span className="text-gray-400 font-bold px-0.5 select-none">/</span>

                            {/* Group Customer (Locked) */}
                            <span
                                title="Group Customer (otomatis, tidak dapat diubah)"
                                className="text-gray-600 select-none font-bold bg-gray-100 px-1.5 py-0.5 rounded text-xs border border-gray-200 cursor-not-allowed"
                            >
                                {groupCode}
                            </span>
                            <span className="text-gray-400 font-bold px-1 select-none">/</span>

                            {/* Month (Editable) */}
                            <select
                                value={romanMonth}
                                onChange={handleMonthChange}
                                title="Bulan romawi (dapat diedit)"
                                className="font-bold text-blue-700 bg-transparent focus:outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5 text-sm cursor-pointer"
                                required
                            >
                                {ROMAN_MONTHS.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.value}
                                    </option>
                                ))}
                            </select>
                            <span className="text-gray-400 font-bold px-1 select-none">/</span>

                            {/* Year (Editable) */}
                            <input
                                type="text"
                                value={year}
                                onChange={handleYearChange}
                                maxLength={2}
                                placeholder="26"
                                title="Tahun 2 digit (dapat diedit)"
                                className="w-10 text-center font-bold text-blue-700 bg-transparent focus:outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5 text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="deliver_to" className="block mb-1 text-sm font-medium text-gray-700">
                            Deliver To <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="deliver_to"
                            name="deliver_to"
                            value={formData.deliver_to}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            placeholder="Nama penerima"
                        />
                    </div>

                    <div>
                        <label htmlFor="PIC" className="block mb-1 text-sm font-medium text-gray-700">
                            PIC <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="PIC"
                            name="PIC"
                            value={formData.PIC}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            placeholder="Person in Charge"
                        />
                    </div>

                    <div>
                        <label htmlFor="alamat_tujuan" className="block mb-1 text-sm font-medium text-gray-700">
                            Alamat Tujuan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="alamat_tujuan"
                            name="alamat_tujuan"
                            value={formData.alamat_tujuan}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            placeholder="Alamat pengiriman"
                        />
                    </div>

                    {/* Invoice Pengiriman Display Field */}
                    <div className="md:col-span-2">
                        <label htmlFor="invoice-display" className="block mb-1 text-sm font-medium text-gray-700">
                            No. Invoice Pengiriman
                        </label>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                id="invoice-display"
                                readOnly
                                disabled
                                value={invoiceNumberDisplay || (formData.invoiceId ? 'Terkait dengan Invoice Pengiriman' : 'Belum terkait invoice')}
                                className="w-full px-3 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-md cursor-not-allowed text-sm font-mono font-semibold"
                            />
                            {invoiceNumberDisplay && (
                                <span className="absolute right-3 inline-flex items-center text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded border border-emerald-200">
                                    <ReceiptPercentIcon className="w-3.5 h-3.5 mr-1" />
                                    Auto-sync
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Nomor invoice akan otomatis tersinkronisasi saat nomor surat jalan diubah.
                        </p>
                    </div>
                </div>
            </div>

            <ReadOnlyBoxDetails packingBoxes={packingBoxes} />
        </form>
    );
};

export default SuratJalanForm;

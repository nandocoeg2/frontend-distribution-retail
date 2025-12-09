import React, { useMemo } from 'react';
import { XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatUtils';

const InfoRow = ({ label, value }) => (
    <div className='flex justify-between py-2 border-b border-gray-100 last:border-0'>
        <span className='text-xs text-gray-500 font-medium'>{label}</span>
        <span className='text-xs font-semibold text-gray-900 text-right break-words max-w-[60%]'>
            {value ?? '-'}
        </span>
    </div>
);

const SectionHeader = ({ title }) => (
    <h3 className='mb-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1'>
        {title}
    </h3>
);

const TandaTerimaFakturDetailCard = ({
    tandaTerimaFaktur,
    onClose,
    onEdit,
    loading = false,
}) => {
    const detail = useMemo(() => tandaTerimaFaktur || {}, [tandaTerimaFaktur]);

    // All relations are now one-to-one (single object, not array)
    const hasLaporan = !!detail.laporanPenerimaanBarang;
    const hasInvoice = !!detail.invoicePenagihan;
    // fakturPajak is one-to-one on TTF (can also check via invoicePenagihan.fakturPajak)
    const hasFaktur = !!detail.fakturPajak || !!detail.invoicePenagihan?.fakturPajak;

    const groupCustomer =
        detail?.groupCustomer || detail?.customer?.groupCustomer || null;
    const customer = detail?.customer || null;

    if (!tandaTerimaFaktur && !loading) return null;

    return (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
            <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50'>
                <div className="flex items-center space-x-2">
                    <h2 className='text-sm font-bold text-gray-900'>
                        Detail Tanda Terima Faktur
                    </h2>
                </div>
                <div className='flex items-center gap-2'>
                    {onEdit && (
                        <button
                            onClick={() => onEdit(detail)}
                            className='p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors'
                            title="Edit TTF"
                        >
                            <PencilIcon className='w-4 h-4' />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className='p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors'
                        title="Tutup"
                    >
                        <XMarkIcon className='w-4 h-4' />
                    </button>
                </div>
            </div>

            <div className='p-4 max-h-[500px] overflow-y-auto custom-scrollbar'>
                {loading ? (
                    <div className='flex flex-col items-center justify-center py-12 text-gray-500'>
                        <div className='w-6 h-6 border-b-2 border-blue-600 rounded-full animate-spin mb-2'></div>
                        <span className="text-xs">Memuat detail...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                            <section>
                                <SectionHeader title="Informasi Utama" />
                                <div className='bg-gray-50 rounded p-3 border border-gray-100'>
                                    <InfoRow label='ID' value={detail.id} />
                                    <InfoRow label='Tanggal' value={formatDate(detail.tanggal)} />
                                    <InfoRow label='Grand Total' value={formatCurrency(detail.grand_total)} />
                                    <InfoRow label='Status' value={detail?.status?.status_name || detail.status_name} />
                                    <InfoRow label='Status Code' value={detail?.status?.status_code || detail.status_code} />
                                </div>
                            </section>

                            <section>
                                <SectionHeader title="Supplier & Group" />
                                <div className='bg-gray-50 rounded p-3 border border-gray-100'>
                                    <InfoRow label='Kode Supplier' value={detail.code_supplier} />
                                    <InfoRow label='Group Name' value={groupCustomer?.nama_group || groupCustomer?.namaGroup} />
                                    <InfoRow label='Group Code' value={groupCustomer?.kode_group || groupCustomer?.kodeGroup} />
                                    <InfoRow label='Company Name' value={detail?.company?.nama_perusahaan || detail?.company?.company_name} />
                                    <InfoRow label='Company Code' value={detail?.company?.kode_company || detail?.company?.company_code} />
                                </div>
                            </section>

                            <section>
                                <SectionHeader title="Term of Payment" />
                                <div className='bg-gray-50 rounded p-3 border border-gray-100'>
                                    <InfoRow label='Kode' value={detail?.termOfPayment?.kode_top || detail?.termOfPayment?.kodeTop} />
                                    <InfoRow
                                        label='Batas Hari'
                                        value={detail?.termOfPayment?.batas_hari != null ? `${detail.termOfPayment.batas_hari} hari` : '-'}
                                    />
                                </div>
                            </section>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            <section>
                                <SectionHeader title={`Dokumen Terkait (${(hasLaporan ? 1 : 0) + (hasInvoice ? 1 : 0) + (hasFaktur ? 1 : 0)})`} />
                                <div className="space-y-4">
                                    {/* Laporan Penerimaan Barang - now one-to-one (single object) */}
                                    {hasLaporan && (
                                        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                                            <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 text-xs font-semibold text-gray-700">
                                                Laporan Penerimaan Barang
                                            </div>
                                            <div className="p-2 text-xs hover:bg-gray-50">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">No LPB:</span>
                                                    <span className="font-medium text-gray-900">
                                                        {detail.laporanPenerimaanBarang?.no_lpb || detail.laporanPenerimaanBarang?.id || '-'}
                                                    </span>
                                                </div>
                                                {detail.laporanPenerimaanBarang?.createdAt && (
                                                    <div className="text-gray-500 text-[10px] text-right mt-0.5">
                                                        {formatDate(detail.laporanPenerimaanBarang.createdAt)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Invoice Penagihan - now one-to-one (single object) */}
                                    {hasInvoice && (
                                        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                                            <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 text-xs font-semibold text-gray-700">
                                                Invoice Penagihan
                                            </div>
                                            <div className="p-2 text-xs hover:bg-gray-50">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-gray-600">No Invoice:</span>
                                                    <span className="font-medium text-gray-900">
                                                        {detail.invoicePenagihan?.no_invoice_penagihan || detail.invoicePenagihan?.noInvoicePenagihan || '-'}
                                                    </span>
                                                </div>
                                                {/* Linked Faktur Pajak via Invoice */}
                                                {(detail.invoicePenagihan?.fakturPajak || detail.invoicePenagihan?.faktur_pajak) && (
                                                    <div className="ml-2 pl-2 border-l-2 border-green-200">
                                                        <div className="flex justify-between text-[11px]">
                                                            <span className="text-gray-500">Faktur Pajak:</span>
                                                            <span className="font-medium text-green-700">
                                                                {detail.invoicePenagihan?.fakturPajak?.no_pajak || detail.invoicePenagihan?.faktur_pajak?.noPajak || '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Faktur Pajak - direct one-to-one relation on TTF */}
                                    {detail.fakturPajak && (
                                        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                                            <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 text-xs font-semibold text-gray-700">
                                                Faktur Pajak (TTF)
                                            </div>
                                            <div className="p-2 text-xs hover:bg-gray-50">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-gray-600">No Pajak:</span>
                                                    <span className="font-medium text-green-700">
                                                        {detail.fakturPajak?.no_pajak || '-'}
                                                    </span>
                                                </div>
                                                {detail.fakturPajak?.tanggal_invoice && (
                                                    <div className="text-gray-500 text-[10px] text-right mt-0.5">
                                                        {formatDate(detail.fakturPajak.tanggal_invoice)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section>
                                <SectionHeader title="Metadata" />
                                <div className='bg-gray-50 rounded p-3 border border-gray-100'>
                                    <InfoRow label='Created By' value={detail.createdBy} />
                                    <InfoRow label='Updated By' value={detail.updatedBy} />
                                    <InfoRow label='Created At' value={formatDateTime(detail.createdAt)} />
                                    <InfoRow label='Updated At' value={formatDateTime(detail.updatedAt)} />
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TandaTerimaFakturDetailCard;

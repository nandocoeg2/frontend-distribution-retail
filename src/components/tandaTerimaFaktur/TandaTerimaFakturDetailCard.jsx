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

    const totalLaporan = Array.isArray(detail.laporanPenerimaanBarang)
        ? detail.laporanPenerimaanBarang.length
        : 0;
    const totalInvoice = Array.isArray(detail.invoicePenagihan)
        ? detail.invoicePenagihan.length
        : 0;
    const totalFakturPajak = Array.isArray(detail.invoicePenagihan)
        ? detail.invoicePenagihan.reduce((count, invoice) => {
            const faktur = invoice?.fakturPajak || invoice?.faktur_pajak;
            return faktur?.id ? count + 1 : count;
        }, 0)
        : 0;

    const groupCustomer =
        detail?.groupCustomer || detail?.customer?.groupCustomer || null;
    const customer = detail?.customer || null;
    const hasLaporan = totalLaporan > 0;
    const hasInvoice = totalInvoice > 0;

    if (!tandaTerimaFaktur && !loading) return null;

    return (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
            <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50'>
                <div className="flex items-center space-x-2">
                    <h2 className='text-sm font-bold text-gray-900'>
                        Detail Tanda Terima Faktur
                    </h2>
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {detail.code_supplier || 'No Code'}
                    </span>
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
                                <SectionHeader title={`Dokumen Terkait (${totalLaporan + totalInvoice + totalFakturPajak})`} />
                                <div className="space-y-4">
                                    {/* Laporan Penerimaan Barang */}
                                    {hasLaporan && (
                                        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                                            <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 text-xs font-semibold text-gray-700">
                                                Laporan Penerimaan Barang ({totalLaporan})
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {detail.laporanPenerimaanBarang.map((laporan, idx) => (
                                                    <div key={idx} className="p-2 text-xs hover:bg-gray-50">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">No:</span>
                                                            <span className="font-medium text-gray-900">{laporan.id}</span>
                                                        </div>
                                                        {laporan.createdAt && (
                                                            <div className="text-gray-500 text-[10px] text-right mt-0.5">
                                                                {formatDate(laporan.createdAt)}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Invoice Penagihan */}
                                    {hasInvoice && (
                                        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                                            <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 text-xs font-semibold text-gray-700">
                                                Invoice Penagihan ({totalInvoice})
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {detail.invoicePenagihan.map((invoice, idx) => (
                                                    <div key={idx} className="p-2 text-xs hover:bg-gray-50">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="text-gray-600">No Invoice:</span>
                                                            <span className="font-medium text-gray-900">{invoice.no_invoice_penagihan || invoice.noInvoicePenagihan || '-'}</span>
                                                        </div>
                                                        {/* Linked Faktur Pajak */}
                                                        {(invoice.fakturPajak || invoice.faktur_pajak) && (
                                                            <div className="ml-2 pl-2 border-l-2 border-green-200">
                                                                <div className="flex justify-between text-[11px]">
                                                                    <span className="text-gray-500">Faktur Pajak:</span>
                                                                    <span className="font-medium text-green-700">
                                                                        {invoice?.fakturPajak?.no_pajak || invoice?.faktur_pajak?.noPajak || '-'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
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

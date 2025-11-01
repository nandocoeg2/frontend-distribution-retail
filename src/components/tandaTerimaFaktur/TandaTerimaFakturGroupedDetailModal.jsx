import React, { useMemo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTandaTerimaFakturGroupedDetail } from '@/hooks/useTandaTerimaFakturGrouped';
import HeroIcon from '@/components/atoms/HeroIcon';

const TandaTerimaFakturGroupedDetailModal = ({
  isOpen = false,
  onClose = () => {},
  groupedItem = null,
}) => {
  if (!isOpen) {
    return null;
  }

  const groupCustomerId = groupedItem?.groupCustomer?.id;

  const { data, isLoading } = useTandaTerimaFakturGroupedDetail(
    groupCustomerId,
    {}
  );

  const detailData = useMemo(() => {
    if (!data) return null;
    return data;
  }, [data]);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60'>
      <div className='bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              Detail TTF - {groupedItem?.groupCustomer?.nama_group || ''}
            </h2>
            <p className='text-sm text-gray-500'>
              Ringkasan lengkap Tanda Terima Faktur per Group Customer.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='p-2 text-gray-500 transition rounded-lg hover:text-gray-700 hover:bg-gray-100'
          >
            <XMarkIcon className='w-6 h-6' />
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 px-6 py-4 overflow-y-auto'>
          {isLoading ? (
            <div className='flex items-center justify-center p-8'>
              <div className='text-center'>
                <div className='w-12 h-12 mx-auto mb-4 border-4 border-gray-300 rounded-full border-t-blue-600 animate-spin'></div>
                <p className='text-gray-500'>Memuat detail...</p>
              </div>
            </div>
          ) : detailData && detailData.data && detailData.data.length > 0 ? (
            <div className='space-y-4'>
              {detailData.data.map((ttf, idx) => (
                <div
                  key={ttf.id || idx}
                  className='p-4 border border-gray-200 rounded-lg hover:bg-gray-50'
                >
                  <div className='grid grid-cols-2 gap-4 mb-3'>
                    <div>
                      <p className='text-xs font-medium text-gray-500'>
                        Tanggal
                      </p>
                      <p className='text-sm text-gray-900'>
                        {new Date(ttf.tanggal).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className='text-xs font-medium text-gray-500'>
                        Kode Supplier
                      </p>
                      <p className='text-sm text-gray-900'>
                        {ttf.code_supplier || '-'}
                      </p>
                    </div>
                    <div>
                      <p className='text-xs font-medium text-gray-500'>TOP</p>
                      <p className='text-sm text-gray-900'>
                        {ttf.termOfPayment?.kode_top || '-'}
                      </p>
                    </div>
                    <div>
                      <p className='text-xs font-medium text-gray-500'>
                        Grand Total
                      </p>
                      <p className='text-sm font-semibold text-gray-900'>
                        Rp{ttf.grand_total?.toLocaleString('id-ID') || '0'}
                      </p>
                    </div>
                  </div>

                  {/* LPB Section */}
                  {ttf.laporanPenerimaanBarang &&
                    ttf.laporanPenerimaanBarang.length > 0 && (
                      <div className='pb-3 mb-3 border-b border-gray-100'>
                        <p className='mb-2 text-xs font-semibold text-gray-700'>
                          <HeroIcon
                            name='document'
                            className='inline w-4 h-4 mr-1'
                          />
                          Laporan Penerimaan Barang
                        </p>
                        <ul className='space-y-1 text-xs text-gray-600'>
                          {ttf.laporanPenerimaanBarang.map((lpb, lpbIdx) => (
                            <li key={lpbIdx} className='ml-4'>
                              • {lpb.no_lpb}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Invoice Penagihan Section */}
                  {ttf.invoicePenagihan && ttf.invoicePenagihan.length > 0 && (
                    <div className='pb-3 mb-3 border-b border-gray-100'>
                      <p className='mb-2 text-xs font-semibold text-gray-700'>
                        <HeroIcon
                          name='document-text'
                          className='inline w-4 h-4 mr-1'
                        />
                        Invoice Penagihan
                      </p>
                      <ul className='space-y-1 text-xs text-gray-600'>
                        {ttf.invoicePenagihan.map((inv, invIdx) => (
                          <li key={invIdx} className='ml-4'>
                            • {inv.no_invoice_penagihan} (Rp
                            {inv.grand_total?.toLocaleString('id-ID') || '0'})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Faktur Pajak Section */}
                  {ttf.fakturPajak && ttf.fakturPajak.length > 0 && (
                    <div>
                      <p className='mb-2 text-xs font-semibold text-gray-700'>
                        <HeroIcon
                          name='receipt'
                          className='inline w-4 h-4 mr-1'
                        />
                        Faktur Pajak
                      </p>
                      <ul className='space-y-1 text-xs text-gray-600'>
                        {ttf.fakturPajak.map((fp, fpIdx) => (
                          <li key={fpIdx} className='ml-4'>
                            • {fp.no_pajak}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className='p-8 text-center text-gray-500'>
              <p>Tidak ada detail tersedia</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 transition border border-gray-300 rounded-md hover:bg-gray-100'
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default TandaTerimaFakturGroupedDetailModal;

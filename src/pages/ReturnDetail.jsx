import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useReturnDetail from '@/hooks/useReturnDetail';
import {
  ReturnStatusBadge,
  ReturnClassifyModal,
} from '@/components/returns';
import {
  useConfirmationDialog,
} from '@/components/ui/ConfirmationDialog';
import { formatDateTime } from '@/utils/formatUtils';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const ReturnDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isClassifyModalOpen, setIsClassifyModalOpen] = useState(false);

  const {
    data,
    loading,
    error,
    classifyLoading,
    deleteLoading,
    fetchDetail,
    classify,
    deleteReturn,
  } = useReturnDetail(id);

  const {
    showDialog: showDeleteDialog,
    hideDialog: hideDeleteDialog,
    setLoading: setDeleteDialogLoading,
    ConfirmationDialog: DeleteConfirmationDialog,
  } = useConfirmationDialog();

  const handleBack = () => {
    navigate('/returns');
  };

  const handleOpenClassify = () => {
    setIsClassifyModalOpen(true);
  };

  const handleCloseClassify = () => {
    setIsClassifyModalOpen(false);
  };

  const handleClassifyAction = async (action) => {
    const success = await classify(action);
    if (success) {
      setIsClassifyModalOpen(false);
    }
  };

  const handleDeleteRequest = () => {
    if (!data?.id) {
      return;
    }

    showDeleteDialog({
      title: 'Hapus Retur',
      message: `Anda yakin ingin menghapus retur ${data.returnNumber || data.id}?`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteDialogLoading(true);
    const success = await deleteReturn();
    setDeleteDialogLoading(false);

    if (success) {
      hideDeleteDialog();
      navigate('/returns');
    }
  };

  const isPending = (data?.status || '').toUpperCase() === 'PENDING';
  const inventory = data?.inventory || {};

  return (
    <div className='max-w-5xl px-6 py-8 mx-auto'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={handleBack}
              className='inline-flex items-center justify-center w-10 h-10 text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50'
              aria-label='Kembali'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 6l-6 6 6 6'
                />
              </svg>
            </button>
            <div>
              <h1 className='text-2xl font-semibold text-gray-900'>
                Detail Retur
              </h1>
              <p className='mt-1 text-sm text-gray-500'>
                Tinjau informasi lengkap retur dan riwayat auditnya.
              </p>
            </div>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <ReturnStatusBadge status={data?.status} />
          {isPending && (
            <>
              <button
                type='button'
                onClick={handleOpenClassify}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white transition-colors bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700'
              >
                <HeroIcon name='sparkles' className='w-5 h-5 mr-2' />
                Klasifikasi
              </button>
              <button
                type='button'
                onClick={handleDeleteRequest}
                disabled={deleteLoading}
                className='inline-flex items-center px-4 py-2 text-sm font-semibold text-white transition-colors bg-red-600 border border-transparent rounded-md shadow-sm disabled:opacity-60 hover:bg-red-700'
              >
                {deleteLoading ? (
                  <span className='flex items-center'>
                    <span className='w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin'></span>
                    Menghapus...
                  </span>
                ) : (
                  <>
                    <HeroIcon name='trash' className='w-4 h-4 mr-2' />
                    Hapus
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className='flex items-center justify-center py-20 text-gray-500'>
          <span className='w-6 h-6 mr-3 border-b-2 border-blue-600 rounded-full animate-spin'></span>
          Memuat detail retur...
        </div>
      ) : error ? (
        <div className='p-6 text-center border border-red-100 rounded-lg bg-red-50'>
          <p className='text-sm font-semibold text-red-700'>
            Gagal memuat detail retur.
          </p>
          <p className='mt-1 text-sm text-red-600'>{error}</p>
          <button
            type='button'
            onClick={fetchDetail}
            className='inline-flex items-center px-4 py-2 mt-4 text-sm font-semibold text-white transition-colors bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700'
          >
            <HeroIcon name='arrow-path' className='w-4 h-4 mr-2' />
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          <div className='grid gap-6 md:grid-cols-2'>
            <div className='p-6 bg-white border border-gray-200 rounded-lg shadow-sm'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Informasi Retur
              </h2>
              <dl className='mt-4 space-y-3 text-sm'>
                <div className='flex justify-between'>
                  <dt className='text-gray-500'>Nomor Retur</dt>
                  <dd className='font-medium text-gray-900'>{data?.returnNumber || '-'}</dd>
                </div>
                <div className='flex justify-between'>
                  <dt className='text-gray-500'>Status</dt>
                  <dd>
                    <ReturnStatusBadge status={data?.status} />
                  </dd>
                </div>
                <div className='flex justify-between'>
                  <dt className='text-gray-500'>Jumlah</dt>
                  <dd className='font-medium text-gray-900'>{data?.quantity ?? '-'}</dd>
                </div>
                <div>
                  <dt className='text-gray-500'>Alasan</dt>
                  <dd className='mt-1 font-medium text-gray-900 whitespace-pre-line'>
                    {data?.reason || '-'}
                  </dd>
                </div>
                <div className='flex justify-between'>
                  <dt className='text-gray-500'>Dibuat Pada</dt>
                  <dd className='font-medium text-gray-900'>
                    {formatDateTime(data?.createdAt)}
                  </dd>
                </div>
                <div className='flex justify-between'>
                  <dt className='text-gray-500'>Diperbarui Pada</dt>
                  <dd className='font-medium text-gray-900'>
                    {formatDateTime(data?.updatedAt)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className='p-6 bg-white border border-gray-200 rounded-lg shadow-sm'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Detail Produk
              </h2>
              <dl className='mt-4 space-y-3 text-sm'>
                <div className='flex justify-between'>
                  <dt className='text-gray-500'>Nama Barang</dt>
                  <dd className='font-medium text-gray-900'>
                    {inventory.nama_barang || inventory.name || '-'}
                  </dd>
                </div>
                <div className='flex justify-between'>
                  <dt className='text-gray-500'>Kode Item</dt>
                  <dd className='font-medium text-gray-900'>
                    {inventory.kode_barang || inventory.code || '-'}
                  </dd>
                </div>
                {(() => {
                  const itemStocks = inventory.itemStock || inventory.itemStocks || {};
                  const stokQuantity =
                    itemStocks.stok_quantity ??
                    inventory.stok_quantity ??
                    inventory.stok_q ??
                    '-';
                  const minStock =
                    itemStocks.min_stok ??
                    inventory.min_stok ??
                    '-';
                  const qtyPerCarton =
                    itemStocks.qty_per_carton ??
                    inventory.qty_per_carton ??
                    '-';

                  return (
                    <>
                      <div className='flex justify-between'>
                        <dt className='text-gray-500'>Stok Quantity</dt>
                        <dd className='font-medium text-gray-900'>
                          {stokQuantity}
                        </dd>
                      </div>
                      <div className='flex justify-between'>
                        <dt className='text-gray-500'>Minimum Stock</dt>
                        <dd className='font-medium text-gray-900'>
                          {minStock}
                        </dd>
                      </div>
                      <div className='flex justify-between'>
                        <dt className='text-gray-500'>Qty per Carton</dt>
                        <dd className='font-medium text-gray-900'>
                          {qtyPerCarton}
                        </dd>
                      </div>
                    </>
                  );
                })()}
              </dl>
            </div>
          </div>

          <div className='p-6 mt-6 bg-white border border-gray-200 rounded-lg shadow-sm'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Riwayat Audit
              </h2>
              <button
                type='button'
                onClick={fetchDetail}
                className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors bg-blue-50 border border-blue-100 rounded-md hover:bg-blue-100'
              >
                <HeroIcon name='arrow-path' className='w-4 h-4 mr-2' />
                Refresh
              </button>
            </div>

            {Array.isArray(data?.auditTrails) && data.auditTrails.length > 0 ? (
              <ul className='space-y-3'>
                {data.auditTrails.map((trail) => (
                  <li
                    key={trail.id || `${trail.action}-${trail.timestamp}`}
                    className='p-4 border border-gray-100 rounded-lg bg-gray-50'
                  >
                    <div className='flex items-center justify-between text-sm'>
                      <span className='font-semibold text-gray-900'>
                        {trail.action || '-'}
                      </span>
                      <span className='text-gray-500'>
                        {formatDateTime(trail.timestamp)}
                      </span>
                    </div>
                    <p className='mt-2 text-sm text-gray-600'>
                      Oleh: {trail.user?.username || trail.user?.name || 'Sistem'}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className='px-4 py-10 text-center text-gray-500 border border-gray-100 rounded-lg bg-gray-50'>
                <HeroIcon name='archive-box' className='w-8 h-8 mx-auto mb-3 text-gray-300' />
                <p className='text-sm font-medium'>
                  Belum ada riwayat audit untuk retur ini.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <ReturnClassifyModal
        open={isClassifyModalOpen}
        onClose={handleCloseClassify}
        returnItem={data}
        onConfirm={handleClassifyAction}
        loading={classifyLoading}
      />

      <DeleteConfirmationDialog onConfirm={handleConfirmDelete} />
    </div>
  );
};

export default ReturnDetail;

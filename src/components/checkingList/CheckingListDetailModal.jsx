import React, { useMemo } from 'react';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import InfoTable from '../ui/InfoTable';
import { formatDateTime } from '../../utils/formatUtils';
import { exportCheckingListToPDF } from './PrintCheckingList';

const numberFormatter = new Intl.NumberFormat('id-ID');

const formatNumberValue = (value) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numberFormatter.format(numeric);
  }

  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return value;
};

const formatBooleanValue = (value) => {
  if (value === null || value === undefined) {
    return '-';
  }
  return value ? 'Ya' : 'Tidak';
};

const CheckingListDetailModal = ({
  isOpen,
  onClose,
  checklist,
  isLoading = false,
}) => {
  const baseInfo = useMemo(() => {
    if (!checklist) {
      return [];
    }

    return [
      {
        label: 'Checklist ID',
        value: checklist.id || checklist.checklistId || '-',
        copyable: Boolean(checklist?.id || checklist?.checklistId),
      },
      {
        label: 'Surat Jalan ID',
        value: checklist?.suratJalanId || '-',
        copyable: Boolean(checklist?.suratJalanId),
      },
      {
        label: 'Tanggal Checklist',
        value: formatDateTime(checklist?.tanggal),
      },
      {
        label: 'Checker',
        value: checklist?.checker || '-',
      },
      {
        label: 'Driver',
        value: checklist?.driver || '-',
      },
      {
        label: 'Nomor Kendaraan',
        value: checklist?.mobil || '-',
      },
      {
        label: 'Kota Tujuan',
        value: checklist?.kota || '-',
      },
      {
        label: 'Status ID',
        value: checklist?.statusId || checklist?.status?.id || '-',
        copyable: Boolean(checklist?.statusId || checklist?.status?.id),
      },
      {
        label: 'Status Checklist',
        value:
          checklist?.status?.status_name ||
          checklist?.status?.status_code ||
          '-',
      },
      {
        label: 'Kode Status Checklist',
        value: checklist?.status?.status_code || '-',
      },
      {
        label: 'Kategori Status Checklist',
        value: checklist?.status?.category || '-',
      },
      {
        label: 'Dibuat Oleh',
        value: checklist?.createdBy || '-',
      },
      {
        label: 'Diperbarui Oleh',
        value: checklist?.updatedBy || '-',
      },
      {
        label: 'Dibuat Pada',
        value: formatDateTime(checklist?.createdAt),
      },
      {
        label: 'Terakhir Diperbarui',
        value: formatDateTime(checklist?.updatedAt),
      },
    ];
  }, [checklist]);

  const suratJalanSections = useMemo(() => {
    const suratJalanData = Array.isArray(checklist?.suratJalan)
      ? checklist.suratJalan
      : checklist?.suratJalan
        ? [checklist.suratJalan]
        : [];

    if (suratJalanData.length === 0) {
      return [];
    }

    return suratJalanData.map((suratJalan, index) => {
      const purchaseOrder = suratJalan?.purchaseOrder;
      const customer = purchaseOrder?.customer || suratJalan?.customer;
      const supplier = purchaseOrder?.supplier || suratJalan?.supplier;
      const packing = purchaseOrder?.packing;
      const packingItems = Array.isArray(packing?.packingItems)
        ? packing.packingItems
        : packing?.packingItems
          ? [packing.packingItems]
          : [];

      return {
        key: suratJalan?.id || `surat-jalan-${index}`,
        title: `Surat Jalan #${index + 1}`,
        info: [
          {
            label: 'ID Surat Jalan',
            value: suratJalan?.id || checklist?.suratJalanId || '-',
            copyable: Boolean(suratJalan?.id || checklist?.suratJalanId),
          },
          {
            label: 'Nomor Surat Jalan',
            value: suratJalan?.no_surat_jalan || '-',
          },
          {
            label: 'Deliver To',
            value: suratJalan?.deliver_to || '-',
          },
          {
            label: 'PIC',
            value: suratJalan?.PIC || '-',
          },
          {
            label: 'Alamat Tujuan',
            value: suratJalan?.alamat_tujuan || '-',
          },
          {
            label: 'Status Surat Jalan',
            value:
              suratJalan?.status?.status_code ||
              suratJalan?.status?.status_name ||
              '-',
          },
        ],
        purchaseOrder: purchaseOrder
          ? [
              {
                label: 'Purchase Order ID',
                value: purchaseOrder?.id || '-',
                copyable: Boolean(purchaseOrder?.id),
              },
              {
                label: 'Nomor PO',
                value: purchaseOrder?.po_number || '-',
              },
            ]
          : [],
        customer: customer
          ? [
              {
                label: 'Customer ID',
                value: customer?.id || '-',
                copyable: Boolean(customer?.id),
              },
              {
                label: 'Nama Customer',
                value: customer?.nama_customer || customer?.name || '-',
              },
              {
                label: 'Kode Customer',
                value: customer?.kode_customer || customer?.code || '-',
              },
            ]
          : [],
        supplier: supplier
          ? [
              {
                label: 'Supplier ID',
                value: supplier?.id || '-',
                copyable: Boolean(supplier?.id),
              },
              {
                label: 'Nama Supplier',
                value: supplier?.nama_supplier || supplier?.name || '-',
              },
              {
                label: 'Kode Supplier',
                value: supplier?.code || '-',
              },
            ]
          : [],
        packing: packing
          ? [
              {
                label: 'Packing ID',
                value: packing?.id || '-',
                copyable: Boolean(packing?.id),
              },
              {
                label: 'Nomor Packing',
                value: packing?.packing_number || '-',
              },
              {
                label: 'Tanggal Packing',
                value: formatDateTime(packing?.tanggal_packing),
              },
              {
                label: 'Sudah Dicetak',
                value: formatBooleanValue(packing?.is_printed),
              },
              {
                label: 'Jumlah Cetak',
                value: formatNumberValue(packing?.print_counter),
              },
            ]
          : [],
        packingItems: packingItems.map((item, itemIndex) => ({
          key: item?.id || `packing-item-${index}-${itemIndex}`,
          data: {
            id: item?.id || '-',
            namaBarang: item?.nama_barang || '-',
            totalQty: formatNumberValue(item?.total_qty),
            jumlahCarton: formatNumberValue(item?.jumlah_carton),
            isiPerCarton: formatNumberValue(item?.isi_per_carton),
            noBox: item?.no_box || '-',
            isMixedCarton: formatBooleanValue(item?.is_mixed_carton),
            inventoryId: item?.inventoryId || '-',
          },
        })),
        invoice: suratJalan?.invoice
          ? [
              {
                label: 'Invoice ID',
                value: suratJalan?.invoice?.id || '-',
                copyable: Boolean(suratJalan?.invoice?.id),
              },
              {
                label: 'Nomor Invoice',
                value: suratJalan?.invoice?.no_invoice || '-',
              },
              {
                label: 'Total Invoice',
                value: suratJalan?.invoice?.total_price || '-',
              },
            ]
          : [],
      };
    });
  }, [checklist]);

  const auditTrailEntries = useMemo(() => {
    if (!Array.isArray(checklist?.auditTrails)) {
      return [];
    }

    return checklist.auditTrails.map((trail) => ({
      id: trail?.id || `${trail?.action}-${trail?.timestamp}`,
      action: trail?.action || '-',
      timestamp: formatDateTime(trail?.timestamp),
      userId: trail?.userId || '-',
    }));
  }, [checklist]);

  if (!isOpen) {
    return null;
  }

  const handleExportPdf = () => {
    if (isLoading || !checklist) {
      return;
    }
    exportCheckingListToPDF(checklist);
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'>
      <div className='flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              Detail Checklist Surat Jalan
            </h2>
            <p className='text-sm text-gray-500'>
              Ringkasan informasi checklist beserta data surat jalan terkait.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={handleExportPdf}
              disabled={isLoading || !checklist}
              className='inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
            >
              <ArrowDownTrayIcon className='h-5 w-5' />
              <span>Export PDF</span>
            </button>
            <button
              type='button'
              onClick={onClose}
              className='rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              aria-label='Tutup detail checklist'
            >
              <XMarkIcon className='h-6 w-6' />
            </button>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto px-6 py-6'>
          {isLoading ? (
            <div className='flex h-48 items-center justify-center text-sm text-gray-500'>
              <div className='h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent'></div>
              <span className='ml-3'>Memuat detail checklist...</span>
            </div>
          ) : !checklist ? (
            <div className='flex h-48 items-center justify-center text-sm text-gray-500'>
              Data checklist tidak ditemukan.
            </div>
          ) : (
            <div className='space-y-8'>
              <section>
                <h3 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>
                  Informasi Checklist
                </h3>
              <InfoTable data={baseInfo} />
              </section>

              {suratJalanSections.length > 0 && (
                <section>
                  <h3 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>
                    Data Surat Jalan
                  </h3>
                  <div className='mt-4 space-y-6'>
                    {suratJalanSections.map((section) => (
                      <div
                        key={section.key}
                        className='rounded-lg border border-gray-200 bg-white shadow-sm'
                      >
                        <div className='border-b border-gray-200 px-4 py-3'>
                          <h4 className='text-base font-semibold text-gray-900'>
                            {section.title}
                          </h4>
                        </div>
                        <div className='space-y-6 px-4 py-4'>
                          <InfoTable data={section.info} />

                          {section.purchaseOrder.length > 0 && (
                            <div>
                              <h5 className='mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500'>
                                Purchase Order
                              </h5>
                              <InfoTable data={section.purchaseOrder} />
                            </div>
                          )}

                          {section.customer.length > 0 && (
                            <div>
                              <h5 className='mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500'>
                                Data Customer
                              </h5>
                              <InfoTable data={section.customer} />
                            </div>
                          )}

                          {section.supplier.length > 0 && (
                            <div>
                              <h5 className='mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500'>
                                Data Supplier
                              </h5>
                              <InfoTable data={section.supplier} />
                            </div>
                          )}

                          {section.packing.length > 0 && (
                            <div>
                              <h5 className='mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500'>
                                Data Packing
                              </h5>
                              <InfoTable data={section.packing} />

                              {section.packingItems.length > 0 ? (
                                <div className='mt-4 overflow-x-auto rounded-lg border border-gray-200'>
                                  <table className='min-w-full divide-y divide-gray-200'>
                                    <thead className='bg-gray-50'>
                                      <tr>
                                        <th className='px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500'>
                                          Nama Barang
                                        </th>
                                        <th className='px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500'>
                                          Total Qty
                                        </th>
                                        <th className='px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500'>
                                          Jumlah Carton
                                        </th>
                                        <th className='px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500'>
                                          Isi per Carton
                                        </th>
                                        <th className='px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500'>
                                          No Box
                                        </th>
                                        <th className='px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500'>
                                          Mixed Carton
                                        </th>
                                        <th className='px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500'>
                                          Inventory ID
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className='divide-y divide-gray-200 bg-white'>
                                      {section.packingItems.map((item) => (
                                        <tr key={item.key} className='hover:bg-gray-50'>
                                          <td className='whitespace-nowrap px-4 py-2 text-sm text-gray-700'>
                                            {item.data.namaBarang}
                                          </td>
                                          <td className='whitespace-nowrap px-4 py-2 text-sm text-gray-700'>
                                            {item.data.totalQty}
                                          </td>
                                          <td className='whitespace-nowrap px-4 py-2 text-sm text-gray-700'>
                                            {item.data.jumlahCarton}
                                          </td>
                                          <td className='whitespace-nowrap px-4 py-2 text-sm text-gray-700'>
                                            {item.data.isiPerCarton}
                                          </td>
                                          <td className='whitespace-nowrap px-4 py-2 text-sm text-gray-700'>
                                            {item.data.noBox}
                                          </td>
                                          <td className='whitespace-nowrap px-4 py-2 text-sm text-gray-700'>
                                            {item.data.isMixedCarton}
                                          </td>
                                          <td className='whitespace-nowrap px-4 py-2 text-sm text-gray-700'>
                                            {item.data.inventoryId}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className='mt-3 rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500'>
                                  Tidak ada data packing item.
                                </div>
                              )}
                            </div>
                          )}

                          {section.invoice.length > 0 && (
                            <div>
                              <h5 className='mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500'>
                                Data Invoice
                              </h5>
                              <InfoTable data={section.invoice} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {auditTrailEntries.length > 0 && (
                <section>
                  <h3 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>
                    Audit Trail
                  </h3>
                  <div className='mt-3 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4'>
                    {auditTrailEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className='rounded-md border border-gray-200 bg-white p-3 shadow-sm'
                      >
                        <p className='text-sm font-medium text-gray-900'>
                          {entry.action}
                        </p>
                        <p className='mt-1 text-xs text-gray-500'>
                          {entry.timestamp}
                        </p>
                        <p className='mt-1 text-xs text-gray-400'>
                          User ID: {entry.userId}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckingListDetailModal;

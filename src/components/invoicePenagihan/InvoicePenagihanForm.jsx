import React, { useEffect, useMemo, useState } from 'react';

const numberFields = [
  'sub_total',
  'total_discount',
  'total_price',
  'ppn_percentage',
  'ppn_rupiah',
  'grand_total',
];

const detailNumberFields = [
  'quantity',
  'harga',
  'total',
  'discount_percentage',
  'discount_rupiah',
];

const emptyDetailRow = () => ({
  nama_barang: '',
  PLU: '',
  quantity: '',
  satuan: '',
  harga: '',
  total: '',
  discount_percentage: '',
  discount_rupiah: '',
});

const booleanToString = (value) => {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true'
      ? 'true'
      : value.toLowerCase() === 'false'
        ? 'false'
        : '';
  }
  return '';
};

const parseBoolean = (value) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return false;
};

const sanitizeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildInitialState = (initialValues) => ({
  purchaseOrderId: initialValues?.purchaseOrderId || '',
  termOfPaymentId: initialValues?.termOfPaymentId || '',
  statusId: initialValues?.statusId || '',
  tanggal: initialValues?.tanggal ? initialValues.tanggal.substring(0, 10) : '',
  kepada: initialValues?.kepada || '',
  sub_total:
    initialValues?.sub_total != null ? String(initialValues.sub_total) : '',
  total_discount:
    initialValues?.total_discount != null
      ? String(initialValues.total_discount)
      : '',
  total_price:
    initialValues?.total_price != null ? String(initialValues.total_price) : '',
  ppn_percentage:
    initialValues?.ppn_percentage != null
      ? String(initialValues.ppn_percentage)
      : '11',
  ppn_rupiah:
    initialValues?.ppn_rupiah != null ? String(initialValues.ppn_rupiah) : '',
  grand_total:
    initialValues?.grand_total != null ? String(initialValues.grand_total) : '',
  kw: booleanToString(initialValues?.kw),
  fp: booleanToString(initialValues?.fp),
  invoicePenagihanDetails:
    initialValues?.invoicePenagihanDetails &&
    initialValues.invoicePenagihanDetails.length > 0
      ? initialValues.invoicePenagihanDetails.map((detail) => ({
          nama_barang: detail.nama_barang || '',
          PLU: detail.PLU || '',
          quantity: detail.quantity != null ? String(detail.quantity) : '',
          satuan: detail.satuan || '',
          harga: detail.harga != null ? String(detail.harga) : '',
          total: detail.total != null ? String(detail.total) : '',
          discount_percentage:
            detail.discount_percentage != null
              ? String(detail.discount_percentage)
              : '',
          discount_rupiah:
            detail.discount_rupiah != null
              ? String(detail.discount_rupiah)
              : '',
        }))
      : [emptyDetailRow()],
});

const InvoicePenagihanForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel,
  loading,
}) => {
  const [formState, setFormState] = useState(() =>
    buildInitialState(initialValues)
  );
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormState(buildInitialState(initialValues));
    setErrors({});
  }, [initialValues]);

  const detailErrors = useMemo(
    () => errors.invoicePenagihanDetails || [],
    [errors]
  );

  const handleChange = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleDetailChange = (index, field, value) => {
    setFormState((prev) => {
      const updated = [...prev.invoicePenagihanDetails];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return {
        ...prev,
        invoicePenagihanDetails: updated,
      };
    });

    if (detailErrors[index]?.[field]) {
      setErrors((prev) => {
        const newDetailErrors = [...(prev.invoicePenagihanDetails || [])];
        newDetailErrors[index] = {
          ...(newDetailErrors[index] || {}),
          [field]: undefined,
        };
        return {
          ...prev,
          invoicePenagihanDetails: newDetailErrors,
        };
      });
    }
  };

  const addDetailRow = () => {
    setFormState((prev) => ({
      ...prev,
      invoicePenagihanDetails: [
        ...prev.invoicePenagihanDetails,
        emptyDetailRow(),
      ],
    }));
  };

  const removeDetailRow = (index) => {
    setFormState((prev) => ({
      ...prev,
      invoicePenagihanDetails: prev.invoicePenagihanDetails.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formState.purchaseOrderId.trim()) {
      newErrors.purchaseOrderId = 'Purchase Order ID wajib diisi.';
    }
    if (!formState.termOfPaymentId.trim()) {
      newErrors.termOfPaymentId = 'Term of Payment ID wajib diisi.';
    }
    if (!formState.statusId.trim()) {
      newErrors.statusId = 'Status ID wajib diisi.';
    }
    if (!formState.kepada.trim()) {
      newErrors.kepada = 'Nama penerima wajib diisi.';
    }
    if (!formState.tanggal) {
      newErrors.tanggal = 'Tanggal invoice wajib diisi.';
    }

    numberFields.forEach((field) => {
      const value = formState[field];
      if (value === '' || value === null || value === undefined) {
        if (
          [
            'sub_total',
            'total_discount',
            'total_price',
            'ppn_percentage',
            'ppn_rupiah',
            'grand_total',
          ].includes(field)
        ) {
          if (field !== 'total_discount') {
            newErrors[field] = 'Field ini wajib diisi.';
          }
        }
        return;
      }
      if (Number.isNaN(Number(value))) {
        newErrors[field] = 'Masukkan angka yang valid.';
      }
      if (Number(value) < 0) {
        newErrors[field] = 'Nilai tidak boleh negatif.';
      }
    });

    const detailsError = [];

    formState.invoicePenagihanDetails.forEach((detail, index) => {
      const detailError = {};
      const isRowFilled = Object.values(detail).some(
        (value) => String(value || '').trim() !== ''
      );

      if (isRowFilled) {
        [
          'nama_barang',
          'PLU',
          'quantity',
          'satuan',
          'harga',
          'total',
          'discount_percentage',
          'discount_rupiah',
        ].forEach((field) => {
          const value = detail[field];
          if (value === '' || value === null || value === undefined) {
            detailError[field] = 'Field ini wajib diisi.';
            return;
          }
          if (
            detailNumberFields.includes(field) &&
            Number.isNaN(Number(value))
          ) {
            detailError[field] = 'Masukkan angka yang valid.';
          }
        });
      }

      detailsError[index] = detailError;
    });

    if (
      detailsError.some((detailError) => Object.keys(detailError).length > 0)
    ) {
      newErrors.invoicePenagihanDetails = detailsError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    const payload = {
      purchaseOrderId: formState.purchaseOrderId.trim(),
      termOfPaymentId: formState.termOfPaymentId.trim(),
      statusId: formState.statusId.trim(),
      tanggal: formState.tanggal,
      kepada: formState.kepada.trim(),
      kw: parseBoolean(formState.kw),
      fp: parseBoolean(formState.fp),
      sub_total: sanitizeNumber(formState.sub_total),
      total_discount: sanitizeNumber(formState.total_discount),
      total_price: sanitizeNumber(formState.total_price),
      ppn_percentage: sanitizeNumber(formState.ppn_percentage),
      ppn_rupiah: sanitizeNumber(formState.ppn_rupiah),
      grand_total: sanitizeNumber(formState.grand_total),
      invoicePenagihanDetails: formState.invoicePenagihanDetails
        .filter((detail) =>
          Object.values(detail).some(
            (value) => String(value || '').trim() !== ''
          )
        )
        .map((detail) => ({
          nama_barang: detail.nama_barang.trim(),
          PLU: detail.PLU.trim(),
          quantity: sanitizeNumber(detail.quantity),
          satuan: detail.satuan.trim(),
          harga: sanitizeNumber(detail.harga),
          total: sanitizeNumber(detail.total),
          discount_percentage: sanitizeNumber(detail.discount_percentage),
          discount_rupiah: sanitizeNumber(detail.discount_rupiah),
        })),
    };

    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <section className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div>
          <label
            htmlFor='purchaseOrderId'
            className='block text-sm font-medium text-gray-700'
          >
            Purchase Order ID *
          </label>
          <input
            id='purchaseOrderId'
            name='purchaseOrderId'
            type='text'
            value={formState.purchaseOrderId}
            onChange={(e) => handleChange('purchaseOrderId', e.target.value)}
            className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Masukkan Purchase Order ID'
          />
          {errors.purchaseOrderId && (
            <p className='mt-1 text-sm text-red-600'>
              {errors.purchaseOrderId}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='termOfPaymentId'
            className='block text-sm font-medium text-gray-700'
          >
            Term of Payment ID *
          </label>
          <input
            id='termOfPaymentId'
            name='termOfPaymentId'
            type='text'
            value={formState.termOfPaymentId}
            onChange={(e) => handleChange('termOfPaymentId', e.target.value)}
            className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Masukkan Term of Payment ID'
          />
          {errors.termOfPaymentId && (
            <p className='mt-1 text-sm text-red-600'>
              {errors.termOfPaymentId}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='statusId'
            className='block text-sm font-medium text-gray-700'
          >
            Status ID *
          </label>
          <input
            id='statusId'
            name='statusId'
            type='text'
            value={formState.statusId}
            onChange={(e) => handleChange('statusId', e.target.value)}
            className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Masukkan Status ID'
          />
          {errors.statusId && (
            <p className='mt-1 text-sm text-red-600'>{errors.statusId}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='tanggal'
            className='block text-sm font-medium text-gray-700'
          >
            Tanggal *
          </label>
          <input
            id='tanggal'
            name='tanggal'
            type='date'
            value={formState.tanggal}
            onChange={(e) => handleChange('tanggal', e.target.value)}
            className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {errors.tanggal && (
            <p className='mt-1 text-sm text-red-600'>{errors.tanggal}</p>
          )}
        </div>

        <div className='md:col-span-2'>
          <label
            htmlFor='kepada'
            className='block text-sm font-medium text-gray-700'
          >
            Kepada *
          </label>
          <input
            id='kepada'
            name='kepada'
            type='text'
            value={formState.kepada}
            onChange={(e) => handleChange('kepada', e.target.value)}
            className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Nama penerima invoice'
          />
          {errors.kepada && (
            <p className='mt-1 text-sm text-red-600'>{errors.kepada}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='kw'
            className='block text-sm font-medium text-gray-700'
          >
            Status KW
          </label>
          <select
            id='kw'
            name='kw'
            value={formState.kw}
            onChange={(e) => handleChange('kw', e.target.value)}
            className='block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>Pilih Status</option>
            <option value='true'>Ya</option>
            <option value='false'>Tidak</option>
          </select>
        </div>

        <div>
          <label
            htmlFor='fp'
            className='block text-sm font-medium text-gray-700'
          >
            Status FP
          </label>
          <select
            id='fp'
            name='fp'
            value={formState.fp}
            onChange={(e) => handleChange('fp', e.target.value)}
            className='block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>Pilih Status</option>
            <option value='true'>Ya</option>
            <option value='false'>Tidak</option>
          </select>
        </div>
      </section>

      <section className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <div>
          <label
            htmlFor='sub_total'
            className='block text-sm font-medium text-gray-700'
          >
            Sub Total *
          </label>
          <input
            id='sub_total'
            name='sub_total'
            type='number'
            step='0.01'
            value={formState.sub_total}
            onChange={(e) => handleChange('sub_total', e.target.value)}
            className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Nilai subtotal'
          />
          {errors.sub_total && (
            <p className='mt-1 text-sm text-red-600'>{errors.sub_total}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='total_discount'
            className='block text-sm font-medium text-gray-700'
          >
            Total Diskon
          </label>
          <input
            id='total_discount'
            name='total_discount'
            type='number'
            step='0.01'
            value={formState.total_discount}
            onChange={(e) => handleChange('total_discount', e.target.value)}
            className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Diskon total (opsional)'
          />
          {errors.total_discount && (
            <p className='mt-1 text-sm text-red-600'>{errors.total_discount}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='total_price'
            className='block text-sm font-medium text-gray-700'
          >
            Total Harga *
          </label>
          <input
            id='total_price'
            name='total_price'
            type='number'
            step='0.01'
            value={formState.total_price}
            onChange={(e) => handleChange('total_price', e.target.value)}
            className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Nilai total setelah diskon'
          />
          {errors.total_price && (
            <p className='mt-1 text-sm text-red-600'>{errors.total_price}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='ppn_percentage'
            className='block text-sm font-medium text-gray-700'
          >
            PPN (%) *
          </label>
          <input
            id='ppn_percentage'
            name='ppn_percentage'
            type='number'
            step='0.01'
            value={formState.ppn_percentage}
            onChange={(e) => handleChange('ppn_percentage', e.target.value)}
            className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Persentase PPN'
          />
          {errors.ppn_percentage && (
            <p className='mt-1 text-sm text-red-600'>{errors.ppn_percentage}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='ppn_rupiah'
            className='block text-sm font-medium text-gray-700'
          >
            PPN (Rp) *
          </label>
          <input
            id='ppn_rupiah'
            name='ppn_rupiah'
            type='number'
            step='0.01'
            value={formState.ppn_rupiah}
            onChange={(e) => handleChange('ppn_rupiah', e.target.value)}
            className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Nilai PPN dalam Rupiah'
          />
          {errors.ppn_rupiah && (
            <p className='mt-1 text-sm text-red-600'>{errors.ppn_rupiah}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='grand_total'
            className='block text-sm font-medium text-gray-700'
          >
            Grand Total *
          </label>
          <input
            id='grand_total'
            name='grand_total'
            type='number'
            step='0.01'
            value={formState.grand_total}
            onChange={(e) => handleChange('grand_total', e.target.value)}
            className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Total akhir invoice'
          />
          {errors.grand_total && (
            <p className='mt-1 text-sm text-red-600'>{errors.grand_total}</p>
          )}
        </div>
      </section>

      <section className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-gray-900'>Detail Barang</h3>
          <button
            type='button'
            onClick={addDetailRow}
            className='inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          >
            Tambah Detail
          </button>
        </div>

        {formState.invoicePenagihanDetails.map((detail, index) => {
          const fieldErrors = detailErrors[index] || {};
          return (
            <div
              key={detail.nama_barang + index}
              className='p-4 space-y-4 border border-gray-200 rounded-lg bg-gray-50'
            >
              <div className='flex items-center justify-between'>
                <h4 className='text-sm font-semibold text-gray-700'>
                  Detail #{index + 1}
                </h4>
                {formState.invoicePenagihanDetails.length > 1 && (
                  <button
                    type='button'
                    onClick={() => removeDetailRow(index)}
                    className='text-sm font-medium text-red-600 hover:text-red-700'
                  >
                    Hapus
                  </button>
                )}
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Nama Barang *
                  </label>
                  <input
                    type='text'
                    value={detail.nama_barang}
                    onChange={(e) =>
                      handleDetailChange(index, 'nama_barang', e.target.value)
                    }
                    className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Nama barang'
                  />
                  {fieldErrors.nama_barang && (
                    <p className='mt-1 text-sm text-red-600'>
                      {fieldErrors.nama_barang}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    PLU *
                  </label>
                  <input
                    type='text'
                    value={detail.PLU}
                    onChange={(e) =>
                      handleDetailChange(index, 'PLU', e.target.value)
                    }
                    className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Kode PLU'
                  />
                  {fieldErrors.PLU && (
                    <p className='mt-1 text-sm text-red-600'>
                      {fieldErrors.PLU}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Quantity *
                  </label>
                  <input
                    type='number'
                    step='1'
                    value={detail.quantity}
                    onChange={(e) =>
                      handleDetailChange(index, 'quantity', e.target.value)
                    }
                    className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Jumlah'
                  />
                  {fieldErrors.quantity && (
                    <p className='mt-1 text-sm text-red-600'>
                      {fieldErrors.quantity}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Satuan *
                  </label>
                  <input
                    type='text'
                    value={detail.satuan}
                    onChange={(e) =>
                      handleDetailChange(index, 'satuan', e.target.value)
                    }
                    className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Satuan barang'
                  />
                  {fieldErrors.satuan && (
                    <p className='mt-1 text-sm text-red-600'>
                      {fieldErrors.satuan}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Harga *
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    value={detail.harga}
                    onChange={(e) =>
                      handleDetailChange(index, 'harga', e.target.value)
                    }
                    className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Harga per item'
                  />
                  {fieldErrors.harga && (
                    <p className='mt-1 text-sm text-red-600'>
                      {fieldErrors.harga}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Diskon (%) *
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    value={detail.discount_percentage}
                    onChange={(e) =>
                      handleDetailChange(
                        index,
                        'discount_percentage',
                        e.target.value
                      )
                    }
                    className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Diskon persen'
                  />
                  {fieldErrors.discount_percentage && (
                    <p className='mt-1 text-sm text-red-600'>
                      {fieldErrors.discount_percentage}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Diskon (Rp) *
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    value={detail.discount_rupiah}
                    onChange={(e) =>
                      handleDetailChange(
                        index,
                        'discount_rupiah',
                        e.target.value
                      )
                    }
                    className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Diskon rupiah'
                  />
                  {fieldErrors.discount_rupiah && (
                    <p className='mt-1 text-sm text-red-600'>
                      {fieldErrors.discount_rupiah}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Total *
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    value={detail.total}
                    onChange={(e) =>
                      handleDetailChange(index, 'total', e.target.value)
                    }
                    className='block w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Total per item'
                  />
                  {fieldErrors.total && (
                    <p className='mt-1 text-sm text-red-600'>
                      {fieldErrors.total}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
        <button
          type='button'
          onClick={onCancel}
          className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          disabled={loading}
        >
          Batal
        </button>
        <button
          type='submit'
          className='inline-flex justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60'
          disabled={loading}
        >
          {loading ? 'Menyimpan...' : submitLabel || 'Simpan'}
        </button>
      </div>
    </form>
  );
};

export default InvoicePenagihanForm;

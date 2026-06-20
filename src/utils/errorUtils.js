/**
 * Utility functions for parsing and formatting API error responses
 */

/**
 * Parse Zod validation error messages
 * Zod errors typically come as a stringified JSON array in the message field
 * @param {string} messageString - The stringified JSON array of validation errors
 * @returns {string|null} Formatted error message or null if not parseable
 */
export const parseZodValidationErrors = (messageString) => {
    try {
        // Try to parse as JSON array
        const errors = JSON.parse(messageString);

        if (!Array.isArray(errors) || errors.length === 0) {
            return null;
        }

        // Map error codes to Indonesian messages
        const errorCodeMessages = {
            'invalid_type': (err) => {
                const expected = err.expected;
                const received = err.received;
                if (received === 'null' || received === 'undefined') {
                    if (expected === 'string') return 'Wajib diisi (harus berupa teks)';
                    if (expected === 'number') return 'Wajib diisi (harus berupa angka)';
                    return 'Wajib diisi';
                }
                if (expected === 'string') return `Harus berupa teks, bukan ${received}`;
                if (expected === 'number') return `Harus berupa angka, bukan ${received}`;
                return `Tipe data tidak valid: diharapkan ${expected}, diterima ${received}`;
            },
            'too_small': (err) => {
                if (err.type === 'string') return `Minimal ${err.minimum} karakter`;
                if (err.type === 'number') return `Minimal nilai ${err.minimum}`;
                if (err.type === 'array') return `Minimal ${err.minimum} item`;
                return `Nilai terlalu kecil (minimal ${err.minimum})`;
            },
            'too_big': (err) => {
                if (err.type === 'string') return `Maksimal ${err.maximum} karakter`;
                if (err.type === 'number') return `Maksimal nilai ${err.maximum}`;
                if (err.type === 'array') return `Maksimal ${err.maximum} item`;
                return `Nilai terlalu besar (maksimal ${err.maximum})`;
            },
            'invalid_string': (err) => {
                if (err.validation === 'email') return 'Format email tidak valid';
                if (err.validation === 'url') return 'Format URL tidak valid';
                if (err.validation === 'uuid') return 'Format UUID tidak valid';
                return 'Format tidak valid';
            },
            'invalid_enum_value': (err) => {
                const options = err.options?.join(', ') || '';
                return `Nilai tidak valid. Pilihan: ${options}`;
            },
            'custom': (err) => err.message || 'Validasi gagal',
            'unrecognized_keys': (err) => {
                const keys = err.keys?.join(', ') || '';
                return `Field tidak dikenal: ${keys}`;
            }
        };

        // Format each error
        const formattedErrors = errors.map((err) => {
            const path = Array.isArray(err.path) && err.path.length > 0
                ? err.path.join('.')
                : 'Field';

            const messageFormatter = errorCodeMessages[err.code];
            const message = messageFormatter
                ? messageFormatter(err)
                : err.message || 'Validasi gagal';

            return `${path}: ${message}`;
        });

        return formattedErrors.join('\n');
    } catch {
        // Not a valid JSON array, return null
        return null;
    }
};

/**
 * Extract error message from API error response
 * Handles various error response formats including Zod validation errors
 * @param {Object|string} errorData - The error data from the response
 * @param {string} fallbackMessage - Fallback message if no error can be extracted
 * @returns {string} The extracted or formatted error message
 */
export const extractErrorMessage = (errorData, fallbackMessage) => {
    if (!errorData) {
        return fallbackMessage;
    }

    if (typeof errorData === 'string' && errorData.trim()) {
        // Check if it's a stringified JSON array (Zod validation errors)
        const zodErrors = parseZodValidationErrors(errorData);
        if (zodErrors) {
            return zodErrors;
        }
        return errorData;
    }

    if (typeof errorData.message === 'string' && errorData.message.trim()) {
        // Check if the message is a stringified JSON array (Zod validation errors)
        const zodErrors = parseZodValidationErrors(errorData.message);
        if (zodErrors) {
            return zodErrors;
        }
        return errorData.message;
    }

    if (typeof errorData.error === 'string' && errorData.error.trim()) {
        return errorData.error;
    }

    if (errorData.error && typeof errorData.error.message === 'string' && errorData.error.message.trim()) {
        return errorData.error.message;
    }

    if (Array.isArray(errorData.errors) && errorData.errors.length) {
        const firstError = errorData.errors[0];

        if (typeof firstError === 'string' && firstError.trim()) {
            return firstError;
        }

        if (firstError && typeof firstError.message === 'string' && firstError.message.trim()) {
            return firstError.message;
        }
    }

    return fallbackMessage;
};

/**
 * Parse error message from a fetch Response object
 * @param {Response} response - The fetch response object
 * @param {string} fallbackMessage - Fallback message if parsing fails
 * @returns {Promise<string>} The extracted error message
 */
export const parseErrorMessage = async (response, fallbackMessage) => {
    try {
        const errorData = await response.json();
        return extractErrorMessage(errorData, fallbackMessage);
    } catch {
        return fallbackMessage;
    }
};

const fieldNameMappings = {
    // Scheduled Price / Item Price
    plu: 'PLU Item',
    kodeCustomer: 'Kode Customer',
    effectiveDate: 'Tanggal Efektif',
    harga: 'Harga Baru',
    pot1: 'Potongan A (%)',
    harga1: 'Harga Setelah Pot A',
    pot2: 'Potongan B (%)',
    harga2: 'Harga Setelah Pot B',
    ppn: 'PPN (%)',
    notes: 'Catatan',

    // Term of Payment
    topCode: 'Kode Term of Payment',
    topName: 'Nama Term of Payment',
    topDays: 'Jumlah Hari',
    kode_top: 'Kode Term of Payment',
    batas_hari: 'Batas Hari',

    // Supplier
    supplierCode: 'Kode Supplier',
    supplierName: 'Nama Supplier',
    picName: 'Nama PIC',
    picPhone: 'No. Telp PIC',
    name: 'Nama',
    code: 'Kode',
    supplier_code_letter: 'Kode Surat Jalan',
    description: 'Deskripsi',
    address: 'Alamat',
    phoneNumber: 'Nomor Telepon',
    email: 'Email',
    fax: 'Nomor Fax',
    direktur: 'Direktur',
    npwp: 'NPWP',
    id_tku: 'ID TKU',
    bankName: 'Nama Bank',
    accountNumber: 'Nomor Rekening',
    accountHolder: 'Pemilik Rekening',

    // Customer Group
    custGroupCode: 'Kode Group Customer',
    custGroupName: 'Nama Group Customer',
    kode_group: 'Kode Group Customer',
    nama_group: 'Nama Group Customer',
    parent_group: 'Parent Group Customer',
    alamat: 'Alamat',

    // Item
    itemName: 'Nama Item',
    category: 'Kategori',
    unit: 'Satuan',
    barcode: 'Barcode',
    item_code: 'Kode Item',
    nama_barang: 'Nama Barang',
    eanBarcode: 'EAN Barcode',
    uom: 'Satuan (UOM)',
    allow_mixed_carton: 'Boleh Mixed Karton',
    tax_category: 'Kategori Pajak',
    tax_code: 'Kode Pajak',
    uom_djp_code: 'Kode UOM DJP',
    dimensi_berat: 'Dimensi Berat',
    dimensi_panjang: 'Dimensi Panjang',
    dimensi_lebar: 'Dimensi Lebar',
    dimensi_tinggi: 'Dimensi Tinggi',
    karton_berat: 'Berat Karton',
    karton_panjang: 'Panjang Karton',
    karton_lebar: 'Lebar Karton',
    karton_tinggi: 'Tinggi Karton',
    stok_quantity: 'Jumlah Stok',
    min_stok: 'Stok Minimal',
    qty_per_carton: 'Qty Per Karton',

    // Customer
    customerCode: 'Kode Customer',
    namaCustomer: 'Nama Customer',
    groupCustomerCode: 'Kode Group Customer',
    alamatPengiriman: 'Alamat Pengiriman',
    alamatNPWP: 'Alamat NPWP',
    region: 'Wilayah/Region',
    phone: 'No. Telepon',
    taxType: 'Tipe Pajak',
    priceType: 'Tipe Harga',
};

/**
 * Parse and structure bulk upload error reason
 * @param {string} reasonText - The raw error reason from status response
 * @returns {Object|null} Parsed error details
 */
export const parseBulkUploadReason = (reasonText) => {
    if (!reasonText) return null;

    // Case 1: Zod validation error at a specific row
    // Format: "Invalid data at row X: [JSON_ARRAY]"
    const rowMatch = reasonText.match(/^Invalid data at row (\d+):\s*(.+)$/s);
    if (rowMatch) {
        const rowNum = parseInt(rowMatch[1], 10);
        const jsonContent = rowMatch[2];
        try {
            const errors = JSON.parse(jsonContent);
            if (Array.isArray(errors)) {
                return {
                    type: 'zod_validation',
                    row: rowNum,
                    errors: errors.map(err => {
                        const path = Array.isArray(err.path) && err.path.length > 0
                            ? err.path.join('.')
                            : '';
                        
                        const fieldName = fieldNameMappings[path] || 
                            path.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim() ||
                            'Field';

                        let msg = err.message || 'Validasi gagal';
                        
                        // Check if the error message is a default Zod English message
                        const isDefaultZod = !err.message || 
                            /expected/i.test(err.message) || 
                            /received/i.test(err.message) || 
                            /must contain/i.test(err.message) || 
                            /greater than/i.test(err.message) || 
                            /less than/i.test(err.message) || 
                            /required/i.test(err.message);

                        if (isDefaultZod) {
                            if (err.code === 'invalid_type') {
                                if (err.received === 'null' || err.received === 'undefined') {
                                    msg = 'Wajib diisi';
                                } else {
                                    msg = `Format tidak sesuai (diharapkan ${err.expected})`;
                                }
                            } else if (err.code === 'too_small') {
                                if (err.type === 'number') {
                                    msg = `Nilai minimal ${err.minimum}`;
                                } else if (err.type === 'string') {
                                    msg = `Minimal ${err.minimum} karakter`;
                                }
                            } else if (err.code === 'too_big') {
                                if (err.type === 'number') {
                                    msg = `Nilai maksimal ${err.maximum}`;
                                } else if (err.type === 'string') {
                                    msg = `Maksimal ${err.maximum} karakter`;
                                }
                            }
                        }
                        return { field: fieldName, message: msg };
                    })
                };
            }
        } catch (e) {
            // Not JSON, fallback to row_error
            return {
                type: 'row_error',
                row: rowNum,
                message: jsonContent
            };
        }
    }

    // Case 2: Multi-row processing errors
    // Format: "X error(s): err1; err2; ..."
    const errorMatch = reasonText.match(/^(\d+) error\(s\): (.+)$/s);
    if (errorMatch) {
        const total = parseInt(errorMatch[1], 10);
        const content = errorMatch[2];
        const errors = content.split(';').map(e => e.trim()).filter(Boolean);
        return {
            type: 'multiple_errors',
            total,
            errors
        };
    }

    // Case 3: Standard single error message
    return {
        type: 'single_error',
        message: reasonText
    };
};

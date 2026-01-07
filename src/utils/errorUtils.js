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

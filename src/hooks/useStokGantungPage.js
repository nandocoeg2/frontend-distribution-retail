import { useCallback, useEffect, useMemo } from 'react';
import usePaginatedSearch from './usePaginatedSearch';
import {
    getStokGantung,
    createReturn,
    classifyReturn,
    updateNotes,
    updateStokGantung,
} from '../services/stokGantungService';
import toastService from '../services/toastService';

const INITIAL_FILTERS = {
    search: '',
    status: 'all',
    itemId: '',
    dateFilterType: '',
    startDate: '',
    endDate: '',
};

const INITIAL_PAGINATION = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    page: 1,
    limit: 10,
    total: 0,
};

const toUpper = (value, fallback = '') => {
    if (!value) {
        return fallback;
    }

    return String(value).trim().toUpperCase();
};

const parseStokGantungResponse = (response) => {
    if (response?.success === false) {
        const message =
            response?.error?.message ||
            response?.message ||
            'Failed to load stok gantung';
        throw new Error(message);
    }

    const dataBlock = response?.data || {};
    const items =
        dataBlock?.items ||
        dataBlock?.data ||
        response?.items ||
        response?.data?.data ||
        [];
    const paginationBlock =
        dataBlock?.pagination ||
        response?.pagination ||
        INITIAL_PAGINATION;

    const safeItems = Array.isArray(items) ? items : [];

    const normalizeMovement = (movement) => {
        if (!movement || typeof movement !== 'object') {
            return movement;
        }

        const movementItems = Array.isArray(movement.items)
            ? movement.items
            : Array.isArray(movement.data)
                ? movement.data
                : [];

        const totalQuantity = movementItems.reduce((sum, item) => {
            const quantity = Number(item?.quantity || 0);
            return sum + (Number.isFinite(quantity) ? quantity : 0);
        }, 0);

        const supplierName =
            movement?.supplier?.name ||
            movement?.supplierName ||
            movement?.supplier_name ||
            null;

        const companyName =
            movement?.company?.nama_perusahaan ||
            movement?.companyName ||
            movement?.company_name ||
            null;

        const customerName =
            movement?.customer?.namaCustomer ||
            movement?.purchaseOrder?.customer?.namaCustomer ||
            movement?.customerName ||
            movement?.customer_name ||
            null;

        const poNumber =
            movement?.purchaseOrder?.po_number ||
            movement?.no_po ||
            movement?.po_number ||
            null;

        const lpb = movement?.purchaseOrder?.laporanPenerimaanBarang || null;
        const tanggalLpb = lpb?.tanggal_po || lpb?.createdAt || null;
        const noLpb = lpb?.no_lpb || null;

        const checklist =
            movement?.suratJalan?.checklistSuratJalan ||
            movement?.purchaseOrder?.suratJalan?.checklistSuratJalan ||
            null;
        const expedisi = checklist?.ekspedisi || null;
        const mobil = checklist?.mobil || null;
        const expedisiDriver =
            [expedisi, mobil].filter(Boolean).join(' - ') || null;

        return {
            ...movement,
            type: toUpper(movement.type, 'UNKNOWN'),
            status: toUpper(movement.status, 'UNKNOWN'),
            movementNumber:
                movement.movementNumber ||
                movement.movement_number ||
                movement.documentNumber ||
                movement.document_number ||
                '-',
            notes: movement.notes || movement.description || '',
            poNumber,
            customerName,
            tanggalLpb,
            noLpb,
            expedisi,
            mobil,
            expedisiDriver,
            supplierName,
            companyName,
            createdAt: movement.createdAt || movement.created_at || null,
            updatedAt: movement.updatedAt || movement.updated_at || null,
            totalItems: movementItems.length,
            totalQuantity,
            items: movementItems,
        };
    };

    return {
        results: safeItems.map(normalizeMovement),
        pagination: {
            currentPage:
                paginationBlock.currentPage ||
                paginationBlock.page ||
                INITIAL_PAGINATION.currentPage,
            page:
                paginationBlock.page ||
                paginationBlock.currentPage ||
                INITIAL_PAGINATION.page,
            totalPages:
                paginationBlock.totalPages || INITIAL_PAGINATION.totalPages,
            totalItems:
                paginationBlock.totalItems ||
                paginationBlock.total ||
                INITIAL_PAGINATION.totalItems,
            total:
                paginationBlock.total ||
                paginationBlock.totalItems ||
                INITIAL_PAGINATION.total,
            itemsPerPage:
                paginationBlock.itemsPerPage ||
                paginationBlock.limit ||
                INITIAL_PAGINATION.itemsPerPage,
            limit:
                paginationBlock.limit ||
                paginationBlock.itemsPerPage ||
                INITIAL_PAGINATION.limit,
        },
    };
};

const resolveStokGantungError = (error) => {
    return (
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to load stok gantung'
    );
};

const sanitizeFilters = (filters = {}) => {
    const trimmedSearch =
        typeof filters.search === 'string' ? filters.search.trim() : '';
    const status =
        filters.status && filters.status !== 'all' ? filters.status : undefined;
    const itemId =
        filters.itemId && filters.itemId.trim() !== '' ? filters.itemId : undefined;

    const convertToISO = (dateStr) => {
        if (!dateStr || dateStr.trim() === '') {
            return undefined;
        }
        try {
            const isoDate = new Date(dateStr).toISOString();
            return isoDate;
        } catch (error) {
            return undefined;
        }
    };

    const startDate = convertToISO(filters.startDate);
    const endDate = convertToISO(filters.endDate);

    let dateFilterType =
        filters.dateFilterType && filters.dateFilterType.trim() !== ''
            ? filters.dateFilterType
            : undefined;

    if (dateFilterType === 'custom' && (!startDate || !endDate)) {
        dateFilterType = undefined;
    }

    return {
        search: trimmedSearch || undefined,
        status,
        itemId,
        dateFilterType,
        startDate: dateFilterType === 'custom' ? startDate : undefined,
        endDate: dateFilterType === 'custom' ? endDate : undefined,
    };
};

const useStokGantungPage = () => {
    const {
        input: filters,
        setInput: setFilters,
        searchResults: movements,
        setSearchResults: setMovements,
        pagination,
        setPagination,
        loading,
        error,
        setError,
        performSearch,
        debouncedSearch,
        handlePageChange,
        handleLimitChange,
        resolveLimit,
        handleAuthError,
    } = usePaginatedSearch({
        initialInput: INITIAL_FILTERS,
        initialPagination: INITIAL_PAGINATION,
        searchFn: (filterValue = INITIAL_FILTERS, page = 1, limit = 10) => {
            const params = sanitizeFilters(filterValue);
            return getStokGantung({
                page,
                limit,
                ...params,
            });
        },
        parseResponse: parseStokGantungResponse,
        resolveErrorMessage: resolveStokGantungError,
        toastOnError: false,
    });

    const searchLoading = useMemo(() => {
        if (!loading) {
            return false;
        }

        if (!filters) {
            return false;
        }

        return Boolean(
            typeof filters.search === 'string' && filters.search.trim()
        );
    }, [filters, loading]);

    const fetchMovements = useCallback(
        (page = 1, limit = resolveLimit()) => {
            const activeFilters = filters || INITIAL_FILTERS;
            return performSearch({ ...activeFilters }, page, limit);
        },
        [filters, performSearch, resolveLimit]
    );

    const refreshAfterMutation = useCallback(async () => {
        const currentPage = pagination.currentPage || pagination.page || 1;
        const limit =
            pagination.itemsPerPage || pagination.limit || resolveLimit();

        await fetchMovements(currentPage, limit);
    }, [fetchMovements, pagination, resolveLimit]);

    const createReturnMovement = useCallback(
        async (payload) => {
            setError(null);
            try {
                const result = await createReturn(payload);
                toastService.success('Return berhasil dicatat');
                await refreshAfterMutation();
                return result?.data || result;
            } catch (err) {
                const message =
                    resolveStokGantungError(err) ||
                    'Failed to create return movement';
                setError(message);
                toastService.error(message);
                throw err;
            }
        },
        [refreshAfterMutation, setError]
    );

    const classifyReturnMovement = useCallback(
        async (movementId, payloadOrAction) => {
            setError(null);
            try {
                const result = await classifyReturn(movementId, payloadOrAction);
                const isSplit = typeof payloadOrAction === 'object' && (payloadOrAction.restockQuantity > 0 && payloadOrAction.rejectQuantity > 0);
                const isRestock = typeof payloadOrAction === 'string' ? payloadOrAction === 'restock' : (payloadOrAction.restockQuantity > 0 && payloadOrAction.rejectQuantity === 0);

                const successMessage = isSplit
                    ? `Status return berhasil diperbarui: ${payloadOrAction.restockQuantity} Restock, ${payloadOrAction.rejectQuantity} Reject`
                    : isRestock
                    ? 'Return berhasil direstock dan stok diperbarui (tercatat di Stock In)'
                    : 'Status return berhasil diperbarui';
                toastService.success(successMessage);
                await refreshAfterMutation();
                return result?.data || result;
            } catch (err) {
                const message =
                    resolveStokGantungError(err) ||
                    'Failed to classify return movement';
                setError(message);
                toastService.error(message);
                throw err;
            }
        },
        [refreshAfterMutation, setError]
    );

    const updateMovementDetails = useCallback(
        async (movementId, payload) => {
            setError(null);
            try {
                const result = await updateStokGantung(movementId, payload);
                toastService.success('Data stok gantung berhasil diperbarui');
                await refreshAfterMutation();
                return result?.data || result;
            } catch (err) {
                const message =
                    resolveStokGantungError(err) || 'Failed to update stok gantung data';
                setError(message);
                toastService.error(message);
                throw err;
            }
        },
        [refreshAfterMutation, setError]
    );

    const updateMovementNotes = useCallback(
        async (movementId, notes) => {
            return updateMovementDetails(movementId, { notes });
        },
        [updateMovementDetails]
    );

    const handleFiltersChange = useCallback(
        (changes) => {
            setFilters((prev) => {
                const nextFilters = { ...(prev || INITIAL_FILTERS), ...changes };
                debouncedSearch({ ...nextFilters }, 1, resolveLimit());
                return nextFilters;
            });
        },
        [debouncedSearch, resolveLimit, setFilters]
    );

    const handleResetFilters = useCallback(() => {
        const defaults = { ...INITIAL_FILTERS };
        setFilters(defaults);
        debouncedSearch({ ...defaults }, 1, resolveLimit());
    }, [debouncedSearch, resolveLimit, setFilters]);

    useEffect(() => {
        const defaults = { ...INITIAL_FILTERS };
        setFilters(defaults);
        performSearch(defaults, 1, INITIAL_PAGINATION.itemsPerPage);
    }, [performSearch, setFilters]);

    return {
        filters: filters || INITIAL_FILTERS,
        setFilters,
        movements,
        setMovements,
        pagination,
        setPagination,
        loading,
        searchLoading,
        error,
        setError,
        handleFiltersChange,
        handleResetFilters,
        handlePageChange,
        handleLimitChange,
        fetchMovements,
        resolveLimit,
        handleAuthError,
        createReturnMovement,
        classifyReturnMovement,
        updateMovementNotes,
        updateMovementDetails,
    };
};

export default useStokGantungPage;

import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { createColumnHelper, useReactTable } from "@tanstack/react-table";
import { TrashIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";
import { StatusBadge } from "../ui/Badge";
import { useFakturPajakQuery } from "../../hooks/useFakturPajakQuery";
import { formatCurrency, formatDate } from "../../utils/formatUtils";
import { useServerSideTable } from "../../hooks/useServerSideTable";
import { DataTable, DataTablePagination, TableFooterCell } from "../table";
import AutocompleteCheckboxLimitTag from "../common/AutocompleteCheckboxLimitTag";
import customerService from "../../services/customerService";
import { termOfPaymentService } from "../../services/termOfPaymentService";
import authService from "../../services/authService";
import DateFilter from "../common/DateFilter";
import TextColumnFilter from "../common/TextColumnFilter";
import RangeColumnFilter from "../common/RangeColumnFilter";

const columnHelper = createColumnHelper();

const STATUS_OPTIONS = [
  { id: "PENDING FAKTUR PAJAK", name: "Pending" },
  { id: "PROCESSING FAKTUR PAJAK", name: "Processing" },
  { id: "ISSUED FAKTUR PAJAK", name: "Issued" },
  { id: "CANCELLED FAKTUR PAJAK", name: "Cancelled" },
  { id: "COMPLETED FAKTUR PAJAK", name: "Completed" },
];

const resolveStatusVariant = (status) => {
  const value = typeof status === "string" ? status.toLowerCase() : "";

  if (!value) {
    return "secondary";
  }

  if (value.includes("completed") || value.includes("issued")) {
    return "success";
  }

  if (value.includes("cancelled") || value.includes("failed")) {
    return "danger";
  }

  if (value.includes("processing")) {
    return "warning";
  }

  if (value.includes("pending")) {
    return "secondary";
  }

  return "default";
};

const FakturPajakTableServerSide = ({
  onView,
  onDelete,
  deleteLoading = false,
  initialPage = 1,
  initialLimit = 10,
  selectedFakturPajakId = null,
  onBulkExportEFaktur,
  onBulkDelete,
  onQueryParamsChange,
}) => {
  const [customers, setCustomers] = useState([]);
  const [termOfPayments, setTermOfPayments] = useState([]);
  const [selectedFakturIds, setSelectedFakturIds] = useState([]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Fetch customers
        const customerResponse = await customerService.getAllCustomers(1, 100, {
          hasFakturPajak: true,
        });
        const customerData =
          customerResponse?.data?.data || customerResponse?.data || [];
        setCustomers(Array.isArray(customerData) ? customerData : []);

        // Fetch term of payments
        const topResponse = await termOfPaymentService.getAllTermOfPayments(
          1,
          100,
        );
        const topData = topResponse?.data?.data || topResponse?.data || [];
        setTermOfPayments(Array.isArray(topData) ? topData : []);
      } catch (error) {
        console.error("Failed to fetch dropdown data:", error);
      }
    };
    fetchDropdownData();
  }, []);

  const getQueryParams = useMemo(
    () =>
      ({ filters, ...rest }) => {
        const mappedFilters = { ...filters };

        // Handle date range
        if (mappedFilters.tanggal_invoice) {
          if (mappedFilters.tanggal_invoice.from)
            mappedFilters.tanggal_start = mappedFilters.tanggal_invoice.from;
          if (mappedFilters.tanggal_invoice.to)
            mappedFilters.tanggal_end = mappedFilters.tanggal_invoice.to;
          delete mappedFilters.tanggal_invoice;
        }

        // Handle DPP range
        if (mappedFilters.dasar_pengenaan_pajak) {
          if (mappedFilters.dasar_pengenaan_pajak.min)
            mappedFilters.dasar_pengenaan_pajak_min =
              mappedFilters.dasar_pengenaan_pajak.min;
          if (mappedFilters.dasar_pengenaan_pajak.max)
            mappedFilters.dasar_pengenaan_pajak_max =
              mappedFilters.dasar_pengenaan_pajak.max;
          delete mappedFilters.dasar_pengenaan_pajak;
        }

        // Handle PPN Rupiah range
        if (mappedFilters.ppnRupiah) {
          if (mappedFilters.ppnRupiah.min)
            mappedFilters.ppnRupiah_min = mappedFilters.ppnRupiah.min;
          if (mappedFilters.ppnRupiah.max)
            mappedFilters.ppnRupiah_max = mappedFilters.ppnRupiah.max;
          delete mappedFilters.ppnRupiah;
        }

        // Handle status codes array
        if (mappedFilters.status_codes) {
          if (
            Array.isArray(mappedFilters.status_codes) &&
            mappedFilters.status_codes.length > 0
          ) {
            // keep as status_codes
          } else {
            delete mappedFilters.status_codes;
          }
        }

        // Handle customer names array
        if (mappedFilters.customer_names) {
          if (
            Array.isArray(mappedFilters.customer_names) &&
            mappedFilters.customer_names.length > 0
          ) {
            // keep
          } else {
            delete mappedFilters.customer_names;
          }
        }

        // Handle TOP codes array
        if (mappedFilters.top_codes) {
          if (
            Array.isArray(mappedFilters.top_codes) &&
            mappedFilters.top_codes.length > 0
          ) {
            // keep
          } else {
            delete mappedFilters.top_codes;
          }
        }

        const companyId = authService.getCompanyData()?.id;

        return {
          ...rest,
          filters: {
            ...mappedFilters,
            ...(companyId ? { companyId } : {}),
          },
        };
      },
    [],
  );

  // Stabilize selectData to prevent unnecessary useMemo recomputation in useServerSideTable
  const selectData = useCallback(
    (response) => {
      const items = response?.fakturPajaks ?? [];
      return items.map((item) => ({
        ...item,
        total_faktur_pajak:
          (parseFloat(item.dasar_pengenaan_pajak) || 0) +
          (parseFloat(item.ppnRupiah) || 0),
      }));
    },
    [],
  );

  const todayStr = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const initialColumnFilters = useMemo(() => [
    {
      id: "tanggal_invoice",
      value: { from: todayStr, to: todayStr },
    },
  ], [todayStr]);

  const {
    data: fakturPajaks,
    pagination,
    setPage,
    resetFilters,
    hasActiveFilters,
    isLoading,
    isFetching,
    error,
    tableOptions,
    queryParams,
    columnFilters,
  } = useServerSideTable({
    queryHook: useFakturPajakQuery,
    selectData,
    selectPagination,
    initialPage: 1,
    initialLimit: 9999,
    initialColumnFilters,
    getQueryParams,
  });

  // Dynamic filter options based on current filtered fakturPajaks data
  const customerOptions = useMemo(() => {
    const map = new Map();
    // 1. Add all customers from current filtered fakturPajaks
    (fakturPajaks || []).forEach((item) => {
      if (item.customer?.namaCustomer) {
        map.set(item.customer.namaCustomer, item.customer);
      }
    });

    // 2. Keep any currently selected customers so they don't disappear from the selection tags/checkboxes
    const selectedCustomers =
      columnFilters?.find((f) => f.id === "customer_names")?.value || [];
    selectedCustomers.forEach((name) => {
      if (!map.has(name)) {
        const found = customers.find((c) => c.namaCustomer === name);
        map.set(name, found || { namaCustomer: name, kodeCustomer: name });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      (a.namaCustomer || "").localeCompare(b.namaCustomer || "")
    );
  }, [fakturPajaks, customers, columnFilters]);

  const topOptions = useMemo(() => {
    const map = new Map();
    // 1. Add all TOPs from current filtered fakturPajaks
    (fakturPajaks || []).forEach((item) => {
      if (item.termOfPayment?.kode_top) {
        map.set(item.termOfPayment.kode_top, item.termOfPayment);
      }
    });

    // 2. Keep any currently selected TOPs
    const selectedTops =
      columnFilters?.find((f) => f.id === "top_codes")?.value || [];
    selectedTops.forEach((code) => {
      if (!map.has(code)) {
        const found = termOfPayments.find((t) => t.kode_top === code);
        map.set(code, found || { kode_top: code });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      (a.kode_top || "").localeCompare(b.kode_top || "")
    );
  }, [fakturPajaks, termOfPayments, columnFilters]);

  const statusOptions = useMemo(() => {
    const map = new Map();
    // 1. Add all statuses from current filtered fakturPajaks
    (fakturPajaks || []).forEach((item) => {
      const statusCode = item.status?.status_code;
      const statusName = item.status?.status_name;
      if (statusCode) {
        map.set(statusCode, { id: statusCode, name: statusName || statusCode });
      }
    });

    // 2. Keep any currently selected statuses
    const selectedStatuses =
      columnFilters?.find((f) => f.id === "status_codes")?.value || [];
    selectedStatuses.forEach((code) => {
      if (!map.has(code)) {
        const found = STATUS_OPTIONS.find((s) => s.id === code);
        map.set(code, found || { id: code, name: code });
      }
    });

    return STATUS_OPTIONS.filter((s) => map.has(s.id));
  }, [fakturPajaks, columnFilters]);

  const totals = useMemo(() => {
    if (!fakturPajaks || !Array.isArray(fakturPajaks)) return { dpp: 0, ppn: 0 };
    return fakturPajaks.reduce(
      (acc, row) => ({
        dpp: acc.dpp + (parseFloat(row.dasar_pengenaan_pajak) || 0),
        ppn: acc.ppn + (parseFloat(row.ppnRupiah) || 0),
      }),
      { dpp: 0, ppn: 0 }
    );
  }, [fakturPajaks]);

  // Reset selection when data changes (page change, filter change)
  const prevFakturPajaksRef = useRef(fakturPajaks);
  useEffect(() => {
    if (prevFakturPajaksRef.current !== fakturPajaks) {
      setSelectedFakturIds([]);
      prevFakturPajaksRef.current = fakturPajaks;
    }
  }, [fakturPajaks]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedFakturIds(fakturPajaks.map((f) => f.id));
    } else {
      setSelectedFakturIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedFakturIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Notify parent when queryParams change for export functionality
  useEffect(() => {
    if (onQueryParamsChange && queryParams) {
      onQueryParamsChange(queryParams);
    }
  }, [queryParams, onQueryParamsChange]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: () => (
          <input
            type="checkbox"
            checked={
              fakturPajaks.length > 0 &&
              selectedFakturIds.length === fakturPajaks.length
            }
            onChange={handleSelectAll}
            className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedFakturIds.includes(row.original.id)}
            onChange={() => handleSelectOne(row.original.id)}
            className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
      }),
      columnHelper.accessor((row) => row.invoicePenagihan, {
        id: "tanggal_invoice",
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: "", to: "" };
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-xs">Tgl Invoice</div>
              <div className="flex flex-col gap-0.5">
                <DateFilter
                  value={filterValue.from ?? ""}
                  onChange={(val) => {
                    column.setFilterValue({ ...filterValue, from: val });
                    setPage(1);
                  }}
                  placeholder="Dari"
                />
                <DateFilter
                  value={filterValue.to ?? ""}
                  onChange={(val) => {
                    column.setFilterValue({ ...filterValue, to: val });
                    setPage(1);
                  }}
                  placeholder="Sampai"
                />
              </div>
            </div>
          );
        },
        cell: (info) => {
          const invoice = info.getValue();
          if (!invoice) {
            return <div className="text-xs text-gray-900">-</div>;
          }
          return (
            <div className="text-xs text-gray-900">
              {formatDate(invoice.tanggal)}
            </div>
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor("no_pajak", {
        id: "no_pajak",
        header: ({ column }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-xs">No Faktur</div>
            <TextColumnFilter column={column} placeholder="Filter no faktur..." />
          </div>
        ),
        cell: (info) => {
          return (
            <div>
              <div className="text-xs font-medium text-gray-900">
                {info.getValue() || "-"}
              </div>
            </div>
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor((row) => row.invoicePenagihan, {
        id: "no_invoice_penagihan",
        header: ({ column }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-xs">No Invoice</div>
            <TextColumnFilter column={column} placeholder="Filter no invoice..." />
          </div>
        ),
        cell: (info) => {
          const invoice = info.getValue();
          if (!invoice) {
            return <div className="text-xs text-gray-900">-</div>;
          }
          return (
            <div className="text-xs text-gray-900">
              {invoice.no_invoice_penagihan || "-"}
            </div>
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor(
        (row) =>
          row.laporanPenerimaanBarang?.no_lpb ||
          row.invoicePenagihan?.purchaseOrder?.laporanPenerimaanBarang?.no_lpb,
        {
          id: "no_lpb",
          header: ({ column }) => (
            <div className="space-y-0.5">
              <div className="font-medium text-xs">No LPB</div>
              <TextColumnFilter column={column} placeholder="Filter no LPB..." />
            </div>
          ),
          cell: (info) => {
            const item = info.row.original;
            return (
              <div>
                <div className="text-xs text-gray-900">
                  {info.getValue() || "-"}
                </div>
                {(item?.laporanPenerimaanBarang?.tanggal_po ||
                  item?.invoicePenagihan?.purchaseOrder?.laporanPenerimaanBarang
                    ?.tanggal_po) && (
                  <div className="text-xs text-gray-500">
                    {formatDate(
                      item?.laporanPenerimaanBarang?.tanggal_po ||
                        item?.invoicePenagihan?.purchaseOrder
                          ?.laporanPenerimaanBarang?.tanggal_po,
                    )}
                  </div>
                )}
              </div>
            );
          },
          enableSorting: true,
        },
      ),
      columnHelper.accessor((row) => row.customer?.namaCustomer, {
        id: "customer_names",
        header: ({ column }) => (
          <div
            className="space-y-0.5 max-w-[150px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-medium text-xs">Customer</div>
            <AutocompleteCheckboxLimitTag
              options={customerOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => {
                column.setFilterValue(e.target.value);
                setPage(1);
              }}
              placeholder="All"
              displayKey="namaCustomer"
              valueKey="namaCustomer"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => {
          const item = info.row.original;
          return (
            <div>
              <div className="text-xs text-gray-900">{`${info.getValue()} (${item?.customer?.kodeCustomer || "-"})`}</div>
              {item?.customer?.groupCustomer?.nama_group && (
                <div className="text-xs text-gray-500">
                  {item.customer.groupCustomer?.nama_group}
                </div>
              )}
            </div>
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor("dasar_pengenaan_pajak", {
        id: "dasar_pengenaan_pajak",
        header: ({ column }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-xs">DPP</div>
            <RangeColumnFilter column={column} setPage={setPage} />
          </div>
        ),
        cell: (info) => (
          <div className="text-right">
            <div className="text-xs text-gray-900">
              {formatCurrency(info.getValue())}
            </div>
          </div>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor("ppnRupiah", {
        id: "ppnRupiah",
        header: ({ column }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-xs">PPN</div>
            <RangeColumnFilter column={column} setPage={setPage} />
          </div>
        ),
        cell: (info) => {
          return (
            <div className="text-right">
              <div className="text-xs text-gray-900">
                {formatCurrency(info.getValue())}
              </div>
            </div>
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor("total_faktur_pajak", {
        id: "total_faktur_pajak",
        header: ({ column }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-xs">Total</div>
            <RangeColumnFilter column={column} setPage={setPage} />
          </div>
        ),
        cell: (info) => {
          return (
            <div className="text-right">
              <div className="text-xs text-gray-900">
                {formatCurrency(info.getValue())}
              </div>
            </div>
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor((row) => row.termOfPayment?.kode_top, {
        id: "top_codes",
        header: ({ column }) => (
          <div
            className="space-y-0.5 max-w-[100px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-medium text-xs">TOP</div>
            <AutocompleteCheckboxLimitTag
              options={topOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => {
                column.setFilterValue(e.target.value);
                setPage(1);
              }}
              placeholder="All"
              displayKey="kode_top"
              valueKey="kode_top"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => {
          const item = info.row.original;
          return (
            <div>
              <div className="text-xs text-gray-900">
                {info.getValue() || "-"}
              </div>
              {item?.termOfPayment?.batas_hari != null && (
                <div className="text-xs text-gray-500">
                  {item.termOfPayment.batas_hari} hari
                </div>
              )}
            </div>
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor(
        (row) => row.status?.status_name || row.status?.status_code,
        {
          id: "status_codes",
          header: ({ column }) => (
            <div
              className="space-y-0.5 max-w-[120px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-medium text-xs">Status</div>
              <AutocompleteCheckboxLimitTag
                options={statusOptions}
                value={column.getFilterValue() ?? []}
                onChange={(e) => {
                  column.setFilterValue(e.target.value);
                  setPage(1);
                }}
                placeholder="All"
                displayKey="name"
                valueKey="id"
                limitTags={1}
                size="small"
                fetchOnClose
                sx={{ minWidth: "100px" }}
              />
            </div>
          ),
          cell: (info) => (
            <StatusBadge
              status={info.getValue() || "Unknown"}
              variant={resolveStatusVariant(info.getValue())}
              size="sm"
              dot
            />
          ),
          enableSorting: true,
        },
      ),
    ],
    [
      fakturPajaks,
      onView,
      onDelete,
      deleteLoading,
      setPage,
      selectedFakturPajakId,
      customers,
      termOfPayments,
      selectedFakturIds,
    ],
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

  return (
    <div className="space-y-2">
      {(hasActiveFilters || selectedFakturIds.length > 0) && (
        <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-100">
          {selectedFakturIds.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-700">
                {selectedFakturIds.length} dipilih
              </span>
              {onBulkExportEFaktur && (
                <button
                  onClick={() => onBulkExportEFaktur(selectedFakturIds)}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 transition-colors"
                >
                  <ArchiveBoxIcon className="h-3.5 w-3.5 mr-1" />
                  Export e-Faktur
                </button>
              )}
              {onBulkDelete && (
                <button
                  onClick={() => onBulkDelete(selectedFakturIds)}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors disabled:bg-gray-400"
                  disabled={deleteLoading}
                >
                  <TrashIcon className="h-3.5 w-3.5 mr-1" />
                  Hapus
                </button>
              )}
            </div>
          ) : <div />}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}

      <DataTable
        table={table}
        isLoading={isLoading || isFetching}
        error={error}
        hasActiveFilters={hasActiveFilters}
        loadingMessage="Memuat data..."
        emptyMessage="Tidak ada data faktur pajak"
        emptyFilteredMessage="Tidak ada data yang sesuai dengan pencarian"
        wrapperClassName="overflow-x-auto overflow-y-auto min-h-[300px] max-h-[calc(85vh-300px)]"
        tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
        bodyClassName="bg-white divide-y divide-gray-100"
        rowClassName="hover:bg-gray-50 cursor-pointer h-8"
        getRowClassName={({ row }) => {
          if (!row || !row.original) {
            return undefined;
          }
          const isSelected = row.original.id === selectedFakturPajakId;
          const isChecked = selectedFakturIds.includes(row.original.id);
          if (isSelected) {
            return "bg-blue-200 border-l-4 border-blue-600 font-medium text-gray-900";
          }
          if (isChecked) {
            return "bg-emerald-100 border-l-2 border-emerald-500 text-gray-900";
          }
          return undefined;
        }}
        onRowClick={(rowData, event) => {
          if (onView) {
            onView(rowData);
          }
        }}
        selectedRowId={selectedFakturPajakId}
        cellClassName="px-2 py-1 whitespace-nowrap text-xs text-gray-900"
        emptyCellClassName="px-2 py-1 text-center text-xs text-gray-500"
        footerRowClassName={`bg-gray-100 font-bold sticky bottom-0 border-t border-gray-300 ${(pagination?.totalItems || 0) > 0 ? "z-10" : "z-0"}`}
        footerContent={
          <tr>
            {table.getVisibleLeafColumns().map((column) => (
              <td key={column.id} className="px-2 py-1 text-xs border-t border-gray-300 border-r border-gray-200 last:border-r-0">
                <TableFooterCell column={column} table={table} />
              </td>
            ))}
          </tr>
        }
      />
    </div>
  );
};

export default FakturPajakTableServerSide;

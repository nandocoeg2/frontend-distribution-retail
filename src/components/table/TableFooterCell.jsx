import React, { useState, useMemo } from "react";

const TableFooterCell = ({ column, table, data = [] }) => {
  // Check if this column is an action/select/id/status column where mathematical operations make no sense
  const isActionOrSelect = [
    "select",
    "actions",
    "action",
    "print",
    "delete",
    "edit",
    "id",
    "status",
    "status_codes",
    "status_name"
  ].includes(column.id);

  // Determine if column is an identifier, reference number, date, or text
  const columnIdLower = (column.id || "").toLowerCase();
  const isIdentifierOrText =
    columnIdLower.startsWith("no_") ||
    columnIdLower.startsWith("nomor_") ||
    columnIdLower.startsWith("kode_") ||
    columnIdLower.startsWith("code_") ||
    columnIdLower.startsWith("id_") ||
    columnIdLower.endsWith("_no") ||
    columnIdLower.endsWith("_number") ||
    columnIdLower.endsWith("_code") ||
    columnIdLower.endsWith("_id") ||
    columnIdLower.includes("npwp") ||
    columnIdLower.includes("plu") ||
    columnIdLower.includes("barcode") ||
    columnIdLower.includes("nik") ||
    columnIdLower.includes("telepon") ||
    columnIdLower.includes("telp") ||
    columnIdLower.includes("phone") ||
    columnIdLower.includes("name") ||
    columnIdLower.includes("nama") ||
    columnIdLower.includes("customer") ||
    columnIdLower.includes("supplier") ||
    columnIdLower.includes("tanggal") ||
    columnIdLower.includes("date") ||
    columnIdLower.includes("top");

  // Determine if column is numeric based on its ID or name
  const isNumericColumn =
    !isIdentifierOrText &&
    (columnIdLower.includes("total") ||
      columnIdLower.includes("jumlah") ||
      columnIdLower.includes("nominal") ||
      columnIdLower.includes("amount") ||
      columnIdLower.includes("debit") ||
      columnIdLower.includes("kredit") ||
      columnIdLower.includes("saldo") ||
      columnIdLower.includes("dpp") ||
      columnIdLower.includes("ppn") ||
      columnIdLower.includes("biaya") ||
      columnIdLower.includes("harga") ||
      columnIdLower.includes("mutasi") ||
      columnIdLower.includes("value") ||
      columnIdLower.includes("selisih") ||
      columnIdLower.includes("qty") ||
      columnIdLower.includes("quantity") ||
      columnIdLower.includes("box") ||
      columnIdLower.includes("dus") ||
      columnIdLower.includes("carton") ||
      columnIdLower.includes("berat") ||
      columnIdLower.includes("potongan") ||
      columnIdLower.includes("diskon") ||
      columnIdLower.includes("discount") ||
      columnIdLower.includes("tax") ||
      columnIdLower.includes("rate"));

  // Default operation is Sum for numeric columns and Count for others
  const [operation, setOperation] = useState(isNumericColumn ? "sum" : "count");

  // Extract cell values for the column
  const values = useMemo(() => {
    if (table) {
      const rows = table.getFilteredRowModel().rows;
      return rows.map((row) => row.getValue(column.id));
    }
    return data.map((item) => {
      if (column.id && column.id.includes(".")) {
        const parts = column.id.split(".");
        let val = item;
        for (const part of parts) {
          val = val ? val[part] : undefined;
        }
        return val;
      }
      return item[column.id];
    });
  }, [table, data, column.id]);

  // Extract all valid numeric values for Sum and Avg calculations
  const numericValues = useMemo(() => {
    return values
      .map((val) => {
        if (val === null || val === undefined || val === "") return null;
        if (typeof val === "object" || typeof val === "boolean") return null;
        if (typeof val === "number") return isNaN(val) ? null : val;
        // Clean formatted values (e.g. "Rp. 5.000", "1.469,72", "722.73", or "10%")
        let cleanVal = String(val).replace(/Rp\.?\s*/i, "").replace(/%/g, "").trim();
        if (cleanVal.includes(",")) {
          // Indonesian format with comma decimal: 1.234,56 -> 1234.56
          cleanVal = cleanVal.replace(/\./g, "").replace(/,/g, ".");
        } else if ((cleanVal.match(/\./g) || []).length > 1) {
          // Multiple dots without comma (thousands separator only): 1.234.567 -> 1234567
          cleanVal = cleanVal.replace(/\./g, "");
        }
        const num = Number(cleanVal);
        return isNaN(num) ? null : num;
      })
      .filter((val) => val !== null);
  }, [values]);

  const calculatedValue = useMemo(() => {
    if (isActionOrSelect) return "";

    switch (operation) {
      case "sum": {
        if (numericValues.length === 0) return "0";
        const sum = numericValues.reduce((acc, curr) => acc + curr, 0);
        return Number.isInteger(sum)
          ? sum.toLocaleString("id-ID")
          : sum.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 4 });
      }
      case "avg": {
        if (numericValues.length === 0) return "0";
        const sum = numericValues.reduce((acc, curr) => acc + curr, 0);
        const avg = sum / numericValues.length;
        return Number.isInteger(avg)
          ? avg.toLocaleString("id-ID")
          : avg.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 4 });
      }
      case "count":
      default:
        return values.length.toLocaleString("id-ID");
    }
  }, [operation, values, numericValues, isActionOrSelect]);

  if (isActionOrSelect) {
    return null;
  }

  return (
    <div
      className="flex items-center justify-between gap-1 w-full font-bold text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      <select
        value={operation}
        onChange={(e) => setOperation(e.target.value)}
        className="bg-transparent border-none text-gray-500 text-xs focus:ring-0 focus:outline-none p-0 cursor-pointer font-bold select-none"
        style={{
          backgroundImage: "none",
          paddingRight: "4px",
          WebkitAppearance: "none",
          MozAppearance: "none",
          appearance: "none",
        }}
      >
        <option value="count">Count</option>
        <option value="sum">Sum</option>
        <option value="avg">Avg</option>
      </select>
      <span className="text-gray-900 truncate ml-auto" title={String(calculatedValue)}>
        {calculatedValue}
      </span>
    </div>
  );
};

export default TableFooterCell;

import React, { useState, useMemo } from "react";
import { formatCurrency } from "../../utils/formatUtils";

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

  // Determine if column is numeric based on its ID or name
  const columnIdLower = (column.id || "").toLowerCase();
  const isNumericColumn =
    columnIdLower.includes("total") ||
    columnIdLower.includes("jumlah") ||
    columnIdLower.includes("nominal") ||
    columnIdLower.includes("amount") ||
    columnIdLower.includes("debit") ||
    columnIdLower.includes("kredit") ||
    columnIdLower.includes("pajak") ||
    columnIdLower.includes("saldo") ||
    columnIdLower.includes("dpp") ||
    columnIdLower.includes("ppn") ||
    columnIdLower.includes("biaya") ||
    columnIdLower.includes("harga") ||
    columnIdLower.includes("mutasi") ||
    columnIdLower.includes("kwitansi") ||
    columnIdLower.includes("value") ||
    columnIdLower.includes("selisih");

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
        // Clean currency prefixes if we encounter formatted values (e.g. "Rp. 5.000")
        let cleanVal = val;
        if (typeof val === "string") {
          cleanVal = val
            .replace(/Rp\.?\s*/i, "")
            .replace(/\./g, "")
            .replace(/,/g, ".")
            .trim();
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
        const sum = numericValues.reduce((acc, curr) => acc + curr, 0);
        return isNumericColumn ? formatCurrency(sum) : sum.toLocaleString("id-ID");
      }
      case "avg": {
        if (numericValues.length === 0) return "0";
        const sum = numericValues.reduce((acc, curr) => acc + curr, 0);
        const avg = sum / numericValues.length;
        return isNumericColumn
          ? formatCurrency(avg)
          : avg.toLocaleString("id-ID", { maximumFractionDigits: 2 });
      }
      case "count":
      default:
        return values.length.toLocaleString("id-ID");
    }
  }, [operation, values, numericValues, isNumericColumn, isActionOrSelect]);

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

import React, { useState } from "react";
import { db } from "../lib/firebase";

// Helper function to format different types of values
const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return "";
  }
  
  // Handle objects (like mta: { amount: 1000, currency: "USD" })
  if (typeof value === "object" && !Array.isArray(value)) {
    // Special handling for common object types
    if (value.amount !== undefined && value.currency !== undefined) {
      return `${value.amount} ${value.currency}`;
    }
    if (value.phone !== undefined && value.email !== undefined) {
      return `${value.phone} / ${value.email}`;
    }
    // For other objects, try to create a readable string
    return Object.entries(value)
      .map(([key, val]) => `${key}: ${val}`)
      .join(", ");
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  
  // Handle other types
  return String(value);
};

interface EditableCellProps {
  rowId: string;
  field: string;
  value: any;
  onSave: (id: string, field: string, value: any) => Promise<void>;
}

const EditableCell = ({ rowId, field, value, onSave }: EditableCellProps) => {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(formatValue(value));

  const handleBlur = async () => {
    setEditing(false);
    if (inputValue !== formatValue(value)) {
      // Try to parse the input back to the original format
      let parsedValue: any = inputValue;
      
      // Handle special cases for object fields
      if (field === "mta" && inputValue.includes(" ")) {
        const parts = inputValue.split(" ");
        const amount = parseFloat(parts[0]);
        const currency = parts[1];
        if (!isNaN(amount) && currency) {
          parsedValue = { amount, currency };
        }
      }
      
      await onSave(rowId, field, parsedValue);
    }
  };

  return editing ? (
    <input
      className="px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded w-full text-xs"
      value={inputValue}
      autoFocus
      onChange={e => setInputValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={e => {
        if (e.key === "Enter") {
          handleBlur();
        }
      }}
    />
  ) : (
    <div
      className="px-2 py-1 cursor-pointer min-w-[80px]"
      onClick={() => setEditing(true)}
      tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter") setEditing(true); }}
    >
      {formatValue(value)}
    </div>
  );
};

export default EditableCell; 
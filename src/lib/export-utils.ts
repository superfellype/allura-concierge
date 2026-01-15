/**
 * Export utilities for CSV and data export
 */

/**
 * Convert array of objects to CSV string
 * @param data Array of objects to convert
 * @param headers Optional custom headers mapping { key: 'Display Name' }
 * @returns CSV string
 */
export function convertToCSV(
  data: Record<string, any>[],
  headers?: Record<string, string>
): string {
  if (!data.length) return '';
  
  const keys = Object.keys(data[0]);
  const headerRow = headers 
    ? keys.map(key => headers[key] || key)
    : keys;
  
  const rows = data.map(item =>
    keys.map(key => {
      const value = item[key];
      // Escape quotes and wrap in quotes if contains comma or newline
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  );
  
  return [headerRow.join(','), ...rows].join('\n');
}

/**
 * Download data as CSV file
 * @param data Array of objects to export
 * @param filename File name (without extension)
 * @param headers Optional custom headers mapping
 */
export function exportToCSV(
  data: Record<string, any>[],
  filename: string,
  headers?: Record<string, string>
): void {
  const csv = convertToCSV(data, headers);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for export
 * @param date Date string or Date object
 * @returns Formatted date string DD/MM/YYYY
 */
export function formatDateForExport(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
}

/**
 * Format currency for export (without symbol)
 * @param value Number value
 * @returns Formatted string with comma as decimal separator
 */
export function formatCurrencyForExport(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

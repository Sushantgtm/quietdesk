import * as XLSX from 'xlsx';

/**
 * Utility to export data to true Excel (.xlsx format) in browser using SheetJS
 */
export const exportToExcel = (data, filename = 'QuietDesk_Payments.xlsx') => {
  if (!data || !data.length) {
    alert('No payment records to export.');
    return;
  }

  try {
    // 1. Create a new worksheet from json data
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-fit column widths
    const colKeys = Object.keys(data[0]);
    worksheet['!cols'] = colKeys.map(key => {
      const maxLen = Math.max(
        key.length,
        ...data.map(row => (row[key] !== undefined && row[key] !== null ? String(row[key]).length : 0))
      );
      return { wch: Math.min(Math.max(maxLen + 3, 10), 40) };
    });

    // 2. Create a new workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

    // 3. Ensure filename ends with .xlsx
    const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

    // 4. Download file as true .xlsx binary
    XLSX.writeFile(workbook, cleanFilename);
  } catch (err) {
    console.error('Failed to export Excel via XLSX:', err);
    // Fallback to CSV if anything fails
    exportToCsvFallback(data, filename);
  }
};

const exportToCsvFallback = (data, filename) => {
  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
  data.forEach(row => {
    const values = headers.map(h => {
      const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace(/\.xlsx$/i, '.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

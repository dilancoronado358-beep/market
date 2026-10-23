// ==============================================================================
// UTILIDADES DE EXPORTACIÓN E IMPORTACIÓN EXCEL / CSV (SHEETJS / XLSX)
// ==============================================================================

import * as XLSX from 'xlsx';

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = 'Datos'
) {
  if (!data || data.length === 0) {
    throw new Error('No hay registros disponibles para exportar.');
  }

  // 1. Crear hoja de cálculo a partir del arreglo de objetos
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-ajustar anchos de columnas según el contenido para visualización profesional
  const colWidths = Object.keys(data[0] || {}).map((key) => {
    const maxValLength = Math.max(
      ...data.map((row) => (row[key] !== null && row[key] !== undefined ? String(row[key]).length : 0))
    );
    return { wch: Math.max(key.length, maxValLength, 12) + 2 };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // 2. Generar buffer binario en formato XLSX
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  // 3. Crear descarga directa mediante enlace HTML5 estándar
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();

  // Limpieza de memoria
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
}

export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  filename: string
) {
  if (!data || data.length === 0) {
    throw new Error('No hay registros disponibles para exportar.');
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(ws);
  // Añadir BOM (\uFEFF) para que Excel abra UTF-8 con tildes y caracteres latinos sin corromperlos
  const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
}

export function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsUpDown, ArrowUpDown, FileText, Camera } from 'lucide-react';
import { clsx } from 'clsx';
import { BarcodeScannerModal } from './BarcodeScannerModal';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchableKeys?: (keyof T | string)[];
  itemsPerPage?: number;
  actions?: React.ReactNode;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  enableBarcodeScanner?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'Buscar...',
  searchableKeys = [],
  itemsPerPage = 10,
  actions,
  onRowClick,
  emptyMessage = 'No se encontraron registros.',
  enableBarcodeScanner = false,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtrado
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((item) => {
      if (searchableKeys.length > 0) {
        return searchableKeys.some((k) => {
          const val = item[k];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
        });
      }
      // Búsqueda general en todos los valores primitivos
      return Object.values(item).some((val) => {
        return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, searchableKeys]);

  // Ordenamiento
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortOrder]);

  // Paginación
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-3">
      {/* Barra superior de búsqueda y acciones */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className={clsx(
              "w-full pl-8 py-2 sm:py-1.5 text-xs rounded-lg sm:rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 focus:border-slate-900 shadow-subtle transition-colors",
              enableBarcodeScanner ? "pr-22" : "pr-3"
            )}
          />
          {enableBarcodeScanner && (
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors shadow-xs"
              title="Escanear código de barras con la cámara"
            >
              <Camera className="w-3 h-3" />
              <span>Cámara</span>
            </button>
          )}
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">{actions}</div>}
      </div>

      {/* Tabla con scroll horizontal responsivo */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 shadow-subtle bg-white dark:bg-slate-900 -mx-1 sm:mx-0">
        <table className="min-w-[680px] w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-850/90 text-slate-600 dark:text-slate-300 font-semibold text-[11px] uppercase tracking-wider">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx('px-3.5 py-2.5', col.className)}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className={clsx('flex items-center gap-1.5', col.sortable && 'cursor-pointer select-none hover:text-slate-900 dark:hover:text-white')}>
                    <span>{col.header}</span>
                    {col.sortable && (
                      sortKey === col.key ? (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                      ) : (
                        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={clsx(
                    'hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors duration-100',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={clsx('px-3.5 py-2.5 whitespace-nowrap', col.className)}>
                      {col.render ? col.render(row) : row[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-14 text-center">
                  <div className="max-w-sm mx-auto space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Registro Institucional Sin Movimientos
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 px-1 text-center sm:text-left">
        <div>
          Mostrando <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> a{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> de{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredData.length}</span> registros
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 font-medium text-slate-700 dark:text-slate-200">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {enableBarcodeScanner && (
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          title="Buscar por Código de Barras con Cámara"
          continuous={false}
          onScan={(code) => {
            setSearchTerm(code);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}

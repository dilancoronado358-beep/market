import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ElectronicDocument, SriAuthStatus } from '../../types/database';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { generateAccessKey, buildSriFacturaXml } from '../../lib/sriUtils';
import {
  FileCode2,
  FileCheck,
  Send,
  Eye,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  ShieldCheck,
  Server,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export const SriInvoicing: React.FC = () => {
  const { electronicDocs, settings, sales, customers, registerElectronicDocument, updateElectronicDocumentStatus } = useStore();

  const [selectedDoc, setSelectedDoc] = useState<ElectronicDocument | null>(null);
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'facturas' | 'configuracion'>('facturas');
  const [environment, setEnvironment] = useState<'1' | '2'>(settings.sri_environment);

  // Emitir Factura Electrónica SRI desde una venta reciente
  const handleEmitSriInvoice = (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return;

    const customer = customers.find((c) => c.id === sale.customer_id) || {
      id: 'cust-cf',
      identification_type: 'consumidor_final' as const,
      identification_number: '9999999999999',
      full_name: 'CONSUMIDOR FINAL',
      email: 'consumidorfinal@erpposecuador.com',
      address: 'Quito, Ecuador',
      phone: 'N/A',
      is_active: true,
      total_purchases_count: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
    };

    const nextSeq = String(electronicDocs.length + 1).padStart(9, '0');
    const accessKey = generateAccessKey({
      date: new Date(),
      docType: '01',
      ruc: settings.ruc,
      environment,
      establishment: settings.establishment_code,
      emissionPoint: settings.emission_point_code,
      sequential: nextSeq,
    });

    const xml = buildSriFacturaXml({
      accessKey,
      establishment: settings.establishment_code,
      emissionPoint: settings.emission_point_code,
      sequential: nextSeq,
      date: new Date(),
      store: {
        ruc: settings.ruc,
        tradeName: settings.trade_name,
        legalName: settings.store_name,
        address: settings.address,
      },
      customer: {
        idType: customer.identification_type === 'ruc' ? '04' : customer.identification_type === 'cedula' ? '05' : '07',
        idNumber: customer.identification_number,
        name: customer.full_name,
        email: customer.email,
        address: customer.address,
      },
      totals: {
        subtotal0: sale.subtotal_0,
        subtotalIva: sale.subtotal_iva,
        ivaAmount: sale.iva_amount,
        discountTotal: sale.discount_amount,
        grandTotal: sale.total_amount,
        ivaRate: settings.default_iva_rate,
      },
      items: (sale.items || []).map((i) => ({
        code: i.product_id,
        name: i.product_name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        discount: i.discount_amount,
        subtotal: i.subtotal,
        ivaRate: i.iva_rate,
        ivaAmount: i.iva_amount,
      })),
      paymentMethod: sale.payment_method,
    });

    const newDoc: ElectronicDocument = {
      id: `sri-${Date.now()}`,
      doc_type: 'factura',
      environment,
      emission_type: '1',
      establishment: settings.establishment_code,
      emission_point: settings.emission_point_code,
      sequential: nextSeq,
      access_key: accessKey,
      sale_id: sale.id,
      customer_id: customer.id,
      customer_name: customer.full_name,
      total_amount: sale.total_amount,
      status: 'generado',
      xml_content: xml,
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    registerElectronicDocument(newDoc);
    toast.success(`Factura Electrónica ${newDoc.establishment}-${newDoc.emission_point}-${newDoc.sequential} generada.`);
  };

  // Simulación de envío y autorización con el servicio web del SRI
  const handleTransmitToSri = (doc: ElectronicDocument) => {
    toast.info('Transmitiendo comprobante a los servidores del SRI Ecuador...');
    updateElectronicDocumentStatus(doc.id, 'enviado');

    setTimeout(() => {
      // Simular respuesta oficial SRI
      updateElectronicDocumentStatus(
        doc.id,
        'autorizado',
        doc.access_key,
        undefined
      );
      toast.success(`Comprobante ${doc.sequential} AUTORIZADO por el SRI.`);
    }, 1500);
  };

  const columns: Column<ElectronicDocument>[] = [
    {
      key: 'sequential',
      header: 'Serie & Secuencial',
      sortable: true,
      render: (d) => (
        <div>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {d.establishment}-{d.emission_point}-{d.sequential}
          </span>
          <span className="block text-[10px] text-slate-400 capitalize">
            Tipo: {d.doc_type} • Amb: {d.environment === '1' ? 'Pruebas' : 'Producción'}
          </span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Cliente / Receptor',
      render: (d) => (
        <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
          {d.customer_name || 'CONSUMIDOR FINAL'}
        </span>
      ),
    },
    {
      key: 'access_key',
      header: 'Clave de Acceso SRI (49 dígitos)',
      render: (d) => (
        <span className="font-mono text-[11px] text-slate-500 max-w-xs truncate block" title={d.access_key}>
          {d.access_key}
        </span>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total Facturado',
      sortable: true,
      render: (d) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
          ${d.total_amount.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado SRI',
      sortable: true,
      render: (d) => {
        const variantMap: Record<SriAuthStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
          autorizado: 'success',
          enviado: 'info',
          recibido: 'info',
          firmado: 'info',
          generado: 'neutral',
          pendiente: 'warning',
          rechazado: 'danger',
          no_autorizado: 'danger',
        };
        return (
          <Badge variant={variantMap[d.status] || 'neutral'}>
            {d.status.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (d) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            icon={<FileCode2 className="w-3.5 h-3.5" />}
            onClick={() => {
              setSelectedDoc(d);
              setIsXmlModalOpen(true);
            }}
            title="Ver XML"
          >
            XML
          </Button>

          {d.status !== 'autorizado' && (
            <Button
              size="sm"
              variant="outline"
              icon={<Send className="w-3.5 h-3.5" />}
              onClick={() => handleTransmitToSri(d)}
            >
              Enviar SRI
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Métricas institucionales
  const totalDocs = electronicDocs.length;
  const authorizedDocs = electronicDocs.filter((d) => d.status === 'autorizado').length;
  const pendingDocs = electronicDocs.filter((d) => d.status === 'pendiente' || d.status === 'enviado').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              FACTURACIÓN ELECTRÓNICA • SRI ECUADOR
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-[11px] text-slate-500 font-medium">Esquema XSD Oficial v1.1.0</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Comprobantes Electrónicos SRI
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generación de clave de acceso de 49 dígitos con Módulo 11, XML estructurado y transmisión a servicios web SRI.
          </p>
        </div>

        {/* Toggle Ambiente Pruebas / Producción */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setEnvironment('1')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              environment === '1'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-subtle'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Ambiente 1: Pruebas
          </button>
          <button
            onClick={() => setEnvironment('2')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              environment === '2'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-subtle'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Ambiente 2: Producción
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Comprobantes</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">{totalDocs}</span>
          <span className="text-[10px] text-slate-400">Facturas generadas</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Autorizados por SRI</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">{authorizedDocs}</span>
          <span className="text-[10px] text-slate-400">Con clave autorizada</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">En Proceso / Envío</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">{pendingDocs}</span>
          <span className="text-[10px] text-slate-400">Pendientes de respuesta</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Ambiente Operativo</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
            {environment === '2' ? 'Producción' : 'Pruebas'}
          </span>
          <span className="text-[10px] text-slate-400">Webservices SRI Ecuador</span>
        </div>
      </div>

      {/* Banner de Estado de Integración */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-subtle">
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 text-slate-700 dark:text-slate-300 shrink-0" />
          <div>
            <p className="font-bold text-slate-900 dark:text-white">
              Emisor Autorizado: {settings.store_name} • RUC: {settings.ruc}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Establecimiento: {settings.establishment_code} • Punto de Emisión: {settings.emission_point_code} • Clave generada con algoritmo Módulo 11
            </p>
          </div>
        </div>

        {sales.length > 0 && (
          <Button
            size="sm"
            variant="primary"
            icon={<FileCheck className="w-4 h-4" />}
            onClick={() => handleEmitSriInvoice(sales[0].id)}
          >
            Facturar Venta Reciente ({sales[0].sale_number})
          </Button>
        )}
      </div>

      {/* Tabla de Documentos Electrónicos */}
      <div className="rounded-xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <DataTable
          columns={columns}
          data={electronicDocs}
          searchPlaceholder="Buscar por secuencial, cliente o clave de acceso..."
          searchableKeys={['sequential', 'access_key', 'customer_name']}
          emptyMessage="No se registran comprobantes electrónicos generados en este ambiente. Emita una factura desde una venta completada."
        />
      </div>

      {/* Modal de Visor XML del SRI */}
      {selectedDoc && (
        <Modal
          isOpen={isXmlModalOpen}
          onClose={() => setIsXmlModalOpen(false)}
          title={`XML Factura Electrónica: ${selectedDoc.establishment}-${selectedDoc.emission_point}-${selectedDoc.sequential}`}
          subtitle={`Clave de Acceso: ${selectedDoc.access_key}`}
          maxWidth="4xl"
          footer={
            <Button
              variant="secondary"
              onClick={() => {
                const blob = new Blob([selectedDoc.xml_content || ''], { type: 'application/xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Factura_${selectedDoc.sequential}.xml`;
                a.click();
              }}
              icon={<Download className="w-4 h-4" />}
            >
              Descargar XML
            </Button>
          }
        >
          <div className="py-2">
            <pre className="p-4 rounded-lg bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-96 border border-slate-800">
              {selectedDoc.xml_content || '<!-- Sin contenido XML generado -->'}
            </pre>
          </div>
        </Modal>
      )}
    </div>
  );
};

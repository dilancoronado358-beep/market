import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useStore } from '../../context/StoreContext';
import { Truck } from 'lucide-react';
import { toast } from 'sonner';

interface NewVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVisitCreated: (visit: any) => void;
}

export const NewVisitModal: React.FC<NewVisitModalProps> = ({
  isOpen,
  onClose,
  onVisitCreated,
}) => {
  const { suppliers, createSupplierVisit } = useStore();

  const [supplierId, setSupplierId] = useState('');
  const [salesRepName, setSalesRepName] = useState('');
  const [reason, setReason] = useState('Entrega regular de mercadería y revisión de inventario');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !salesRepName.trim()) {
      toast.error('Seleccione el proveedor e ingrese el nombre del vendedor/transportista');
      return;
    }

    const newVisit = createSupplierVisit({
      supplier_id: supplierId,
      sales_rep_name: salesRepName,
      reason,
      invoice_or_doc_ref: invoiceRef || undefined,
      notes: notes || undefined,
    });

    onVisitCreated(newVisit);
    onClose();
    // Reset
    setSupplierId('');
    setSalesRepName('');
    setInvoiceRef('');
    setNotes('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Llegada de Proveedor"
      subtitle="Inicia un nuevo expediente digital para documentar recepción, retiros y acuerdos"
      maxWidth="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} icon={<Truck className="w-4 h-4" />}>
            Iniciar Visita & Abrir Expediente
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Empresa Proveedora *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="input-field"
              required
            >
              <option value="">-- Seleccionar Proveedor --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.trade_name || s.business_name} (RUC: {s.ruc})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Nombre del Vendedor o Transportista *"
            placeholder="Ej: Esteban Carrera"
            value={salesRepName}
            onChange={(e) => setSalesRepName(e.target.value)}
            required
          />

          <Input
            label="N° Factura o Guía de Remisión de Origen"
            placeholder="Ej: FAC-001-002-00045123"
            value={invoiceRef}
            onChange={(e) => setInvoiceRef(e.target.value)}
          />

          <Input
            label="Motivo de la Visita"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />

          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Observaciones Iniciales
            </label>
            <textarea
              rows={3}
              placeholder="Comentarios sobre estado de empaques, vehículo de reparto, precintos o acuerdos previos..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

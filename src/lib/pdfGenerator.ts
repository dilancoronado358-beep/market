// ==============================================================================
// GENERADOR DE DOCUMENTOS PDF (JSPDF + AUTOTABLE)
// Acta de Visita de Proveedor, Comprobante POS y RIDE SRI Ecuador
// ==============================================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SupplierVisit, SupplierVisitItem, SupplierIncident, SupplierReplacement, Sale, SaleItem } from '../types/database';

export function generateActaVisitaPdf(params: {
  visit: SupplierVisit;
  supplierName: string;
  supplierRuc: string;
  receiverName: string;
  items: SupplierVisitItem[];
  incidents: SupplierIncident[];
  replacements: SupplierReplacement[];
}): jsPDF {
  const doc = new jsPDF();
  const v = params.visit;

  // Encabezado
  doc.setFillColor(22, 163, 74); // Brand green
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ERP / POS ECUADOR — ACTA DIGITAL DE VISITA DE PROVEEDOR', 14, 16);

  // Información del Documento
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let y = 34;
  doc.setFont('helvetica', 'bold');
  doc.text(`EXPEDIENTE N°: ${v.visit_number}`, 14, y);
  doc.text(`ESTADO: ${v.status.toUpperCase().replace('_', ' ')}`, 140, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Proveedor: ${params.supplierName} (RUC: ${params.supplierRuc})`, 14, y);
  doc.text(`Vendedor / Transportista: ${v.sales_rep_name}`, 140, y);

  y += 6;
  doc.text(`Fecha y Hora Entrada: ${new Date(v.check_in_time).toLocaleString('es-EC')}`, 14, y);
  doc.text(`Fecha y Hora Salida: ${v.check_out_time ? new Date(v.check_out_time).toLocaleString('es-EC') : 'En curso'}`, 140, y);

  y += 6;
  doc.text(`Receptor ERP / POS Ecuador: ${params.receiverName}`, 14, y);
  doc.text(`Documento Ref / Factura: ${v.invoice_or_doc_ref || 'N/A'}`, 140, y);

  y += 6;
  doc.text(`Motivo: ${v.reason}`, 14, y);

  // 1. Mercadería Recibida
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(22, 101, 52);
  doc.text('1. RESUMEN DE MERCADERÍA RECIBIDA', 14, y);

  const itemsData = params.items.map((i) => [
    i.product_name || 'Producto',
    i.declared_qty.toString(),
    i.received_qty.toString(),
    i.accepted_qty.toString(),
    i.rejected_qty.toString(),
    `$${i.unit_cost.toFixed(2)}`,
    i.status.replace('_', ' '),
  ]);

  autoTable(doc, {
    startY: y + 3,
    head: [['Producto', 'Declarado', 'Físico', 'Aceptado', 'Rechazado', 'Costo Unit.', 'Estado']],
    body: itemsData.length > 0 ? itemsData : [['Sin líneas de mercadería registrada', '-', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  let lastY = doc.lastAutoTable.finalY + 8;

  // 2. Incidencias y Productos Dañados
  if (params.incidents.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(185, 28, 28); // Red
    doc.text('2. INCIDENCIAS / PRODUCTOS DAÑADOS EN CUARENTENA', 14, lastY);

    const incData = params.incidents.map((inc) => [
      inc.incident_number,
      inc.product_name || 'Producto',
      inc.affected_qty.toString(),
      inc.damage_reason,
      `$${inc.estimated_value.toFixed(2)}`,
      inc.status.replace('_', ' '),
    ]);

    autoTable(doc, {
      startY: lastY + 3,
      head: [['N° Incidencia', 'Producto', 'Cant. Afectada', 'Motivo / Daño', 'Valor Estimado', 'Estado']],
      body: incData,
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    // @ts-ignore
    lastY = doc.lastAutoTable.finalY + 8;
  }

  // 3. Compromisos de Reposición Pendiente
  if (params.replacements.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175); // Blue
    doc.text('3. COMPROMISOS DE REPOSICIÓN PENDIENTES ACORDADOS', 14, lastY);

    const repData = params.replacements.map((r) => [
      r.replacement_number,
      r.product_name || 'Producto',
      r.agreed_qty.toString(),
      r.expected_delivery_date,
      r.status.replace('_', ' '),
      r.notes || 'N/A',
    ]);

    autoTable(doc, {
      startY: lastY + 3,
      head: [['N° Compromiso', 'Producto a Reponer', 'Cant. Acordada', 'Fecha Prometida', 'Estado', 'Observación']],
      body: repData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    // @ts-ignore
    lastY = doc.lastAutoTable.finalY + 8;
  }

  // Observaciones generales y Disclaimer
  if (lastY > 230) {
    doc.addPage();
    lastY = 25;
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Nota de Integridad: Las cantidades aceptadas han sido cargadas automáticamente al inventario vendible y Kardex.', 14, lastY);
  doc.text('Los productos dañados han sido segregados a cuarentena. Esta acta física no reemplaza firma electrónica certificada.', 14, lastY + 5);

  // Espacio para Firmas Físicas
  lastY += 25;
  doc.setDrawColor(150, 150, 150);
  doc.line(20, lastY, 90, lastY);
  doc.line(120, lastY, 190, lastY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text('Firma del Vendedor / Proveedor', 30, lastY + 5);
  doc.text(`CI: _______________________`, 30, lastY + 10);

  doc.text('Firma de Recepción (ERP / POS Ecuador)', 130, lastY + 5);
  doc.text(`Responsable: ${params.receiverName}`, 130, lastY + 10);

  return doc;
}

export function generatePosReceiptPdf(sale: Sale, items: SaleItem[]): jsPDF {
  // Formato tipo ticket (80mm ancho x 200mm alto)
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 220],
  });

  let y = 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ERP / POS ECUADOR', 40, y, { align: 'center' });

  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema Comercial - Ecuador', 40, y, { align: 'center' });
  y += 4;
  doc.text('RUC: 1790012345001', 40, y, { align: 'center' });
  y += 4;
  doc.text('Av. Amazonas y Luis Cordero, Quito', 40, y, { align: 'center' });

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`COMPROBANTE INTERNO DE VENTA`, 40, y, { align: 'center' });
  y += 4;
  doc.text(sale.internal_doc_number || sale.sale_number, 40, y, { align: 'center' });

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${new Date(sale.created_at).toLocaleString('es-EC')}`, 5, y);
  y += 4;
  doc.text(`Cajero: ${sale.seller_name || 'Andrea Suárez'}`, 5, y);
  y += 4;
  doc.text(`Cliente: ${sale.customer_name || 'CONSUMIDOR FINAL'}`, 5, y);
  y += 4;
  doc.text(`CI/RUC: ${sale.customer_id_number || '9999999999999'}`, 5, y);

  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(5, y, 75, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Cant.  Descripción          P.Unit    Total', 5, y);
  doc.setFont('helvetica', 'normal');

  y += 2;
  items.forEach((item) => {
    y += 5;
    const nameTruncated = item.product_name.substring(0, 16);
    doc.text(`${item.quantity}x   ${nameTruncated.padEnd(16, ' ')} $${item.unit_price.toFixed(2)}  $${item.total.toFixed(2)}`, 5, y);
  });

  y += 6;
  doc.line(5, y, 75, y);

  y += 5;
  doc.text(`Subtotal 0% IVA:`, 35, y);
  doc.text(`$${sale.subtotal_0.toFixed(2)}`, 75, y, { align: 'right' });

  y += 4;
  doc.text(`Subtotal 15% IVA:`, 35, y);
  doc.text(`$${sale.subtotal_iva.toFixed(2)}`, 75, y, { align: 'right' });

  y += 4;
  doc.text(`IVA (15%):`, 35, y);
  doc.text(`$${sale.iva_amount.toFixed(2)}`, 75, y, { align: 'right' });

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`TOTAL A PAGAR:`, 35, y);
  doc.text(`$${sale.total_amount.toFixed(2)}`, 75, y, { align: 'right' });

  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Método de Pago:`, 35, y);
  doc.text(sale.payment_method.toUpperCase(), 75, y, { align: 'right' });

  if (sale.payment_method === 'efectivo') {
    y += 4;
    doc.text(`Efectivo Recibido:`, 35, y);
    doc.text(`$${sale.amount_paid.toFixed(2)}`, 75, y, { align: 'right' });

    y += 4;
    doc.text(`Cambio:`, 35, y);
    doc.text(`$${sale.change_given.toFixed(2)}`, 75, y, { align: 'right' });
  }

  y += 10;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('¡Gracias por su compra!', 40, y, { align: 'center' });
  y += 4;
  doc.text('Documento interno de control comercial.', 40, y, { align: 'center' });

  return doc;
}

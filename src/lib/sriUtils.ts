// ==============================================================================
// UTILIDADES SRI ECUADOR — FACTURACIÓN ELECTRÓNICA & VALIDACIONES
// Algoritmo oficial de Clave de Acceso (49 dígitos), Módulo 11, XML Factura v1.1.0
// y validación de Cédula y RUC ecuatoriano.
// ==============================================================================

/**
 * Calcula el Dígito Verificador de 1 dígito mediante el algoritmo Módulo 11
 * según las especificaciones técnicas del SRI del Ecuador.
 */
export function calculateModulo11(digits48: string): number {
  if (digits48.length !== 48) {
    throw new Error('La cadena para el Módulo 11 debe tener exactamente 48 dígitos.');
  }

  const factors = [2, 3, 4, 5, 6, 7];
  let sum = 0;
  let factorIndex = 0;

  // Recorrer de derecha a izquierda
  for (let i = digits48.length - 1; i >= 0; i--) {
    const digit = parseInt(digits48[i], 10);
    const factor = factors[factorIndex % factors.length];
    sum += digit * factor;
    factorIndex++;
  }

  const remainder = sum % 11;
  let checkDigit = 11 - remainder;

  if (checkDigit === 11) {
    checkDigit = 0;
  } else if (checkDigit === 10) {
    checkDigit = 1;
  }

  return checkDigit;
}

/**
 * Genera la Clave de Acceso oficial del SRI de 49 dígitos numéricos
 */
export function generateAccessKey(params: {
  date: Date;
  docType: '01' | '04' | '05' | '06' | '07'; // 01: Factura, 04: Nota de Crédito
  ruc: string;
  environment: '1' | '2'; // 1: Pruebas, 2: Producción
  establishment: string; // 3 dígitos ej: '001'
  emissionPoint: string; // 3 dígitos ej: '001'
  sequential: string; // 9 dígitos ej: '000000001'
  numericCode?: string; // 8 dígitos aleatorios
  emissionType?: '1'; // 1: Normal
}): string {
  const pad = (n: number | string, len: number) => String(n).padStart(len, '0');

  const day = pad(params.date.getDate(), 2);
  const month = pad(params.date.getMonth() + 1, 2);
  const year = String(params.date.getFullYear());
  const dateFormatted = `${day}${month}${year}`;

  const cleanRuc = params.ruc.replace(/\D/g, '').padEnd(13, '0').slice(0, 13);
  const estab = pad(params.establishment.replace(/\D/g, ''), 3);
  const ptoEmi = pad(params.emissionPoint.replace(/\D/g, ''), 3);
  const seq = pad(params.sequential.replace(/\D/g, ''), 9);
  const numCode = params.numericCode ? pad(params.numericCode, 8) : pad(Math.floor(10000000 + Math.random() * 90000000), 8);
  const emiType = params.emissionType || '1';

  const base48 = `${dateFormatted}${params.docType}${cleanRuc}${params.environment}${estab}${ptoEmi}${seq}${numCode}${emiType}`;
  const checkDigit = calculateModulo11(base48);

  return `${base48}${checkDigit}`;
}

/**
 * Valida si un número de Cédula o RUC de Ecuador es formalmente válido
 */
export function validateEcuadorianId(id: string): { isValid: boolean; type: 'cedula' | 'ruc_natural' | 'ruc_privada' | 'ruc_publica' | 'consumidor_final' | 'invalido'; message: string } {
  const clean = id.trim().replace(/\D/g, '');

  if (clean === '9999999999999') {
    return { isValid: true, type: 'consumidor_final', message: 'Consumidor Final válido' };
  }

  if (clean.length === 10) {
    // Validar cédula
    const prov = parseInt(clean.substring(0, 2), 10);
    if ((prov < 1 || prov > 24) && prov !== 30) {
      return { isValid: false, type: 'invalido', message: 'Código de provincia de cédula inválido.' };
    }

    const thirdDigit = parseInt(clean[2], 10);
    if (thirdDigit >= 6) {
      return { isValid: false, type: 'invalido', message: 'Tercer dígito de cédula debe ser menor a 6.' };
    }

    const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let val = parseInt(clean[i], 10) * coefficients[i];
      if (val >= 10) val -= 9;
      sum += val;
    }

    const verifier = (10 - (sum % 10)) % 10;
    if (verifier === parseInt(clean[9], 10)) {
      return { isValid: true, type: 'cedula', message: 'Cédula de ciudadanía ecuatoriana válida.' };
    }
    return { isValid: false, type: 'invalido', message: 'Dígito verificador de cédula incorrecto.' };
  }

  if (clean.length === 13) {
    if (!clean.endsWith('001') && !clean.endsWith('0001')) {
      return { isValid: false, type: 'invalido', message: 'El RUC debe terminar en establecimiento válido (ej: 001).' };
    }

    // Persona natural (primeros 10 dígitos corresponden a cédula)
    const cedulaPart = clean.substring(0, 10);
    const cedulaCheck = validateEcuadorianId(cedulaPart);
    if (cedulaCheck.isValid) {
      return { isValid: true, type: 'ruc_natural', message: 'RUC de Persona Natural válido.' };
    }

    const third = parseInt(clean[2], 10);
    if (third === 9) {
      // Sociedad privada o extranjero
      const coeff = [4, 3, 2, 7, 6, 5, 4, 3, 2];
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(clean[i], 10) * coeff[i];
      }
      const rem = sum % 11;
      const verifier = rem === 0 ? 0 : 11 - rem;
      if (verifier === parseInt(clean[9], 10)) {
        return { isValid: true, type: 'ruc_privada', message: 'RUC de Sociedad Privada válido.' };
      }
    } else if (third === 6) {
      // Sociedad pública
      const coeff = [3, 2, 7, 6, 5, 4, 3, 2];
      let sum = 0;
      for (let i = 0; i < 8; i++) {
        sum += parseInt(clean[i], 10) * coeff[i];
      }
      const rem = sum % 11;
      const verifier = rem === 0 ? 0 : 11 - rem;
      if (verifier === parseInt(clean[8], 10)) {
        return { isValid: true, type: 'ruc_publica', message: 'RUC de Entidad Pública válido.' };
      }
    }
  }

  return { isValid: false, type: 'invalido', message: 'Identificación ecuatoriana no cumple la estructura oficial.' };
}

/**
 * Genera el XML en formato estándar del SRI para Factura Electrónica versión 1.1.0
 */
export function buildSriFacturaXml(data: {
  accessKey: string;
  establishment: string;
  emissionPoint: string;
  sequential: string;
  date: Date;
  store: {
    ruc: string;
    tradeName: string;
    legalName: string;
    address: string;
  };
  customer: {
    idType: string; // '04': RUC, '05': Cédula, '06': Pasaporte, '07': Consumidor Final
    idNumber: string;
    name: string;
    address?: string;
    email?: string;
  };
  totals: {
    subtotal0: number;
    subtotalIva: number;
    ivaAmount: number;
    discountTotal: number;
    grandTotal: number;
    ivaRate: number;
  };
  items: Array<{
    code: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
    ivaRate: number;
    ivaAmount: number;
  }>;
  paymentMethod: string;
}): string {
  const pad = (n: number | string, len: number) => String(n).padStart(len, '0');
  const d = data.date;
  const dateStr = `${pad(d.getDate(), 2)}/${pad(d.getMonth() + 1, 2)}/${d.getFullYear()}`;

  // Mapeo tipo identificación comprador SRI
  let codTipoId = '07';
  if (data.customer.idNumber === '9999999999999') codTipoId = '07';
  else if (data.customer.idNumber.length === 13) codTipoId = '04';
  else if (data.customer.idNumber.length === 10) codTipoId = '05';
  else codTipoId = '06';

  // Código forma de pago SRI (01: Sin utilización del sistema financiero / Efectivo, 19: Tarjeta de crédito, 20: Otros con utilización del sistema financiero)
  let formaPago = '01';
  if (data.paymentMethod === 'tarjeta') formaPago = '19';
  if (data.paymentMethod === 'transferencia') formaPago = '20';

  const itemsXml = data.items.map((item) => `
    <detalle>
      <codigoPrincipal>${item.code}</codigoPrincipal>
      <descripcion>${escapeXml(item.name)}</descripcion>
      <cantidad>${item.quantity.toFixed(2)}</cantidad>
      <precioUnitario>${item.unitPrice.toFixed(4)}</precioUnitario>
      <descuento>${item.discount.toFixed(2)}</descuento>
      <precioTotalSinImpuesto>${item.subtotal.toFixed(2)}</precioTotalSinImpuesto>
      <impuestos>
        <impuesto>
          <codigo>2</codigo>
          <codigoPorcentaje>${item.ivaRate > 0 ? '4' : '0'}</codigoPorcentaje>
          <tarifa>${item.ivaRate.toFixed(2)}</tarifa>
          <baseImponible>${item.subtotal.toFixed(2)}</baseImponible>
          <valor>${item.ivaAmount.toFixed(2)}</valor>
        </impuesto>
      </impuestos>
    </detalle>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="1.1.0">
  <infoTributaria>
    <ambiente>1</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>${escapeXml(data.store.legalName)}</razonSocial>
    <nombreComercial>${escapeXml(data.store.tradeName)}</nombreComercial>
    <ruc>${data.store.ruc}</ruc>
    <claveAcceso>${data.accessKey}</claveAcceso>
    <codDoc>01</codDoc>
    <estab>${data.establishment}</estab>
    <ptoEmi>${data.emissionPoint}</ptoEmi>
    <secuencial>${data.sequential}</secuencial>
    <dirMatriz>${escapeXml(data.store.address)}</dirMatriz>
  </infoTributaria>
  <infoFactura>
    <fechaEmision>${dateStr}</fechaEmision>
    <dirEstablecimiento>${escapeXml(data.store.address)}</dirEstablecimiento>
    <obligadoContabilidad>NO</obligadoContabilidad>
    <tipoIdentificacionComprador>${codTipoId}</tipoIdentificacionComprador>
    <razonSocialComprador>${escapeXml(data.customer.name)}</razonSocialComprador>
    <identificacionComprador>${data.customer.idNumber}</identificacionComprador>
    <totalSinImpuestos>${(data.totals.subtotal0 + data.totals.subtotalIva).toFixed(2)}</totalSinImpuestos>
    <totalDescuento>${data.totals.discountTotal.toFixed(2)}</totalDescuento>
    <totalConImpuestos>
      ${data.totals.subtotalIva > 0 ? `
      <totalImpuesto>
        <codigo>2</codigo>
        <codigoPorcentaje>4</codigoPorcentaje>
        <baseImponible>${data.totals.subtotalIva.toFixed(2)}</baseImponible>
        <tarifa>${data.totals.ivaRate.toFixed(2)}</tarifa>
        <valor>${data.totals.ivaAmount.toFixed(2)}</valor>
      </totalImpuesto>` : ''}
      ${data.totals.subtotal0 > 0 ? `
      <totalImpuesto>
        <codigo>2</codigo>
        <codigoPorcentaje>0</codigoPorcentaje>
        <baseImponible>${data.totals.subtotal0.toFixed(2)}</baseImponible>
        <tarifa>0.00</tarifa>
        <valor>0.00</valor>
      </totalImpuesto>` : ''}
    </totalConImpuestos>
    <propina>0.00</propina>
    <importeTotal>${data.totals.grandTotal.toFixed(2)}</importeTotal>
    <moneda>DOLAR</moneda>
    <pagos>
      <pago>
        <formaPago>${formaPago}</formaPago>
        <total>${data.totals.grandTotal.toFixed(2)}</total>
      </pago>
    </pagos>
  </infoFactura>
  <detalles>${itemsXml}
  </detalles>
  <infoAdicional>
    <campoAdicional nombre="Email">${data.customer.email || 'N/A'}</campoAdicional>
    <campoAdicional nombre="Direccion">${escapeXml(data.customer.address || 'Quito')}</campoAdicional>
    <campoAdicional nombre="GeneradoPor">ERP / POS Ecuador</campoAdicional>
  </infoAdicional>
</factura>`;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

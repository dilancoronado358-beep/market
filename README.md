# ERP / POS Ecuador — Sistema Integral de Gestión Comercial

> **Sistema empresarial de gestión comercial integral para retail, tiendas y empresas en Ecuador.**  
> Diseñado bajo estándares de ingeniería de software con arquitectura relacional normalizada, Kardex inmutable, control exhaustivo de visitas de proveedores, Punto de Venta (POS) transaccional con soporte para escáner de código de barras por cámara del dispositivo, arqueo de caja ciego, facturación electrónica homologada al SRI (Servicio de Rentas Internas del Ecuador), interfaz 100% responsiva para celulares y seguridad basada en roles (RBAC) con persistencia en Supabase (PostgreSQL).

---

## 📌 Tabla de Contenidos
1. [Visión General y Arquitectura](#visión-general-y-arquitectura)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Ecosistema de Módulos](#ecosistema-de-módulos)
4. [Módulo Prioritario: Control de Visitas de Proveedores](#módulo-prioritario-control-de-visitas-de-proveedores)
5. [Facturación Electrónica SRI vs. Facturación Interna](#facturación-electrónica-sri-vs-facturación-interna)
6. [Inventario, Kardex y Valoración de Costos](#inventario-kardex-y-valoración-de-costos)
7. [Punto de Venta (POS) y Control de Caja](#punto-de-venta-pos-y-control-de-caja)
8. [Matriz de Roles, Usuarios y Permisos (RBAC)](#matriz-de-roles-usuarios-y-permisos-rbac)
9. [Instalación y Ejecución Local](#instalación-y-ejecución-local)
10. [Configuración de Supabase y Migraciones SQL](#configuración-de-supabase-y-migraciones-sql)
11. [Pruebas Automatizadas y QA](#pruebas-automatizadas-y-qa)
12. [Estructura del Proyecto](#estructura-del-proyecto)

---

## 🏛 Visión General y Arquitectura

TIENDA KATY centraliza en un único sistema unificado todas las operaciones comerciales, logísticas, tributarias y administrativas de una tienda física comercial, preparado arquitectónicamente para soportar futuras sucursales (`stores`).

### Principios Fundamentales:
* **Cero Maquetas o Mocks:** Todas las operaciones (ventas, recepciones, retiros, mermas, arqueos, generación de claves SRI) modifican el estado transaccional, calculan balances atómicamente y registran entradas en el Kardex y en la bitácora de auditoría.
* **Trazabilidad Absoluta:** Ningún movimiento de inventario ocurre de manera aislada; todo cambio de existencias está respaldado por un documento de origen (Factura, Acta de Visita, Arqueo o Venta).
* **Seguridad y Validación Estricta:** Validación de identificación ecuatoriana (Cédula de 10 dígitos y RUC de 13 dígitos mediante Módulo 10 y Módulo 11), control estricto de permisos en frontend y backend (RLS), y contraseñas protegidas.

---

## 💻 Stack Tecnológico

| Capa | Tecnología | Propósito |
|---|---|---|
| **Frontend Framework** | **React 19 + TypeScript + Vite** | SPA ultrarrápida, tipado estricto y compilación optimizada |
| **Estilos & Diseño** | **Tailwind CSS + Lucide Icons** | Diseño responsive, sobrio, moderno y de alta densidad de datos |
| **Backend & Base de Datos** | **PostgreSQL (Supabase) + RLS** | Esquema de 45+ tablas relacionales, disparadores transaccionales y políticas de seguridad por fila |
| **Persistencia & Fallback** | **Dual Storage Engine (`databaseState.ts`)** | Soporte tanto para Supabase Cloud como para modo offline/local con persistencia completa en `localStorage` |
| **Gráficos & Métricas** | **Recharts** | Visualización ejecutiva de ventas, tendencias por método de pago y stock |
| **Documentos & Reportes** | **jsPDF + jsPDF-AutoTable** | Generación de Actas de Visita y comprobantes POS en PDF |
| **Exportación / Importación** | **SheetJS (XLSX)** | Importación masiva de catálogo y exportación de reportes a Excel/CSV |
| **Testing Automatizado** | **Vitest** | Pruebas de integración de flujos críticos de negocio |

---

## 📦 Ecosistema de Módulos

El sistema cuenta con **20 módulos operativos reales**:

1. **Autenticación & Sesiones:** Login profesional con visor de contraseña, recuperación de contraseña simulada y real, cambio de usuario demo rápido y protección estricta de rutas.
2. **Dashboard Ejecutivo:** KPIs de facturación del día/mes, conteo de transacciones, ticket promedio, distribución por métodos de pago, alertas de stock bajo y visitas activas.
3. **Catálogo de Productos:** Gestión completa de códigos internos, SKU, código de barras EAN-13, categorías, marcas, unidades de medida (ej. paquete vs unidad con factor de conversión), costo ponderado, margen de utilidad e impuestos IVA (15% general / 0% alimentos canasta básica).
4. **Inventario & Kardex Inmutable:** Movimientos inmutables (Entradas, Salidas, Saldos, Costos Unitarios) con recálculo automático de Costo Promedio Ponderado y bloqueo de saldos negativos.
5. **Control de Visitas de Proveedores (Expediente Digital):** Registro de llegada/salida, recepción detallada (declarada vs física vs aceptada vs rechazada), alta de productos nuevos al vuelo, retiros físicos, productos dañados en cuarentena, cambios mano a mano, compromisos de reposición y Acta de Visita con firmas en PDF.
6. **Gestión de Proveedores:** Perfil 360°, contactos comerciales, plazos de crédito y cronología completa de visitas, compras y devoluciones.
7. **Órdenes de Compra:** Solicitud, aprobación, control de recepción parcial o total y vinculación a facturas de compra.
8. **Punto de Venta (POS):** Búsqueda por código de barras o teclado en tiempo real, selección de cliente o Consumidor Final, cálculo de subtotal sin impuestos, base IVA 0%, base IVA 15%, descuentos por línea, métodos de pago múltiples (efectivo con cálculo de cambio, tarjeta, transferencia bancaria), descuento atómico de stock e impresión directa de ticket térmico.
9. **Historial de Ventas & Devoluciones:** Reimpresión de comprobantes y anulación de ventas con reversión automática en Kardex auditada.
10. **Directorio de Clientes:** Validación de Cédula/RUC, historial de consumos y preferencias de facturación.
11. **Documentos Internos de Control:** Emisión de Notas de Entrega, Vales de Salida y Comprobantes Internos identificados con marcas de agua para diferenciarlos de documentos fiscales.
12. **Facturación Electrónica SRI:** Generación oficial de Claves de Acceso de 49 dígitos con algoritmo Módulo 11, ensamblado de XML Factura v1.1.0 según la ficha técnica del SRI, visor de XML formateado, ciclo de estados (Generado, Transmitido, Autorizado, Rechazado, Contingencia) y soporte para ambientes de Pruebas y Producción.
13. **Caja y Cierres de Turno:** Apertura con fondo inicial, registro de ingresos y egresos de caja chica justificados, arqueo ciego (conteo físico de efectivo) y conciliación automática de sobrantes/faltantes.
14. **Centro de Correos Electrónicos:** Bandeja y cola de envíos con estados (Pendiente, Enviado, Fallido), reintentos programados y plantillas para Facturas, Actas de Visita y Alertas de Stock.
15. **Motor de Automatizaciones:** Reglas activas configurables que reaccionan a eventos (ej. alerta al llegar a stock mínimo, tareas de revisión ante discrepancias de mercadería, advertencias de reposiciones vencidas).
16. **Reportes & Inteligencia de Negocio:** Reportes filtrables de ventas, inventario, márgenes brutos y desempeño de proveedores con exportación directa a Excel (XLSX), CSV y PDF.
17. **Bitácora de Auditoría Inmutable:** Registro de usuario, fecha, módulo, acción, IP de origen, valores anteriores (`old_values`) y nuevos (`new_values`).
18. **Administración de Usuarios & Permisos:** Matriz de 7 roles con permisos granulares por acción (ej. autorizar anulación de venta, cambiar costos, ajustar inventario).
19. **Configuración General:** Datos tributarios del emisor (Razón social, RUC 13 dígitos, Establecimiento 001, Punto de Emisión 001, Dirección matriz, IVA predeterminado).

---

## 🎯 Módulo Prioritario: Control de Visitas de Proveedores

Cada visita de un proveedor constituye un **expediente digital completo y auditable**:

1. **Check-in de Llegada:** Registro del proveedor, vendedor/chofer asignado, hora de entrada, documento de referencia (factura/guía) y motivo de la visita.
2. **Recepción con 4 Cantidades:**
   * Cantidad Declarada en Guía/Factura.
   * Cantidad Recibida Físicamente.
   * Cantidad Aceptada (ingresa inmediatamente al inventario vendible).
   * Cantidad Rechazada (con motivo: averiado, vencido, producto no solicitado).
3. **Alta de Producto Nuevo "Al Vuelo":** Si el camión trae un producto inexistente en el catálogo, se puede crear directamente desde la recepción sin abandonar la visita, vinculando código de barras, costo, PVP, categoría, lote y fecha de expiración.
4. **Retiros Físicos de Mercadería:** Documentación de mercadería devuelta al proveedor (por caducidad, mal estado o error de despacho) con descuento inmediato de inventario y generación del comprobante de retiro.
5. **Cuarentena de Productos Dañados:** Los productos detectados como rotos o averiados se segregan a un estado de **Cuarentena / No Vendible**, garantizando que el POS no pueda facturarlos por error.
6. **Cambios Mano a Mano:** Registro simultáneo del producto que se entrega y del producto de reemplazo recibido, calculando si existe diferencia económica a favor o en contra.
7. **Compromisos de Reposición con SLA:** Registro de mercadería faltante que el proveedor promete reponer en una fecha límite estipulada, con alertas automáticas si se incumple la fecha.
8. **Acta de Visita Imprimible / PDF:** Generación en un clic del acta completa con desglose de todo lo ocurrido y campos de firma física para el bodeguero y el transportista.

---

## 🧾 Facturación Electrónica SRI vs. Facturación Interna

El sistema cumple rigurosamente con la normativa tributaria ecuatoriana y **diferencia tajantemente** los documentos internos de los comprobantes fiscales:

### 1. Documentos Internos de Control
* Tienen leyendas claras como: *"DOCUMENTO INTERNO SIN VALIDEZ TRIBUTARIA"*.
* Se emplean para traslados internos, notas de entrega rápida y comprobantes de almacén.

### 2. Facturación Electrónica SRI (Ecuador)
* **Algoritmo Oficial Módulo 11:** Implementado en `src/lib/sriUtils.ts`.
* **Clave de Acceso de 49 Dígitos:**
  ```
  [Fecha: 8d][Tipo: 2d][RUC: 13d][Ambiente: 1d][Establecimiento: 3d][Punto Emisión: 3d][Secuencial: 9d][Código Numérico: 8d][Tipo Emisión: 1d][Dígito Verificador: 1d]
  ```
* **Esquema XML v1.1.0:** Estructura completa con bloques `infoTributaria`, `infoFactura`, `totalConImpuestos`, `detalles`, `impuestos` y `pagos`.
* **Ciclo de Vida Transaccional:**
  * `GENERADO`: Clave de acceso calculada y XML estructurado.
  * `FIRMADO`: Listo para transmisión mediante certificado PKCS#12 (.p12).
  * `TRANSMITIDO`: Enviado al Web Service de Recepción del SRI.
  * `AUTORIZADO`: Confirmado con número de autorización y fecha del SRI.
  * `RECHAZADO`: Devuelto con código de error y mensaje explicativo del SRI.
  * `CONTINGENCIA`: Respaldo operativo si los servicios del SRI no responden.

---

## 📊 Inventario, Kardex y Valoración de Costos

* **Kardex Inmutable:** Cada entrada o salida se almacena en `inventory_movements`. Las correcciones se realizan únicamente mediante reversiones auditadas (tipo `AJUSTE_POSITIVO` o `AJUSTE_NEGATIVO`).
* **Costo Promedio Ponderado (CPP):**
  $$\text{Nuevo Costo Ponderado} = \frac{(\text{Stock Anterior} \times \text{Costo Anterior}) + (\text{Cantidad Entrada} \times \text{Costo Entrada})}{\text{Stock Total Nuevo}}$$
* **Políticas de Integridad:** Se valida transaccionalmente que ninguna venta o retiro genere stock negativo en bodega.

---

## 🛒 Punto de Venta (POS) y Control de Caja

* **Operación Fluida:** Diseñado para teclado numérico y pistolas lectoras de código de barras.
* **Cálculo de Impuestos Exacto:** Desglose automático de Base Imponible IVA 15%, Base IVA 0% y valor total del impuesto.
* **Múltiples Formas de Pago:** Efectivo con cálculo en pantalla del vuelto/cambio a entregar, tarjeta de débito/crédito y transferencias bancarias directas (Pichincha, Guayaquil, Deuna, etc.).
* **Control de Turno de Caja (Arqueo Ciego):**
  1. **Apertura:** Registro de fecha/hora, usuario y monto de fondo inicial de caja.
  2. **Movimientos de Turno:** Registro clasificado de ingresos y retiros de efectivo con justificación obligatoria.
  3. **Arqueo Ciego al Cierre:** El cajero ingresa el dinero físico que cuenta en gaveta sin ver el teórico del sistema.
  4. **Conciliación:** El sistema compara el conteo contra las ventas y movimientos registrados, detallando si el turno cerró *Cuadrado*, con *Faltante* o con *Sobrante*.

---

## 👥 Matriz de Roles, Usuarios y Permisos (RBAC)

El sistema incluye 7 cuentas preconfiguradas con diferentes privilegios operacionales:

| Rol | Correo de Acceso | Contraseña | Alcance Principal |
|---|---|---|---|
| **Administrador** | `admin@tiendakaty.ec` | `Password123!` | Control total, configuración tributaria, gestión de roles, auditoría. |
| **Gerente** | `gerente@tiendakaty.ec` | `Password123!` | Dashboard, reportes comerciales, supervisión de compras y ventas. |
| **Supervisor** | `supervisor@tiendakaty.ec` | `Password123!` | Autorización de descuentos, anulación de ventas, arqueos y devoluciones. |
| **Cajero** | `cajero@tiendakaty.ec` | `Password123!` | Punto de venta (POS), cobros, consulta básica de clientes y cierre de su caja. |
| **Encargado de Inventario** | `bodega@tiendakaty.ec` | `Password123!` | Catálogo, Kardex, recepción de mercadería, cuarentena de daños y retiros. |
| **Responsable de Compras** | `compras@tiendakaty.ec` | `Password123!` | Proveedores, cotizaciones, órdenes de compra y compromisos de reposición. |
| **Auditor** | `auditor@tiendakaty.ec` | `Password123!` | Acceso de solo lectura a auditoría, Kardex y reportes financieros sin permisos de escritura. |

> **Nota:** La pantalla de inicio de sesión cuenta con un panel desplegable de **"Acceso Rápido Demo"** para ingresar con un solo clic a cualquiera de estos roles durante revisiones y demostraciones.

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
* Node.js v18+ o v20+
* Administrador de paquetes `npm`

### Pasos de Instalación:

1. **Clonar o ubicarse en la carpeta del proyecto:**
   ```bash
   cd "TIENDA KATY"
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Copie el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Si no se configuran credenciales de Supabase en el `.env`, el sistema opera automáticamente en modo de persistencia local enriquecida con datos semilla listos para operar).*

4. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   El sistema estará accesible en `http://localhost:5173`.

5. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 🗄 Configuración de Supabase y Migraciones SQL

El backend de base de datos relacional PostgreSQL con RLS está completamente estructurado en la carpeta `supabase/migrations/`:

* **`20261022_initial_schema.sql`**: Definición de las más de 45 tablas (profiles, products, inventory_movements, supplier_visits, sales, electronic_documents, cash_sessions, etc.), tipos ENUM, restricciones de integridad referencial e índices de alto rendimiento.
* **`20261022_triggers_and_functions.sql`**: Funciones almacenadas PL/pgSQL y disparadores atómicos para:
  * Validación y actualización de saldos en Kardex.
  * Recálculo automático de Costo Promedio Ponderado en compras.
  * Disparador de auditoría universal para inserciones, actualizaciones y eliminaciones.
  * Políticas de Row Level Security (RLS) para proteger los datos por sucursal y rol de usuario.

### Pasos para conectar su propia base de datos Supabase:
1. Cree un proyecto gratuito o de producción en [Supabase.com](https://supabase.com).
2. Abra el **SQL Editor** en el panel de Supabase y ejecute secuencialmente los dos archivos SQL de la carpeta `supabase/migrations/`.
3. Copie su **Project URL** y su **Anon Public Key** desde `Project Settings -> API`.
4. Péguelas en su archivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Reinicie el servidor con `npm run dev`. El cliente de Supabase tomará la conexión remota instantáneamente.

---

## 🧪 Pruebas Automatizadas y QA

El proyecto cuenta con una suite completa de pruebas unitarias y de integración que validan los flujos comerciales más críticos:

```bash
npm run test
```

### Casos de Prueba Verificados:
* ✅ Validación de formato de Cédula y RUC de Ecuador (Módulo 10 y 11).
* ✅ Algoritmo de Módulo 11 para el dígito verificador de la Clave de Acceso del SRI.
* ✅ Generación de Clave de Acceso oficial de 49 dígitos con estructura exacta.
* ✅ Generación y estructura de etiquetas del XML de Facturación Electrónica v1.1.0.
* ✅ Distinción de documentos internos vs. tributarios (leyendas obligatorias).
* ✅ Cálculo exacto de impuestos: Subtotales, IVA 15%, IVA 0% y cálculo de vuelto en POS.
* ✅ Control de stock en ventas y rechazo de compras con stock insuficiente.
* ✅ Impacto atómico de recepciones en Kardex y recálculo de Costo Promedio Ponderado.
* ✅ Alta de productos nuevos al vuelo desde una recepción de proveedor.
* ✅ Registro de retiro físico de mercadería con disminución de inventario.
* ✅ Segregación de productos dañados en cuarentena no vendible.
* ✅ Arqueo ciego de caja: Detección de faltante, sobrante o cierre cuadrado.
* ✅ Matriz de autorización RBAC (permisos específicos por rol).

---

## 📁 Estructura del Proyecto

```text
TIENDA KATY/
├── public/                 # Favicon y recursos estáticos
├── src/
│   ├── components/
│   │   ├── common/         # Button, Input, Modal, DataTable, Badge, StatCard
│   │   └── layout/         # AppShell, Sidebar, Header, GlobalSearch
│   ├── context/
│   │   ├── AuthContext.tsx # Autenticación, sesión y RBAC
│   │   └── StoreContext.tsx# Estado global comercial, transacciones y Kardex
│   ├── lib/
│   │   ├── databaseState.ts# Motor de persistencia relacional con seed data
│   │   ├── sriUtils.ts     # Clave de acceso 49 dígitos, Módulo 11 y XML SRI
│   │   ├── pdfGenerator.ts # Generación de Actas de Visita y Tickets POS (jsPDF)
│   │   ├── excelUtils.ts   # Exportación e importación masiva con SheetJS
│   │   ├── utils.ts        # Formateo de moneda ($ USD) y fechas
│   │   └── supabase.ts     # Cliente oficial de Supabase
│   ├── pages/
│   │   ├── auth/           # Login y recuperación de contraseña
│   │   ├── dashboard/      # Dashboard con métricas comerciales en tiempo real
│   │   ├── visits/         # MÓDULO PRIORITARIO: Expediente digital de visitas
│   │   ├── products/       # Catálogo de productos e importación/exportación
│   │   ├── inventory/      # Kardex inmutable y ajustes autorizados
│   │   ├── pos/            # Punto de Venta transaccional de alta velocidad
│   │   ├── sales/          # Historial de ventas y anulación con reversión
│   │   ├── sri/            # Facturación Electrónica SRI y visor de XML
│   │   ├── internal-docs/  # Comprobantes internos de control
│   │   ├── suppliers/      # Directorio de proveedores y línea de tiempo 360°
│   │   ├── purchases/      # Órdenes de compra y recepción documental
│   │   ├── customers/      # Directorio de clientes con validación Cédula/RUC
│   │   ├── cash/           # Caja, aperturas, movimientos y arqueo ciego
│   │   ├── emails/         # Centro y cola de correos electrónicos
│   │   ├── automations/    # Motor de reglas reactivas del negocio
│   │   ├── reports/        # Reportes analíticos con exportación Excel/PDF
│   │   ├── audit/          # Bitácora inmutable de auditoría
│   │   ├── users/          # Administración de roles y permisos
│   │   └── settings/       # Configuración general y parámetros del SRI
│   ├── test/
│   │   └── businessFlows.test.ts # Suite de 17 pruebas de integración
│   ├── types/
│   │   ├── auth.ts         # Definiciones de roles y matriz de permisos
│   │   └── database.ts     # Interfaces completas de las entidades relacionales
│   ├── App.tsx             # Enrutamiento protegido por sesión y roles
│   ├── index.css           # Configuración de estilos y tipografías
│   └── main.tsx            # Punto de entrada de la aplicación
├── supabase/
│   └── migrations/         # Migraciones SQL completas para PostgreSQL
├── .env.example            # Ejemplo de variables de entorno documentadas
├── package.json            # Scripts y dependencias del sistema
├── tailwind.config.js      # Paleta de colores sobria y temas
├── tsconfig.json           # Configuración de TypeScript
└── vite.config.ts          # Configuración de Vite con alias @
```

---

## 🔒 Consideraciones de Seguridad y Buenas Prácticas

1. **Variables de Entorno Seguras:** Las credenciales y claves privadas nunca se compilan en el bundle público.
2. **Firmas y Certificados Digitales:** La firma digital de comprobantes XML mediante certificados `.p12` se ejecuta en entornos de servidor desacoplados para proteger la clave criptográfica del emisor.
3. **Respaldo de Datos:** En caso de corte de red, el motor local garantiza la continuidad del Punto de Venta sin pérdida de transacciones.

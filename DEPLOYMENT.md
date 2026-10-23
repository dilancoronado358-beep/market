# Guía de Despliegue en Producción — TIENDA KATY

Esta guía describe los pasos necesarios para desplegar **TIENDA KATY** en un entorno de producción utilizando **Vercel** para el frontend y **Supabase** como backend de base de datos PostgreSQL, autenticación y almacenamiento.

---

## 1. Despliegue de la Base de Datos en Supabase

### Paso 1.1: Crear el Proyecto en Supabase
1. Inicie sesión en [supabase.com](https://supabase.com) y cree una nueva organización/proyecto.
2. Asigne un nombre al proyecto (por ejemplo `tienda-katy-prod`) y elija una contraseña segura para la base de datos PostgreSQL.
3. Seleccione la región más cercana a Ecuador (por ejemplo `us-east-1` Norteamérica / N. Virginia) para minimizar la latencia.

### Paso 1.2: Ejecutar las Migraciones SQL
En el panel de su proyecto en Supabase:
1. Diríjase a la sección **SQL Editor**.
2. Abra y copie el contenido de `supabase/migrations/20261022_initial_schema.sql` y ejecútelo con el botón **Run**.
   * Esto creará los tipos ENUM, las más de 45 tablas relacionales, claves foráneas, restricciones de unicidad e índices.
3. Abra y copie el contenido de `supabase/migrations/20261022_triggers_and_functions.sql` y ejecútelo.
   * Esto activará las funciones almacenadas en PL/pgSQL, los triggers automáticos de recálculo de costos promedio ponderados, el control atómico de saldos en Kardex y las políticas de Row Level Security (RLS).

### Paso 1.3: Obtener las Credenciales de API
En la barra lateral izquierda, vaya a **Project Settings > API**:
* Copie la **Project URL** (`https://[ID_PROYECTO].supabase.co`).
* Copie la clave pública **anon** (`ey...`).

---

## 2. Despliegue del Frontend en Vercel

### Paso 2.1: Conectar el Repositorio a Vercel
1. Suba el código a un repositorio privado de GitHub, GitLab o Bitbucket.
2. Inicie sesión en [vercel.com](https://vercel.com) y haga clic en **Add New... > Project**.
3. Importe el repositorio correspondiente a **TIENDA KATY**.

### Paso 2.2: Configurar el Entorno de Compilación
Vercel detectará automáticamente que se trata de un proyecto Vite:
* **Framework Preset:** Vite
* **Root Directory:** `./`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Install Command:** `npm install`

### Paso 2.3: Configurar las Variables de Entorno en Vercel
En la sección **Environment Variables**, agregue las siguientes variables:

| Variable | Valor de Ejemplo | Descripción |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Clave pública anónima de Supabase |
| `VITE_SRI_ENVIRONMENT` | `1` o `2` | `1` = Pruebas SRI, `2` = Producción SRI |
| `VITE_SRI_EMISSION_TYPE` | `1` | `1` = Emisión Normal |
| `VITE_STORE_RUC` | `1790012345001` | RUC oficial de 13 dígitos de la tienda |
| `VITE_STORE_ESTABLISHMENT` | `001` | Código de establecimiento tributario |
| `VITE_STORE_EMISSION_POINT` | `001` | Código de punto de emisión tributario |
| `VITE_EMAIL_SENDER_NAME` | `TIENDA KATY` | Nombre comercial del remitente de correos |
| `VITE_EMAIL_SENDER_ADDRESS`| `facturacion@tiendakaty.ec` | Dirección de correo del remitente |

### Paso 2.4: Desplegar
Haga clic en **Deploy**. Vercel compilará la aplicación y le asignará un dominio seguro con certificado SSL automático (por ejemplo `https://tienda-katy.vercel.app`).

---

## 3. Configuración para Enrutamiento SPA en Vercel

Para garantizar que rutas como `/pos`, `/visitas-proveedores`, `/kardex` se recarguen correctamente sin generar errores HTTP 404, se recomienda incluir un archivo `vercel.json` en la raíz del proyecto si no está ya presente:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 4. Configuración del Facturador Electrónico del SRI

Para emitir facturas electrónicas válidas en ambiente de **Producción**:
1. Obtenga su **Certificado de Firma Electrónica** en archivo `.p12` emitido por una entidad de certificación autorizada en Ecuador (Banco Central, Security Data, ANF, Uanataca, etc.).
2. Ingrese al portal **SRI en Línea** y solicite la autorización para emisión de comprobantes electrónicos en ambiente de Producción.
3. Configure los servicios de firmado y envío en un microservicio de backend seguro (como una Supabase Edge Function o API Node.js protegida) utilizando la clave criptográfica sin exponer jamás la contraseña del `.p12` en el cliente.
4. En **TIENDA KATY**, diríjase a **Configuración > Facturación SRI** y verifique que el número de establecimiento (`001`) y punto de emisión (`001`) coincidan con los registrados en su RUC.

---

## 5. Verificación Pre-Vuelo (Checklist de Salida a Producción)

Antes de abrir el sistema al personal:
- [ ] Ejecutar `npm run test` para asegurar que las 17 pruebas de integración pasen al 100%.
- [ ] Abrir la aplicación y verificar la redirección automática al Login al no existir sesión activa.
- [ ] Iniciar sesión con el usuario Administrador y verificar que los datos comerciales carguen adecuadamente.
- [ ] Realizar una venta de prueba en el POS para comprobar la deducción de inventario en el Kardex.
- [ ] Abrir y cerrar una sesión de caja para comprobar el funcionamiento del arqueo ciego.
- [ ] Generar un Acta de Visita en PDF desde el módulo de Visitas de Proveedores.
- [ ] Verificar la emisión de un XML de Factura Electrónica y su Clave de Acceso de 49 dígitos con Módulo 11.

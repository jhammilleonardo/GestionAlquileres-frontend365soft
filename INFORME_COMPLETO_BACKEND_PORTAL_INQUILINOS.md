# 📋 INFORME COMPLETO: Endpoints Faltantes en Backend - Portal de Inquilinos

**Proyecto:** GestionAlquileres 365Soft
**Fecha:** 9 de Febrero, 2026
**Análisis Realizado:** Frontend Angular - Portal de Inquilinos
**Archivos Revisados:** 18 componentes + 7 servicios + 3 modelos

---

## 🚨 HALLAZGO CRÍTICO #1: Sistema de Autenticación Compartido

### ⚠️ PROBLEMA GRAVE: Inquilinos y Administradores usan los MISMOS endpoints de autenticación

**Ubicación del código:**
- **Tenant Auth:** `src/app/core/services/tenant-auth.service.ts:65`
- **Admin Auth:** `src/app/core/services/auth.service.ts:77`

**Endpoints actuales (COMPARTIDOS):**
```typescript
// AMBOS servicios usan exactamente los MISMOS endpoints:
POST /auth/{slug}/login      // Login (línea 65 en tenant, línea 77 en admin)
GET  /auth/me                // Validar token (línea 116 tenant, línea 142 admin)
```

### 🔴 Riesgos de Seguridad:
1. **No hay diferenciación de roles** en el endpoint
2. Un inquilino podría potencialmente **autenticarse como admin** si conoce las credenciales
3. **No hay validación separada** de permisos por tipo de usuario
4. **Confusión en tokens JWT** - no queda claro qué tipo de usuario está autenticado

### ✅ Solución Recomendada:

**Opción A: Endpoints Separados (RECOMENDADO)**
```typescript
// Tenant
POST /auth/{slug}/tenant/login
GET  /auth/tenant/me

// Admin
POST /auth/{slug}/admin/login
GET  /auth/admin/me
```

**Opción B: Validación de Roles en Endpoint Único**
```typescript
// Usar el mismo endpoint pero validar rol en backend
POST /auth/{slug}/login
// Response debe incluir: { role: 'TENANT' | 'ADMIN', permissions: [...] }
```

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Total Endpoints | Estado | Prioridad |
|-----------|----------------|--------|-----------|
| **Autenticación** | 2 | ⚠️ Compartidos con Admin | 🔴 CRÍTICA |
| **Contratos** | 5 | ❌ Faltan | 🟡 MEDIA |
| **Propiedades** | 2 | ❌ Faltan | 🟡 MEDIA |
| **Mantenimiento** | 6 | ⚠️ Existen en Admin | 🟢 BAJA |
| **Pagos** | 6 | ❌ Faltan | 🔴 ALTA |
| **Documentos** | 4 | ❌ Faltan | 🟡 MEDIA |
| **Mensajes** | 7 | ❌ Faltan | 🟡 MEDIA |
| **Perfil de Usuario** | 2 | ❌ Simulados | 🟡 MEDIA |
| **Configuración** | ? | ❓ No implementado | 🟢 BAJA |

**TOTAL: ~34 endpoints faltantes**

---

## 1️⃣ MÓDULO: Autenticación del Inquilino

### 🔴 Endpoint: `POST /auth/{slug}/tenant/login`
**Estado:** ⚠️ Compartido con admin - REQUIERE SEPARACIÓN
**Archivo Frontend:** `tenant-auth.service.ts:60-80`
**Uso en UI:** `tenant-login.component.ts:504-522`

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response Esperado:**
```json
{
  "access_token": "string (JWT)",
  "user": {
    "id": "number",
    "name": "string",
    "email": "string",
    "phone": "string | null",
    "role": "TENANT",
    "tenant_slug": "string",
    "contract": {
      "id": "number",
      "contract_number": "string",
      "property_title": "string",
      "status": "ACTIVO | POR_VENCER | VENCIDO | etc"
    }
  }
}
```

**Notas Importantes:**
- El inquilino DEBE tener un `contract` activo para acceder al portal
- El response incluye información del contrato para el dashboard
- La validación `hasActiveContract()` requiere que `status` sea 'ACTIVO' o 'POR_VENCER'

---

### 🔴 Endpoint: `GET /auth/tenant/me`
**Estado:** ⚠️ Compartido con admin - REQUIERE SEPARACIÓN
**Archivo Frontend:** `tenant-auth.service.ts:112-129`
**Headers:** `Authorization: Bearer {token}`

**Response:** Mismo formato que login (sin el access_token)

**Uso:**
- Validación de token al iniciar la app
- Refresh de datos del usuario
- Verificación de sesión activa

---

## 2️⃣ MÓDULO: Contratos (Tenant Contracts)

### 🟡 Endpoint: `GET /{slug}/tenant/contracts/current`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-contract.service.ts:98-120`
**Prioridad:** 🟡 MEDIA

**Descripción:** Obtener el contrato activo del inquilino autenticado

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "id": "number",
  "tenant_id": "number",
  "property_id": "number",
  "contract_number": "string",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "key_delivery_date": "YYYY-MM-DD | null",
  "monthly_rent": "number",
  "currency": "string (default: USD)",
  "payment_day": "number (1-31)",
  "deposit_amount": "number",
  "payment_method": "string",
  "status": "BORRADOR | PENDIENTE | FIRMADO | ACTIVO | POR_VENCER | VENCIDO | RENOVADO | FINALIZADO | CANCELADO | SUSPENDIDO",
  "is_signed": "boolean",
  "signed_at": "YYYY-MM-DD HH:mm:ss | null",
  "signed_ip": "string | null",
  "property": {
    "id": "number",
    "title": "string",
    "address": "string"
  },
  "created_at": "YYYY-MM-DD HH:mm:ss",
  "updated_at": "YYYY-MM-DD HH:mm:ss"
}
```

**Validaciones Backend:**
- Solo devolver contratos donde `tenant_id` = ID del usuario autenticado
- Priorizar estado `ACTIVO`, luego `POR_VENCER`
- Si no hay contrato activo, devolver 404

---

### 🟡 Endpoint: `GET /{slug}/tenant/contracts`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-contract.service.ts:125-150`
**Query Params:** `?status=ACTIVO` (opcional)

**Response:** Array del formato anterior

**Uso:**
- Ver historial de contratos
- Filtrar por estado
- Dashboard de contratos

---

### 🟡 Endpoint: `GET /{slug}/tenant/contracts/{id}`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-contract.service.ts:155-169`

**Response:** Mismo formato que `/current`

**Validación:** Solo permitir acceso si el `tenant_id` del contrato coincide con el usuario autenticado

---

### 🟡 Endpoint: `POST /{slug}/tenant/contracts/{id}/sign`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-contract.service.ts:174-204`

**Descripción:** Firma digital del contrato

**Body:** `{}` (vacío, la firma se registra automáticamente)

**Response:**
```json
{
  "message": "Contrato firmado exitosamente",
  "contract": {
    /* Contrato actualizado con is_signed=true */
  }
}
```

**Lógica Backend:**
1. Verificar que el contrato pertenece al tenant autenticado
2. Verificar que el contrato no esté ya firmado
3. Actualizar: `is_signed = true`, `signed_at = NOW()`, `signed_ip = IP_REQUEST`
4. Si `status = 'PENDIENTE'`, cambiar a `'FIRMADO'`

---

### 🟡 Endpoint: `GET /{slug}/tenant/contracts/{id}/pdf`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-contract.service.ts:209-217`

**Response Type:** `application/pdf` (Blob)

**Descripción:** Generar y descargar PDF del contrato

**Headers de Response:**
```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="Contrato-{contract_number}.pdf"
```

---

## 3️⃣ MÓDULO: Propiedades (Tenant Properties)

### 🟡 Endpoint: `GET /{slug}/tenant/properties`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-property.service.ts:74-96`

**Descripción:** Obtener propiedades asociadas al inquilino (via contratos activos)

**Response:**
```json
[
  {
    "id": "number",
    "title": "string",
    "description": "string | null",
    "address": "string",
    "city": "string",
    "state": "string",
    "postal_code": "string",
    "country": "string",
    "bedrooms": "number",
    "bathrooms": "number",
    "area_sqm": "number",
    "furnished": "boolean",
    "parking_spaces": "number",
    "floor": "number | null",
    "building_name": "string | null",
    "property_type": "string",
    "property_subtype": "string | null",
    "status": "string",
    "monthly_rent": "number",
    "currency": "string",
    "images": [
      {
        "id": "number",
        "property_id": "number",
        "image_url": "string",
        "is_primary": "boolean",
        "display_order": "number"
      }
    ],
    "amenities": ["string"],
    "created_at": "YYYY-MM-DD HH:mm:ss",
    "updated_at": "YYYY-MM-DD HH:mm:ss"
  }
]
```

**Lógica Backend:**
- Buscar contratos donde `tenant_id` = usuario autenticado
- JOIN con `properties` para obtener detalles completos
- Incluir solo propiedades de contratos activos o recientes

---

### 🟡 Endpoint: `GET /{slug}/tenant/properties/{id}`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-property.service.ts:101-115`

**Response:** Mismo formato que el array anterior (objeto único)

**Validación:** Solo permitir si el inquilino tiene contrato activo para esa propiedad

---

## 4️⃣ MÓDULO: Mantenimiento (Tenant Maintenance)

**NOTA IMPORTANTE:** El backend de mantenimiento **YA EXISTE** en `/{slug}/admin/maintenance/*`.
Solo necesitan **adaptar los endpoints existentes** para inquilinos con permisos restringidos.

### 🟢 Endpoint: `GET /{slug}/tenant/maintenance/my-requests`
**Estado:** ⚠️ Existe en admin, necesita versión tenant
**Archivo Frontend:** `tenant-maintenance.service.ts:70-90`
**Componente UI:** `tenant-maintenance-list.component.ts:484-487`

**Descripción:** Obtener solicitudes de mantenimiento del inquilino

**Response:**
```json
[
  {
    "id": "number",
    "ticket_number": "string (MNT-2026-XXXX)",
    "request_type": "MAINTENANCE | GENERAL",
    "category": "GENERAL | ACCESORIOS | ELECTRICO | CLIMATIZACION | LLAVE_CERRADURA | ILUMINACION | AFUERA | PLOMERIA | null",
    "title": "string",
    "description": "string",
    "permission_to_enter": "YES | NO | NOT_APPLICABLE",
    "has_pets": "boolean",
    "entry_notes": "string | null",
    "status": "NEW | IN_PROGRESS | COMPLETED | DEFERRED | CLOSED",
    "priority": "LOW | NORMAL | HIGH",
    "due_date": "YYYY-MM-DD | null",
    "assigned_to": "number | null",
    "tenant_id": "number",
    "property_id": "number",
    "contract_id": "number",
    "property": {
      "id": "number",
      "title": "string"
    },
    "contract": {
      "id": "number",
      "contract_number": "string"
    },
    "messages": [],
    "attachments": [],
    "created_at": "YYYY-MM-DD HH:mm:ss",
    "updated_at": "YYYY-MM-DD HH:mm:ss"
  }
]
```

**Diferencias con Admin:**
- Filtrar automáticamente por `tenant_id` del usuario autenticado
- NO exponer `assigned_to` (staff ID)
- NO permitir cambiar `status` o `priority`

---

### 🟢 Endpoint: `GET /{slug}/tenant/maintenance/stats`
**Estado:** ⚠️ Necesita implementarse
**Archivo Frontend:** `tenant-maintenance.service.ts:95-109`
**Uso en UI:** `tenant-dashboard.component.ts:796`, `tenant-maintenance-list.component.ts:54-64`

**Response:**
```json
{
  "total": "number",
  "active": "number (NEW + IN_PROGRESS)",
  "completed": "number"
}
```

---

### 🟢 Endpoint: `GET /{slug}/tenant/maintenance/{id}`
**Estado:** ⚠️ Existe en admin
**Archivo Frontend:** `tenant-maintenance.service.ts:114-121`
**Componente UI:** `tenant-request-detail.component.ts:644-657`

**Response:** Mismo formato que el array (objeto único)

**Validación:** Solo permitir si `tenant_id` coincide con usuario autenticado

---

### 🟢 Endpoint: `POST /{slug}/tenant/maintenance`
**Estado:** ⚠️ Necesita implementarse
**Archivo Frontend:** `tenant-maintenance.service.ts:126-147`
**Componente UI:** `tenant-create-request.component.ts:493-526`

**IMPORTANTE:** Los inquilinos **SÍ pueden crear** solicitudes (a diferencia del panel admin)

**Body:**
```json
{
  "request_type": "MAINTENANCE | GENERAL",
  "category": "PLOMERIA | ELECTRICO | etc | null",
  "title": "string (min 5 chars)",
  "description": "string (min 10 chars)",
  "permission_to_enter": "YES | NO | NOT_APPLICABLE",
  "has_pets": "boolean",
  "entry_notes": "string | null",
  "files": ["string[] | null"] // URLs o IDs de archivos subidos
}
```

**⚠️ CRÍTICO - NO incluir en el body:**
- `property_id` → Se detecta automáticamente desde el contrato activo del tenant
- `tenant_id` → Se obtiene del JWT
- `contract_id` → Se obtiene del contrato activo
- `status` → Siempre inicia como `NEW`
- `priority` → Siempre inicia como `NORMAL`

**Lógica Backend:**
1. Obtener tenant_id del JWT
2. Buscar contrato ACTIVO del tenant
3. Si no tiene contrato activo → ERROR 403 "No tienes un contrato activo"
4. Auto-asignar: `property_id`, `tenant_id`, `contract_id`
5. Auto-setear: `status = NEW`, `priority = NORMAL`
6. Generar `ticket_number` único
7. Si `request_type = 'GENERAL'` → `category = null`, `permission_to_enter = NOT_APPLICABLE`

---

### 🟢 Endpoint: `GET /{slug}/tenant/maintenance/{id}/messages`
**Estado:** ⚠️ Existe en admin
**Archivo Frontend:** `tenant-maintenance.service.ts:152-162`
**Componente UI:** `tenant-request-detail.component.ts:659-670`

**Response:**
```json
[
  {
    "id": "number",
    "request_id": "number",
    "user_id": "number",
    "user_name": "string",
    "message": "string",
    "send_to_resident": "boolean",
    "created_at": "YYYY-MM-DD HH:mm:ss",
    "attachments": [
      {
        "id": "number",
        "file_name": "string",
        "file_url": "string",
        "file_size": "number"
      }
    ]
  }
]
```

**Filtrado para Tenant:**
- Mostrar SOLO mensajes donde `send_to_resident = true` (públicos)
- NO mostrar notas internas (`send_to_resident = false`)

---

### 🟢 Endpoint: `POST /{slug}/tenant/maintenance/{id}/messages`
**Estado:** ⚠️ Existe en admin, necesita adaptación
**Archivo Frontend:** `tenant-maintenance.service.ts:167-178`
**Componente UI:** `tenant-request-detail.component.ts:672-687`

**Body:**
```json
{
  "message": "string",
  "files": ["string[] | null"]
}
```

**⚠️ IMPORTANTE:**
- El tenant **NO puede usar** el flag `send_to_resident` (se setea automáticamente a `true`)
- Siempre son mensajes públicos del tenant hacia el admin

---

## 5️⃣ MÓDULO: Pagos (Tenant Payments)

### 🔴 Endpoint: `GET /tenant/payments`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-payment.service.ts:40-66`
**Componente UI:** `tenant-payments-list.component.ts:642-645`, `tenant-dashboard.component.ts:797`
**Prioridad:** 🔴 ALTA

**Descripción:** Historial completo de pagos del inquilino

**Response:**
```json
[
  {
    "id": "number",
    "tenant_id": "number",
    "contract_id": "number",
    "property_id": "number",
    "amount": "number (decimal)",
    "payment_type": "RENT | DEPOSIT | LATE_FEE | UTILITY | OTHER",
    "payment_method": "CREDIT_CARD | DEBIT_CARD | BANK_TRANSFER | CASH | CHECK",
    "status": "PENDING | COMPLETED | FAILED | CANCELLED | REFUNDED",
    "due_date": "YYYY-MM-DD",
    "payment_date": "YYYY-MM-DD | null",
    "reference_number": "string | null",
    "description": "string | null",
    "notes": "string | null",
    "created_at": "YYYY-MM-DD HH:mm:ss",
    "updated_at": "YYYY-MM-DD HH:mm:ss"
  }
]
```

**Filtrado:** Solo pagos donde `tenant_id` = usuario autenticado
**Ordenamiento:** Por `due_date DESC`

---

### 🔴 Endpoint: `GET /tenant/payment-schedule`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-payment.service.ts:71-87`
**Componente UI:** `tenant-payments-list.component.ts:643` (tab Calendario)

**Descripción:** Calendario de pagos futuros programados

**Response:**
```json
[
  {
    "id": "number",
    "contract_id": "number",
    "amount": "number",
    "due_date": "YYYY-MM-DD",
    "payment_type": "RENT | UTILITY | etc",
    "is_paid": "boolean",
    "payment_id": "number | null"
  }
]
```

**Lógica Backend:**
- Generar basado en `payment_day` del contrato
- Calcular próximos 12 meses de rentas
- Marcar como `is_paid` si existe payment con `status = COMPLETED`
- Incluir otros pagos recurrentes (utilities, etc.)

---

### 🔴 Endpoint: `GET /tenant/payment-stats`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-payment.service.ts:93-109`
**Componente UI:** `tenant-payments-list.component.ts:48-94`, `tenant-dashboard.component.ts:37-48`
**Prioridad:** 🔴 ALTA

**Descripción:** Estadísticas de pagos para el dashboard

**Response:**
```json
{
  "total_paid": "number (suma de COMPLETED)",
  "total_pending": "number (suma de PENDING)",
  "next_payment_date": "YYYY-MM-DD | null",
  "next_payment_amount": "number | null",
  "on_time_payments": "number (pagos antes/en due_date)",
  "late_payments": "number (pagos después de due_date)"
}
```

**Cálculos:**
- `total_paid`: SUM(amount) WHERE status = 'COMPLETED'
- `total_pending`: SUM(amount) WHERE status = 'PENDING'
- `next_payment_date`: MIN(due_date) WHERE status = 'PENDING' AND due_date >= TODAY
- `on_time_payments`: COUNT WHERE payment_date <= due_date
- `late_payments`: COUNT WHERE payment_date > due_date

---

### 🔴 Endpoint: `POST /tenant/payments`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-payment.service.ts:114-140`
**Componente UI:** `tenant-create-payment.component.ts:386-408`
**Prioridad:** 🔴 ALTA

**Descripción:** Registrar un nuevo pago realizado

**Body:**
```json
{
  "amount": "number (required, min: 0.01)",
  "payment_type": "RENT | DEPOSIT | LATE_FEE | UTILITY | OTHER",
  "payment_method": "CREDIT_CARD | DEBIT_CARD | BANK_TRANSFER | CASH | CHECK",
  "payment_date": "YYYY-MM-DD",
  "reference_number": "string | null (max 50 chars)",
  "notes": "string | null (max 500 chars)"
}
```

**⚠️ NO incluir:**
- `tenant_id` → Del JWT
- `contract_id` → Del contrato activo
- `property_id` → Del contrato activo

**Lógica Backend:**
1. Verificar contrato activo
2. Buscar payment PENDING más antiguo del mismo `payment_type`
3. Si existe: actualizarlo con la info proporcionada, cambiar `status = COMPLETED`
4. Si no existe: crear nuevo payment con `status = COMPLETED`
5. Calcular `due_date` automáticamente si es renta regular

**Validaciones:**
- `amount > 0`
- `payment_date <= TODAY` (no puede registrar pagos futuros)
- Solo un pago activo por `payment_type` + mes

---

### 🔴 Endpoint: `GET /tenant/payments/{id}`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-payment.service.ts:145-167`

**Response:** Mismo formato que el array (objeto único)

**Validación:** Solo si `tenant_id` coincide

---

### 🔴 Endpoint: `GET /tenant/payments/{id}/receipt`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-payment.service.ts:172-176`
**Componente UI:** `tenant-payments-list.component.ts:647-651` (botón Download)

**Response Type:** `application/pdf` (Blob)

**Descripción:** Generar recibo de pago en PDF

**Headers:**
```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="Recibo-{payment_id}.pdf"
```

**Contenido del PDF:**
- Logo de la empresa
- Información del tenant
- Información de la propiedad
- Detalles del pago: monto, método, fecha, referencia
- Firma digital o timestamp

---

## 6️⃣ MÓDULO: Documentos (Tenant Documents)

### 🟡 Endpoint: `GET /tenant/documents`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-document.service.ts:27-51`
**Componente UI:** `tenant-documents.component.ts:517-518`, `tenant-dashboard.component.ts:800`

**Descripción:** Documentos asociados al inquilino (contratos, recibos, avisos, etc)

**Response:**
```json
[
  {
    "id": "number",
    "tenant_id": "number",
    "contract_id": "number | null",
    "title": "string",
    "description": "string | null",
    "document_type": "CONTRACT | ADDENDUM | NOTICE | RECEIPT | POLICY | OTHER",
    "status": "ACTIVE | ARCHIVED | EXPIRED",
    "file_url": "string (URL completa o path relativo)",
    "file_name": "string",
    "file_size": "number (bytes)",
    "uploaded_by": "number (admin user ID)",
    "uploaded_at": "YYYY-MM-DD HH:mm:ss",
    "expires_at": "YYYY-MM-DD HH:mm:ss | null",
    "requires_signature": "boolean",
    "is_signed": "boolean",
    "signed_at": "YYYY-MM-DD HH:mm:ss | null"
  }
]
```

**Filtrado:** Solo documentos donde `tenant_id` = usuario autenticado
**Ordenamiento:** Por `uploaded_at DESC`

---

### 🟡 Endpoint: `GET /tenant/documents/{id}`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-document.service.ts:56-77`

**Response:** Mismo formato (objeto único)

**Validación:** Solo si `tenant_id` coincide

---

### 🟡 Endpoint: `GET /tenant/documents/{id}/download`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-document.service.ts:82-86`
**Componente UI:** `tenant-documents.component.ts:528-543`

**Response Type:** `Blob` (binario)

**Headers:**
```http
Content-Type: application/pdf | image/jpeg | image/png (según file_type)
Content-Disposition: attachment; filename="{file_name}"
```

**Validación:** Solo si el documento pertenece al tenant

---

### 🟡 Endpoint: `POST /tenant/documents/{id}/sign`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-document.service.ts:91-114`
**Componente UI:** `tenant-documents.component.ts:545-557`

**Descripción:** Firma digital de documento

**Body:** `{}` (vacío)

**Response:**
```json
{
  "id": "number",
  "is_signed": true,
  "signed_at": "YYYY-MM-DD HH:mm:ss",
  /* ...resto del documento actualizado */
}
```

**Validaciones:**
1. Verificar que `requires_signature = true`
2. Verificar que `is_signed = false`
3. Verificar que pertenece al tenant
4. Actualizar: `is_signed = true`, `signed_at = NOW()`

---

## 7️⃣ MÓDULO: Mensajes (Tenant Messages)

### 🟡 Endpoint: `GET /tenant/messages`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-message.service.ts:34-57`
**Componente UI:** `tenant-messages.component.ts:799`, `tenant-dashboard.component.ts:799`

**Descripción:** Mensajes entre tenant y administración

**Response:**
```json
[
  {
    "id": "number",
    "subject": "string",
    "body": "string",
    "sender_id": "number",
    "sender_name": "string",
    "sender_role": "TENANT | ADMIN",
    "recipient_id": "number",
    "recipient_name": "string",
    "status": "UNREAD | READ | ARCHIVED",
    "priority": "LOW | NORMAL | HIGH | URGENT",
    "parent_message_id": "number | null",
    "created_at": "YYYY-MM-DD HH:mm:ss",
    "read_at": "YYYY-MM-DD HH:mm:ss | null",
    "attachments": [
      {
        "id": "number",
        "message_id": "number",
        "file_name": "string",
        "file_url": "string",
        "file_size": "number"
      }
    ]
  }
]
```

**Filtrado:**
- Mensajes donde `sender_id = tenant_id` OR `recipient_id = tenant_id`
- Excluir mensajes archivados si el parámetro `include_archived=false`

---

### 🟡 Endpoint: `GET /tenant/message-threads`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-message.service.ts:62-89`

**Descripción:** Conversaciones agrupadas por hilo

**Response:**
```json
[
  {
    "id": "number (thread_id o parent_message_id)",
    "subject": "string",
    "last_message": "string (preview)",
    "last_message_date": "YYYY-MM-DD HH:mm:ss",
    "unread_count": "number",
    "participants": ["string (nombres)"],
    "messages": [
      /* Array de mensajes del hilo */
    ]
  }
]
```

**Lógica:**
- Agrupar por `parent_message_id` o crear thread para mensaje inicial
- Ordenar threads por `last_message_date DESC`
- `unread_count` = COUNT(WHERE status = 'UNREAD' AND recipient_id = tenant_id)

---

### 🟡 Endpoint: `GET /tenant/messages/{id}`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-message.service.ts:94-114`
**Componente UI:** `tenant-messages.component.ts:814-824`

**Response:** Mismo formato que array (objeto único)

**Acción Adicional:**
- Si el tenant es el recipient y `status = UNREAD`, marcar automáticamente como READ

---

### 🟡 Endpoint: `POST /tenant/messages`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-message.service.ts:119-140`
**Componente UI:** `tenant-messages.component.ts:832-853`

**Descripción:** Crear nuevo mensaje al administrador

**Body:**
```json
{
  "subject": "string (required)",
  "body": "string (required)",
  "priority": "LOW | NORMAL | HIGH | URGENT",
  "parent_message_id": "number | null"
}
```

**⚠️ NO incluir:**
- `sender_id` → Del JWT
- `recipient_id` → Se asigna automáticamente al admin principal

**Lógica Backend:**
1. sender_id = tenant autenticado
2. recipient_id = admin del tenant slug
3. sender_role = 'TENANT'
4. status = 'UNREAD'
5. Si `parent_message_id` existe, vincular al thread

---

### 🟡 Endpoint: `POST /tenant/messages/reply`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-message.service.ts:145-166`
**Componente UI:** `tenant-messages.component.ts:855-872`

**Descripción:** Responder a un mensaje existente

**Body:**
```json
{
  "body": "string (required)",
  "parent_message_id": "number (required)"
}
```

**Lógica:**
1. Obtener mensaje padre con `parent_message_id`
2. Crear nuevo mensaje con:
   - `subject` = "Re: " + mensaje_padre.subject
   - `sender_id` = tenant
   - `recipient_id` = sender del mensaje padre
   - `parent_message_id` = ID proporcionado
3. Notificar al admin

---

### 🟡 Endpoint: `PUT /tenant/messages/{id}/read`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-message.service.ts:171-188`
**Componente UI:** `tenant-messages.component.ts:822` (al seleccionar mensaje)

**Body:** `{}` (vacío)

**Response:** `200 OK` o `204 No Content`

**Lógica:**
1. Verificar que el tenant es el recipient
2. Si `status = UNREAD`, actualizar a `READ` y setear `read_at = NOW()`
3. Si ya está READ, no hacer nada

---

### 🟡 Endpoint: `PUT /tenant/messages/{id}/archive`
**Estado:** ❌ NO EXISTE
**Archivo Frontend:** `tenant-message.service.ts:193-210`

**Body:** `{}` (vacío)

**Response:** `200 OK` o `204 No Content`

**Lógica:**
- Verificar que el tenant es sender o recipient
- Cambiar `status = ARCHIVED`
- Los mensajes archivados no aparecen en la lista principal

---

## 8️⃣ MÓDULO: Perfil de Usuario (Tenant Profile)

### 🟡 Endpoint: `PUT /tenant/profile`
**Estado:** ❌ NO EXISTE (actualmente simulado)
**Archivo Frontend:** `tenant-profile.component.ts:561-580`
**Línea de Simulación:** 571-579 (setTimeout con 1000ms)

**Descripción:** Actualizar información personal del inquilino

**Body:**
```json
{
  "name": "string (required)",
  "email": "string (required, email format)",
  "phone": "string | null (optional)"
}
```

**Response:**
```json
{
  "message": "Perfil actualizado exitosamente",
  "user": {
    "id": "number",
    "name": "string",
    "email": "string",
    "phone": "string | null",
    /* ...otros campos */
  }
}
```

**Validaciones:**
- `name`: requerido, min 2 caracteres
- `email`: requerido, formato email válido, único en tenant
- `phone`: opcional, formato teléfono válido

**⚠️ IMPORTANTE:**
- Si cambia el email, enviar email de confirmación
- Actualizar el JWT si es necesario

---

### 🟡 Endpoint: `PUT /tenant/password`
**Estado:** ❌ NO EXISTE (actualmente simulado)
**Archivo Frontend:** `tenant-profile.component.ts:597-616`
**Línea de Simulación:** 607-615 (setTimeout con 1000ms)

**Descripción:** Cambiar contraseña del inquilino

**Body:**
```json
{
  "current_password": "string (required)",
  "new_password": "string (required, min 8 chars)",
  "confirm_password": "string (required, must match new_password)"
}
```

**Response:**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

**Validaciones:**
1. Verificar que `current_password` es correcta
2. Verificar que `new_password !== current_password`
3. Verificar que `new_password.length >= 8`
4. Verificar que `new_password === confirm_password`
5. Hash de la nueva contraseña con bcrypt/argon2
6. Invalidar todos los tokens JWT existentes (opcional pero recomendado)

**Errores Comunes:**
- `401`: Contraseña actual incorrecta
- `400`: Nueva contraseña no cumple requisitos
- `400`: Las contraseñas no coinciden

---

## 9️⃣ MÓDULO: Configuración (Settings)

### ❓ Endpoint: `GET /tenant/settings`
**Estado:** ❓ NO MENCIONADO EN EL CÓDIGO
**Referencia:** `tenant-layout.component.ts:75` (ruta en menú pero sin implementación)

**Posibles Configuraciones:**
```json
{
  "notifications": {
    "email_enabled": "boolean",
    "sms_enabled": "boolean",
    "push_enabled": "boolean",
    "notify_payment_due": "boolean",
    "notify_maintenance_updates": "boolean",
    "notify_new_documents": "boolean",
    "notify_messages": "boolean"
  },
  "preferences": {
    "language": "es | en",
    "timezone": "string",
    "currency": "string"
  }
}
```

### ❓ Endpoint: `PUT /tenant/settings`
**Estado:** ❓ NO MENCIONADO

**Body:** Mismo formato que GET

---

## 📋 MODELOS DE DATOS COMPLETOS

### TenantDocument
```typescript
{
  id: number;
  tenant_id: number;
  contract_id?: number;
  title: string;
  description?: string;
  document_type: 'CONTRACT' | 'ADDENDUM' | 'NOTICE' | 'RECEIPT' | 'POLICY' | 'OTHER';
  status: 'ACTIVE' | 'ARCHIVED' | 'EXPIRED';
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_by: number;
  uploaded_at: Date;
  expires_at?: Date;
  requires_signature: boolean;
  is_signed: boolean;
  signed_at?: Date;
}
```

### Message
```typescript
{
  id: number;
  subject: string;
  body: string;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  recipient_id: number;
  recipient_name: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  parent_message_id?: number;
  created_at: Date;
  read_at?: Date;
  attachments: MessageAttachment[];
}
```

### Payment
```typescript
{
  id: number;
  tenant_id: number;
  contract_id: number;
  property_id: number;
  amount: number;
  payment_type: 'RENT' | 'DEPOSIT' | 'LATE_FEE' | 'UTILITY' | 'OTHER';
  payment_method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'CHECK';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  due_date: Date;
  payment_date?: Date;
  reference_number?: string;
  description?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}
```

---

## ⚠️ VALIDACIONES DE SEGURIDAD CRÍTICAS

### 1. Autenticación y Autorización
- ✅ Todos los endpoints requieren JWT válido
- ✅ Validar que el `tenant_id` del token coincide con los recursos solicitados
- ✅ NO confiar en `tenant_id` enviado en el body - siempre obtenerlo del JWT
- ✅ Implementar rate limiting (max 100 req/min por tenant)

### 2. Filtrado de Datos
- ✅ NUNCA devolver datos de otros tenants
- ✅ Filtrar siempre por `tenant_id` en consultas SQL
- ✅ Usar middleware de autorización en todas las rutas

### 3. Información Sensible
- ❌ NO exponer: IDs de staff, emails de admins, detalles internos
- ❌ NO permitir: Cambiar status de solicitudes, asignar staff, modificar precios
- ✅ Enmascarar: Últimos 4 dígitos de tarjetas, datos de otros tenants

### 4. Validación de Input
- ✅ Sanitizar TODOS los inputs de usuario
- ✅ Validar tipos de datos (números, fechas, emails)
- ✅ Limitar tamaño de archivos subidos (max 10MB)
- ✅ Validar extensiones de archivos permitidas

---

## 🔧 CONSIDERACIONES TÉCNICAS

### Formato de Fechas
- **Frontend espera:** Objetos `Date` JavaScript
- **Backend debe enviar:** Strings en formato ISO 8601 `YYYY-MM-DDTHH:mm:ss.SSSZ`
- **Backend debe recibir:** Strings en formato ISO o `YYYY-MM-DD`
- **Conversión:** El frontend hace automáticamente `new Date(string)` en los servicios

### Paginación
Aunque no está implementada actualmente, se recomienda agregar:
```
GET /tenant/payments?page=1&limit=20
GET /tenant/documents?page=1&limit=10
GET /tenant/messages?page=1&limit=50
```

### Headers Esperados
```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
Accept: application/json
```

### Respuestas de Error Estándar
```json
{
  "statusCode": 400,
  "message": "Descripción del error",
  "error": "Bad Request",
  "timestamp": "2026-02-09T10:30:00.000Z",
  "path": "/tenant/payments"
}
```

---

## 📊 PRIORIDADES DE IMPLEMENTACIÓN

### 🔴 FASE 1: CRÍTICA (Semana 1-2)
1. **Autenticación Separada** - Endpoints tenant distintos a admin
2. **Pagos Completos** - CRUD + estadísticas + recibos
3. **Dashboard Funcional** - Stats de mantenimiento y pagos

### 🟡 FASE 2: IMPORTANTE (Semana 3-4)
4. **Contratos** - Ver, firmar, descargar PDF
5. **Propiedades** - Información de la propiedad actual
6. **Documentos** - Subida, descarga, firma
7. **Mensajes** - Sistema de chat tenant-admin

### 🟢 FASE 3: COMPLEMENTARIA (Semana 5-6)
8. **Mantenimiento Tenant** - Adaptar endpoints admin existentes
9. **Perfil de Usuario** - Actualizar info personal y contraseña
10. **Configuración** - Notificaciones y preferencias

---

## ✅ CHECKLIST PARA EL EQUIPO DE BACKEND

### Autenticación
- [ ] Crear endpoint separado `POST /auth/{slug}/tenant/login`
- [ ] Crear endpoint `GET /auth/tenant/me`
- [ ] Implementar validación de rol en JWT
- [ ] Incluir información de contrato en response de login
- [ ] Agregar middleware de autorización tenant

### Contratos
- [ ] `GET /{slug}/tenant/contracts/current`
- [ ] `GET /{slug}/tenant/contracts`
- [ ] `GET /{slug}/tenant/contracts/{id}`
- [ ] `POST /{slug}/tenant/contracts/{id}/sign`
- [ ] `GET /{slug}/tenant/contracts/{id}/pdf` (generación PDF)

### Propiedades
- [ ] `GET /{slug}/tenant/properties`
- [ ] `GET /{slug}/tenant/properties/{id}`
- [ ] Incluir imágenes y amenidades

### Mantenimiento
- [ ] `GET /{slug}/tenant/maintenance/my-requests` (adaptar admin)
- [ ] `GET /{slug}/tenant/maintenance/stats`
- [ ] `GET /{slug}/tenant/maintenance/{id}` (adaptar admin)
- [ ] `POST /{slug}/tenant/maintenance` (auto-detectar property)
- [ ] `GET /{slug}/tenant/maintenance/{id}/messages` (filtrar públicos)
- [ ] `POST /{slug}/tenant/maintenance/{id}/messages`

### Pagos
- [ ] `GET /tenant/payments`
- [ ] `GET /tenant/payment-schedule`
- [ ] `GET /tenant/payment-stats`
- [ ] `POST /tenant/payments`
- [ ] `GET /tenant/payments/{id}`
- [ ] `GET /tenant/payments/{id}/receipt` (generación PDF)

### Documentos
- [ ] `GET /tenant/documents`
- [ ] `GET /tenant/documents/{id}`
- [ ] `GET /tenant/documents/{id}/download`
- [ ] `POST /tenant/documents/{id}/sign`

### Mensajes
- [ ] `GET /tenant/messages`
- [ ] `GET /tenant/message-threads`
- [ ] `GET /tenant/messages/{id}`
- [ ] `POST /tenant/messages`
- [ ] `POST /tenant/messages/reply`
- [ ] `PUT /tenant/messages/{id}/read`
- [ ] `PUT /tenant/messages/{id}/archive`

### Perfil
- [ ] `PUT /tenant/profile`
- [ ] `PUT /tenant/password`
- [ ] Email de confirmación al cambiar email

### Seguridad
- [ ] Implementar filtrado por tenant_id en TODOS los endpoints
- [ ] Validar permisos en middleware
- [ ] Rate limiting por tenant
- [ ] Logs de auditoría de acciones sensibles
- [ ] Sanitización de inputs
- [ ] Validación de archivos subidos

### Testing
- [ ] Tests unitarios de cada endpoint
- [ ] Tests de integración del flujo completo
- [ ] Tests de seguridad (intento de acceso a datos de otro tenant)
- [ ] Tests de performance
- [ ] Tests de manejo de errores

---

## 📞 CONTACTO Y SOPORTE

Para dudas o aclaraciones sobre este informe, contactar al equipo de frontend.

**Archivos de Referencia:**
- Servicios: `src/app/core/services/tenant-*.service.ts`
- Componentes: `src/app/features/tenant-portal/**/*.component.ts`
- Modelos: `src/app/core/models/*.model.ts`

---

**FIN DEL INFORME**

*Generado con Claude Code - 9 de Febrero, 2026*
*Análisis basado en: 18 componentes + 7 servicios + 3 modelos de datos*

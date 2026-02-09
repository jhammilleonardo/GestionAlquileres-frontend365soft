# 📋 Informe: Endpoints Faltantes en Backend - Portal de Inquilinos

**Fecha:** 9 de Febrero, 2026
**Proyecto:** GestionAlquileres 365Soft
**Componente:** Portal de Inquilinos (Tenant Portal)

---

## 🚨 PROBLEMA CRÍTICO: Sistema de Autenticación

### ⚠️ Inquilinos usan las MISMAS credenciales que Administradores

Actualmente, el portal de inquilinos está utilizando el **mismo endpoint de autenticación** que el panel de administrador:

**Endpoint actual (compartido):**
```
POST /auth/{slug}/login
GET /auth/me
```

**Frontend del Inquilino (TenantAuthService):**
- Archivo: `src/app/core/services/tenant-auth.service.ts`
- Línea 65: `POST ${apiUrl}auth/${slug}/login`
- Línea 116: `GET ${apiUrl}auth/me`

**Frontend del Admin (AuthService):**
- Archivo: `src/app/core/services/auth.service.ts`
- Línea 77: `POST ${apiUrl}auth/${slug}/login` (MISMO)
- Línea 142: `GET ${apiUrl}auth/me` (MISMO)

### ✅ Recomendación:
Crear endpoints separados para inquilinos:
```
POST /auth/{slug}/tenant/login
GET /auth/tenant/me
```

O implementar validación de roles en el backend para diferenciar entre admin y tenant usando el mismo endpoint.

---

## 📊 Resumen de Endpoints Requeridos

| Módulo | Endpoints Totales | Prioridad |
|--------|------------------|-----------|
| **Autenticación** | 2 | 🔴 Alta |
| **Contratos** | 6 | 🟡 Media |
| **Propiedades** | 2 | 🟡 Media |
| **Mantenimiento** | 6 | 🟢 Baja (ya existe en admin) |
| **Pagos** | 6 | 🔴 Alta |
| **Documentos** | 4 | 🟡 Media |
| **Mensajes** | 7 | 🟡 Media |

---

## 1️⃣ Módulo: Autenticación del Inquilino

### Endpoints Requeridos:

#### 🔴 `POST /auth/{slug}/tenant/login`
**Descripción:** Login específico para inquilinos
**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "access_token": "string",
  "user": {
    "id": "number",
    "name": "string",
    "email": "string",
    "phone": "string",
    "role": "TENANT",
    "tenant_slug": "string",
    "contract": {
      "id": "number",
      "contract_number": "string",
      "property_title": "string",
      "status": "string"
    }
  }
}
```
**Ubicación en Frontend:** `tenant-auth.service.ts:60-80`

---

#### 🔴 `GET /auth/tenant/me`
**Descripción:** Validar token y obtener info del inquilino
**Headers:** `Authorization: Bearer {token}`
**Response:** Mismo formato que el login
**Ubicación en Frontend:** `tenant-auth.service.ts:112-129`

---

## 2️⃣ Módulo: Contratos (Tenant Contracts)

### Endpoints Requeridos:

#### 🟡 `GET /{slug}/tenant/contracts/current`
**Descripción:** Obtener el contrato activo del inquilino
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "id": "number",
  "tenant_id": "number",
  "property_id": "number",
  "contract_number": "string",
  "start_date": "date",
  "end_date": "date",
  "key_delivery_date": "date | null",
  "monthly_rent": "number",
  "currency": "string",
  "payment_day": "number",
  "deposit_amount": "number",
  "payment_method": "string",
  "status": "ACTIVO | POR_VENCER | etc",
  "is_signed": "boolean",
  "signed_at": "date | null",
  "property": {
    "id": "number",
    "title": "string",
    "address": "string"
  }
}
```
**Ubicación en Frontend:** `tenant-contract.service.ts:98-120`

---

#### 🟡 `GET /{slug}/tenant/contracts`
**Descripción:** Obtener todos los contratos del inquilino
**Query Params:** `?status=ACTIVO` (opcional)
**Headers:** `Authorization: Bearer {token}`
**Response:** Array del formato anterior
**Ubicación en Frontend:** `tenant-contract.service.ts:125-150`

---

#### 🟡 `GET /{slug}/tenant/contracts/{id}`
**Descripción:** Detalle de un contrato específico
**Ubicación en Frontend:** `tenant-contract.service.ts:155-169`

---

#### 🟡 `POST /{slug}/tenant/contracts/{id}/sign`
**Descripción:** Firmar un contrato digitalmente
**Body:** `{}`
**Response:**
```json
{
  "message": "string",
  "contract": { /* contrato actualizado */ }
}
```
**Ubicación en Frontend:** `tenant-contract.service.ts:174-204`

---

#### 🟡 `GET /{slug}/tenant/contracts/{id}/pdf`
**Descripción:** Descargar contrato como PDF
**Response:** `Blob (application/pdf)`
**Ubicación en Frontend:** `tenant-contract.service.ts:209-217`

---

## 3️⃣ Módulo: Propiedades (Tenant Properties)

### Endpoints Requeridos:

#### 🟡 `GET /{slug}/tenant/properties`
**Descripción:** Obtener propiedades asignadas al inquilino
**Response:**
```json
[
  {
    "id": "number",
    "title": "string",
    "description": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "postal_code": "string",
    "bedrooms": "number",
    "bathrooms": "number",
    "area_sqm": "number",
    "furnished": "boolean",
    "parking_spaces": "number",
    "property_type": "string",
    "monthly_rent": "number",
    "images": [
      {
        "id": "number",
        "image_url": "string",
        "is_primary": "boolean"
      }
    ],
    "amenities": ["string"]
  }
]
```
**Ubicación en Frontend:** `tenant-property.service.ts:74-96`

---

#### 🟡 `GET /{slug}/tenant/properties/{id}`
**Descripción:** Detalle de una propiedad específica
**Ubicación en Frontend:** `tenant-property.service.ts:101-115`

---

## 4️⃣ Módulo: Mantenimiento (Tenant Maintenance)

**NOTA:** El backend de mantenimiento ya existe para el admin en `/{slug}/admin/maintenance/*`.
Necesitan crear endpoints espejo para inquilinos con permisos restringidos.

### Endpoints Requeridos:

#### 🟢 `GET /{slug}/tenant/maintenance/my-requests`
**Descripción:** Solicitudes de mantenimiento del inquilino
**Similar a:** `GET /{slug}/admin/maintenance` pero filtrado por tenant
**Ubicación en Frontend:** `tenant-maintenance.service.ts:70-90`

---

#### 🟢 `GET /{slug}/tenant/maintenance/stats`
**Descripción:** Estadísticas de solicitudes del inquilino
**Response:**
```json
{
  "total": "number",
  "active": "number",
  "completed": "number"
}
```
**Ubicación en Frontend:** `tenant-maintenance.service.ts:95-109`

---

#### 🟢 `GET /{slug}/tenant/maintenance/{id}`
**Descripción:** Detalle de solicitud
**Similar a:** `GET /{slug}/admin/maintenance/{id}`
**Ubicación en Frontend:** `tenant-maintenance.service.ts:114-121`

---

#### 🟢 `POST /{slug}/tenant/maintenance`
**Descripción:** Crear nueva solicitud de mantenimiento
**Body:**
```json
{
  "request_type": "MAINTENANCE | GENERAL",
  "category": "PLOMERIA | ELECTRICO | etc",
  "title": "string (min 5 chars)",
  "description": "string (min 10 chars)",
  "permission_to_enter": "YES | NO | NOT_APPLICABLE",
  "has_pets": "boolean",
  "entry_notes": "string | null",
  "files": ["string[]"] // URLs o IDs de archivos
}
```
**IMPORTANTE:** No debe incluir `property_id` o `tenant_id`, estos se detectan automáticamente desde el token JWT.
**Ubicación en Frontend:** `tenant-maintenance.service.ts:126-147`
**UI:** `tenant-create-request.component.ts:493-526`

---

#### 🟢 `GET /{slug}/tenant/maintenance/{id}/messages`
**Descripción:** Mensajes de una solicitud
**Similar a:** `GET /{slug}/admin/maintenance/{id}/messages`
**Ubicación en Frontend:** `tenant-maintenance.service.ts:152-162`

---

#### 🟢 `POST /{slug}/tenant/maintenance/{id}/messages`
**Descripción:** Enviar mensaje en una solicitud
**Body:**
```json
{
  "message": "string",
  "files": ["string[]"] // opcional
}
```
**NOTA:** El inquilino NO puede usar el flag `send_to_resident` (solo admin puede).
**Ubicación en Frontend:** `tenant-maintenance.service.ts:167-178`

---

## 5️⃣ Módulo: Pagos (Tenant Payments)

### Endpoints Requeridos:

#### 🔴 `GET /tenant/payments`
**Descripción:** Historial de pagos del inquilino
**Response:**
```json
[
  {
    "id": "number",
    "contract_id": "number",
    "amount": "number",
    "currency": "string",
    "due_date": "date",
    "payment_date": "date | null",
    "status": "PENDING | COMPLETED | OVERDUE | CANCELLED",
    "payment_method": "string",
    "reference_number": "string",
    "notes": "string",
    "created_at": "date",
    "updated_at": "date"
  }
]
```
**Ubicación en Frontend:** `tenant-payment.service.ts:40-66`

---

#### 🔴 `GET /tenant/payment-schedule`
**Descripción:** Calendario de pagos programados
**Response:**
```json
[
  {
    "due_date": "date",
    "amount": "number",
    "status": "string",
    "description": "string"
  }
]
```
**Ubicación en Frontend:** `tenant-payment.service.ts:71-87`

---

#### 🔴 `GET /tenant/payment-stats`
**Descripción:** Estadísticas de pagos
**Response:**
```json
{
  "total_payments": "number",
  "total_paid": "number",
  "total_pending": "number",
  "next_payment_date": "date | null",
  "next_payment_amount": "number | null"
}
```
**Ubicación en Frontend:** `tenant-payment.service.ts:93-109`

---

#### 🔴 `POST /tenant/payments`
**Descripción:** Registrar un nuevo pago
**Body:**
```json
{
  "amount": "number",
  "payment_date": "date",
  "payment_method": "string",
  "reference_number": "string",
  "notes": "string"
}
```
**Ubicación en Frontend:** `tenant-payment.service.ts:114-140`

---

#### 🔴 `GET /tenant/payments/{id}`
**Descripción:** Detalle de un pago
**Ubicación en Frontend:** `tenant-payment.service.ts:145-167`

---

#### 🔴 `GET /tenant/payments/{id}/receipt`
**Descripción:** Descargar recibo de pago (PDF)
**Response:** `Blob (application/pdf)`
**Ubicación en Frontend:** `tenant-payment.service.ts:172-176`

---

## 6️⃣ Módulo: Documentos (Tenant Documents)

### Endpoints Requeridos:

#### 🟡 `GET /tenant/documents`
**Descripción:** Documentos del inquilino (contratos, recibos, etc)
**Response:**
```json
[
  {
    "id": "number",
    "title": "string",
    "description": "string",
    "file_url": "string",
    "file_type": "string",
    "file_size": "number",
    "category": "CONTRACT | RECEIPT | OTHER",
    "uploaded_at": "date",
    "expires_at": "date | null",
    "is_signed": "boolean",
    "signed_at": "date | null"
  }
]
```
**Ubicación en Frontend:** `tenant-document.service.ts:27-51`

---

#### 🟡 `GET /tenant/documents/{id}`
**Descripción:** Detalle de un documento
**Ubicación en Frontend:** `tenant-document.service.ts:56-77`

---

#### 🟡 `GET /tenant/documents/{id}/download`
**Descripción:** Descargar documento
**Response:** `Blob`
**Ubicación en Frontend:** `tenant-document.service.ts:82-86`

---

#### 🟡 `POST /tenant/documents/{id}/sign`
**Descripción:** Firmar documento digitalmente
**Body:** `{}`
**Response:** Documento actualizado con `is_signed: true`
**Ubicación en Frontend:** `tenant-document.service.ts:91-114`

---

## 7️⃣ Módulo: Mensajes (Tenant Messages)

### Endpoints Requeridos:

#### 🟡 `GET /tenant/messages`
**Descripción:** Mensajes del inquilino
**Response:**
```json
[
  {
    "id": "number",
    "subject": "string",
    "content": "string",
    "sender": "string",
    "sender_type": "ADMIN | TENANT",
    "status": "UNREAD | READ | ARCHIVED",
    "created_at": "date",
    "read_at": "date | null"
  }
]
```
**Ubicación en Frontend:** `tenant-message.service.ts:34-57`

---

#### 🟡 `GET /tenant/message-threads`
**Descripción:** Hilos de conversación agrupados
**Response:**
```json
[
  {
    "thread_id": "string",
    "subject": "string",
    "last_message_date": "date",
    "unread_count": "number",
    "messages": [/* array de mensajes */]
  }
]
```
**Ubicación en Frontend:** `tenant-message.service.ts:62-89`

---

#### 🟡 `GET /tenant/messages/{id}`
**Descripción:** Detalle de un mensaje
**Ubicación en Frontend:** `tenant-message.service.ts:94-114`

---

#### 🟡 `POST /tenant/messages`
**Descripción:** Crear nuevo mensaje
**Body:**
```json
{
  "subject": "string",
  "content": "string",
  "recipient_type": "ADMIN"
}
```
**Ubicación en Frontend:** `tenant-message.service.ts:119-140`

---

#### 🟡 `POST /tenant/messages/reply`
**Descripción:** Responder a un mensaje
**Body:**
```json
{
  "message_id": "number",
  "content": "string"
}
```
**Ubicación en Frontend:** `tenant-message.service.ts:145-166`

---

#### 🟡 `PUT /tenant/messages/{id}/read`
**Descripción:** Marcar mensaje como leído
**Body:** `{}`
**Ubicación en Frontend:** `tenant-message.service.ts:171-188`

---

#### 🟡 `PUT /tenant/messages/{id}/archive`
**Descripción:** Archivar mensaje
**Body:** `{}`
**Ubicación en Frontend:** `tenant-message.service.ts:193-210`

---

## 📝 Notas Adicionales

### Seguridad y Autorización:
1. **Todos los endpoints deben validar** que el inquilino solo acceda a sus propios datos
2. **JWT debe incluir** `tenant_id` y `contract_id` para filtrar automáticamente
3. **No confiar** en parámetros del frontend para `tenant_id` o `property_id`

### Prioridades de Implementación:
1. 🔴 **Alta Prioridad:** Autenticación, Pagos
2. 🟡 **Media Prioridad:** Contratos, Propiedades, Documentos, Mensajes
3. 🟢 **Baja Prioridad:** Mantenimiento (ya existe en admin, solo adaptar)

### Validaciones Importantes:
- Contratos: Solo mostrar contratos donde `tenant_id` coincida con el usuario autenticado
- Pagos: Calcular automáticamente vencimientos basados en `payment_day` del contrato
- Mantenimiento: Auto-detectar `property_id` desde el contrato activo del inquilino
- Documentos: Filtrar solo documentos asociados al inquilino

---

## ✅ Checklist de Implementación

- [ ] Crear endpoints de autenticación separados para inquilinos
- [ ] Implementar módulo de Contratos (6 endpoints)
- [ ] Implementar módulo de Propiedades (2 endpoints)
- [ ] Adaptar módulo de Mantenimiento para inquilinos (6 endpoints)
- [ ] Implementar módulo de Pagos (6 endpoints)
- [ ] Implementar módulo de Documentos (4 endpoints)
- [ ] Implementar módulo de Mensajes (7 endpoints)
- [ ] Agregar middleware de autorización por rol
- [ ] Documentar API con Swagger/OpenAPI
- [ ] Crear tests de integración
- [ ] Validar permisos y seguridad

---

**Total de endpoints a implementar:** ~40 endpoints

**Generado por:** Claude Code
**Última actualización:** 9 de Febrero, 2026

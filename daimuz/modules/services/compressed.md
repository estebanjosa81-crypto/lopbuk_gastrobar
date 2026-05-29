# services — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué hace**: catálogo de servicios/citas publicables en el storefront — el cliente reserva desde la tienda pública
- **Tipos de servicio**: `cita` (con horario específico, duración en minutos) · `asesoria` (rango de fechas, descripción proyecto) · `contacto` (lead simple)
- **Disponibilidad**: `service_availability` define horarios semanales recurrentes con slots · `service_blocked_periods` bloquea fechas/horas específicas
- **Bookings**: `service_bookings` captura la reserva con estado `pendiente → confirmada → completada` · soporta pago previo
- **Archivos**: `services.service.ts`, `services.controller.ts`, `services.routes.ts`, `services-management.tsx`, `service-booking-modal.tsx` · Tablas: `services`, `service_bookings`, `service_availability`, `service_blocked_periods`

---

← [[DAIMUZ]] | [[indexes/modules-index]]

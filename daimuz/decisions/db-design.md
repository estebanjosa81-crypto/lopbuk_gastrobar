# 🗄️ Decisión: Diseño de Base de Datos

## Decisiones Principales

### UUID vs Auto-increment
**Decisión:** UUID v4 como PK en tablas de negocio  
**Por qué:** Seguridad (no expone volumen), portable entre DBs, sin conflictos en multi-tenant  
**Costo:** Más lento en joins que int (aceptable en este escala)

### Soft Delete
**Decisión:** `is_active = 0` en lugar de DELETE físico  
**Por qué:** Los datos financieros y de ventas son sagrados. Necesitas historia para auditoría, para mostrar historial de cliente, para reportes.  
**Nunca:** `DELETE FROM sales WHERE id = ?`

### MySQL directo vs ORM
**Decisión:** mysql2 con queries SQL directas  
**Por qué:** Control total, queries optimizables, sin magic que rompe en edge cases, más fácil de debuggear  
**vs TypeORM/Prisma:** Agregan complejidad y abstracciones que no necesitamos aún

### Encriptación de datos sensibles
**Decisión:** Campos específicos encriptados en la DB  
**Implementado en:** `utils/crypto.ts` con `encryptNullable`/`decryptNullable`  
**Qué se encripta:** cédulas, datos bancarios, información sensible del cliente

### Índices
```sql
-- Obligatorio en toda tabla de negocio:
INDEX idx_tenant (tenant_id)
INDEX idx_tenant_active (tenant_id, is_active)
INDEX idx_tenant_date (tenant_id, created_at)
```

---

← [[decisions/state-management]] | [[DAIMUZ]]

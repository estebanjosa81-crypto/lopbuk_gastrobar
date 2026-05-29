# cash-sessions — compressed

> 5 líneas. Si necesitas más → lee `cash-sessions.md`

- **Ciclo**: open(initialAmount) → ventas del turno suman → close(countedAmount) → diferencia = counted - calculated
- **Restricción**: 1 sola sesión activa por sede. Sin sesión = sin ventas.
- **Inmutable**: históricos de caja nunca se editan. Solo admin ve todo el historial.
- **Alerta**: si diferencia > umbral → notifica al admin
- **Archivos**: `cash-sessions.service.ts`, `cash-register.tsx`

---

← [[DAIMUZ]] | → [[modules/cash-sessions/cash-sessions]]

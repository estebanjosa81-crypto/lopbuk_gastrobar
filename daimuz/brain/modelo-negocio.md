# 💼 Modelo de negocio DAIMUZ (Chat Daimuz)

> Base oficial de la empresa. Fuente: carpeta `C:\daimuzdev\daimuz`
> (`base de la empresa daimuz.md`, `landig de venta chat daimuz.html`, logo e imágenes).
> Léelo antes de tocar landings, planes o el mensaje comercial.

---

## 1. Qué vende DAIMUZ (doble producto)

DAIMUZ monetiza por **dos lados**, encadenados:

| Producto | Qué es | Naturaleza |
|---|---|---|
| **Curso "Chat Daimuz Academy"** | Enseña a construir, entrenar y manejar tu **agente IA de ventas** | Producto de entrada (one-shot, vía Hotmart) |
| **Suscripción a Chat Daimuz** | Mantiene el agente **activo y conectado** a tu comercio para operar | Recurrente (Básico / Pro / Premium) |
| Configuración asistida (upsell) | "Te lo dejo listo": montar comercio, cargar productos, entrenar agente | Alto valor, opcional |

> Frase oficial: **«El curso te enseña el método. Chat Daimuz te da la infraestructura para ejecutarlo.»**

---

## 2. Qué es "Chat Daimuz" (el producto)

Un **agente IA de ventas y operación** para el comerciante. No es un chatbot básico:
**atiende clientes, vende, responde objeciones, hace seguimiento, organiza pedidos,
controla el negocio y genera datos — 24/7.**

Promesa: *"Aprende a construir tu agente IA, entrenarlo con tu negocio y convertirlo
en un vendedor digital que atiende, responde, hace seguimiento y ayuda a vender 24/7."*

---

## 3. Embudo comercial (cómo se vende)

```
Contenido orgánico (reels/carruseles)
   ↓
DM / WhatsApp  →  el propio agente Chat Daimuz diagnostica
   ↓
Oferta del CURSO  →  compra (Hotmart)
   ↓
Activación del PLAN (suscripción)  →  agente operando con clientes reales
   ↓
Resultados → renovación / upsell de plan
```

Cada comercio activo = **prueba viva** para generar contenido y vender más (antes/después, demos, casos).

---

## 4. Planes (nombres de marketing)

`Básico` · `Pro` · `Premium` (atención inicial → vender+seguimiento → embudos+reportes+automatización+soporte).

⚠️ **Nota de implementación:** en el **código actual** (`lopbuk_gastrobar`) los planes se
llaman `básico / profesional / empresarial` (`subscriptions`, `profile-modal`). Al alinear
marketing ↔ producto hay que mapear estos nombres. El **DAIMUZ Chat (ControlChat)** que opera
el negocio es la versión "premium/empresarial".

---

## 5. Relación con el código

- **El aplicativo** = la rama Comercio (`lopbuk_gastrobar`). Ver `branches/comercio.md`.
- **Chat Daimuz / ControlChat** = el agente que opera el negocio. Ver `brain/daimuz-chat.md`
  (modos Operativo vs ControlChat). Hoy el `agent/` responde; falta que **ejecute acciones**.
- **Landings**: `/daimuz` (venta del Curso + suscripción) ≠ `/portfolio` (portafolio de los
  **desarrolladores**, va aparte). El asistente público (robot) ya está integrado.

---

## 6. Mensajes / CTAs oficiales para landings
- Hero: *"Curso Chat Daimuz: construye tu agente y vende más."*
- CTA principal del curso: **"Quiero inscribirme"** (Hotmart).
- CTA app: **"Acceder"** → `https://daimuz.alexsters.works/login`.
- Cierre suscripción: *"Con el curso aprendes el método. Con la suscripción mantienes tu agente activo trabajando para tu comercio."*

---

← [[DAIMUZ]] | [[brain/empresa-y-ramas]] | [[brain/daimuz-chat]] | [[branches/comercio]]

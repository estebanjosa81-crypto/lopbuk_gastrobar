# 🗃️ Decisión: State Management

## Decisión
**Zustand** (no Redux, no Context API)

## Alternativas consideradas

| Opción | Descartada por |
|---|---|
| Redux Toolkit | Demasiado boilerplate para este tamaño |
| React Context | Re-renders innecesarios, no escala bien con muchos estados |
| Jotai/Recoil | Fragmentación excesiva del estado |
| TanStack Query | Bueno para fetching, no para estado local del POS |
| **Zustand** ✅ | Simple, sin boilerplate, performance perfecta |

## Por qué Zustand funciona aquí

```typescript
// Crear un store es trivial
const useStore = create<AppState>((set) => ({
  products: [],
  fetchProducts: async () => {
    const data = await api.get('/products')
    set({ products: data })
  }
}))

// Usar en componente
const { products, fetchProducts } = useStore()
```

- **Sin Provider** → no contamina el árbol de componentes
- **Selectores simples** → no hay selectors complicados
- **Persist middleware** → persiste estado entre refreshes fácilmente
- **DevTools** → compatible con Redux DevTools

## Estructura actual del store

```
lib/store.ts        → estado principal (productos, ventas, carrito, etc.)
lib/auth-store.ts   → estado de autenticación separado
```

Están separados porque el auth-store tiene diferentes patrones de persistencia.

---

← [[decisions/auth-approach]] | [[DAIMUZ]] | → [[decisions/db-design]]

'use client'

import { useEffect, useState, useRef } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  TrendingDown, TrendingUp, Plus, Trash2, Edit2, X, Check,
  Clock, DollarSign, BarChart3, AlignLeft, ChevronDown, ChevronUp,
  Wallet, Calendar, ArrowUpCircle, ArrowDownCircle, RefreshCw,
  Settings, Eye, EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })

const fmtDateOnly = (d: string | Date) =>
  new Date(d).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' })

const currentMonth = () => new Date().toISOString().slice(0, 7)

type SubTab = 'timeline' | 'gastos' | 'ingresos' | 'fijos' | 'resumen'

const CATEGORIAS_GASTO = [
  'egreso', 'insumos', 'bebidas', 'carne', 'verduras', 'servicios',
  'empaques', 'limpieza', 'marketing', 'transporte', 'extra',
]

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export function RestBarFinanzas() {
  const [subTab, setSubTab] = useState<SubTab>('timeline')
  const [month, setMonth]   = useState(currentMonth())
  const [loading, setLoading] = useState(false)

  // data
  const [timeline, setTimeline]     = useState<any[]>([])
  const [gastos, setGastos]         = useState<any[]>([])
  const [ingresos, setIngresos]     = useState<any[]>([])
  const [fijos, setFijos]           = useState<any[]>([])
  const [resumen, setResumen]       = useState<any>(null)

  // quick-add gasto
  const [newConcepto, setNewConcepto]   = useState('')
  const [newValor, setNewValor]         = useState('')
  const [newCantidad, setNewCantidad]   = useState('1')
  const [newCategoria, setNewCategoria] = useState('egreso')
  const [newNotas, setNewNotas]         = useState('')
  const conceptoRef = useRef<HTMLInputElement>(null)

  // quick-add ingreso
  const [newFecha, setNewFecha]         = useState(new Date().toISOString().slice(0, 10))
  const [newPedidos, setNewPedidos]     = useState('')
  const [newVentas, setNewVentas]       = useState('')
  const [newGanancia, setNewGanancia]   = useState('')

  // quick-add fijo
  const [newFijoNombre, setNewFijoNombre] = useState('')
  const [newFijoValor, setNewFijoValor]   = useState('')
  const [newFijoPeriodo, setNewFijoPeriodo] = useState('quincenal')

  // edit states
  const [editingGasto, setEditingGasto] = useState<any>(null)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [tl, gs, ing, fj, res] = await Promise.all([
        api.getRbTimeline(month),
        api.getRbGastos({ month }),
        api.getRbIngresos(month),
        api.getRbGastosFijos(),
        api.getRbResumen(month),
      ])
      if (tl.success)  setTimeline(tl.data  ?? [])
      if (gs.success)  setGastos((gs.data as any)?.gastos ?? [])
      if (ing.success) setIngresos(ing.data ?? [])
      if (fj.success)  setFijos(fj.data ?? [])
      if (res.success) setResumen(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [month])

  // ── QUICK-ADD GASTO ─────────────────────────────────────────────────────────
  const handleAddGasto = async (e: React.FormEvent) => {
    e.preventDefault()
    const valorNum = parseFloat(newValor.replace(/\./g, '').replace(',', '.'))
    if (!newConcepto.trim() || isNaN(valorNum) || valorNum <= 0) {
      toast.error('Ingresa concepto y valor válido')
      return
    }
    const r = await api.createRbGasto({
      concepto: newConcepto.trim(),
      categoria: newCategoria,
      cantidad: parseFloat(newCantidad) || 1,
      valor_unitario: valorNum,
      notas: newNotas || undefined,
    })
    if (r.success) {
      toast.success(`Gasto registrado — ${fmtCOP(valorNum)}`)
      setNewConcepto(''); setNewValor(''); setNewCantidad('1'); setNewNotas('')
      conceptoRef.current?.focus()
      loadAll()
    } else {
      toast.error(r.error || 'Error al registrar gasto')
    }
  }

  const handleDeleteGasto = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    const r = await api.deleteRbGasto(id)
    if (r.success) { toast.success('Gasto eliminado'); loadAll() }
    else toast.error(r.error || 'Error')
  }

  // ── QUICK-ADD INGRESO ───────────────────────────────────────────────────────
  const handleAddIngreso = async (e: React.FormEvent) => {
    e.preventDefault()
    const ventas   = parseFloat(newVentas.replace(/\./g, '').replace(',', '.')) || 0
    const ganancia = parseFloat(newGanancia.replace(/\./g, '').replace(',', '.')) || 0
    const r = await api.createRbIngreso({
      fecha: newFecha,
      num_pedidos: parseInt(newPedidos) || 0,
      valor_ventas: ventas,
      ganancia: ganancia,
    })
    if (r.success) {
      toast.success('Ingreso registrado')
      setNewPedidos(''); setNewVentas(''); setNewGanancia('')
      loadAll()
    } else {
      toast.error(r.error || 'Error')
    }
  }

  const handleDeleteIngreso = async (id: string) => {
    if (!confirm('¿Eliminar este ingreso?')) return
    const r = await api.deleteRbIngreso(id)
    if (r.success) { toast.success('Ingreso eliminado'); loadAll() }
  }

  // ── GASTOS FIJOS ────────────────────────────────────────────────────────────
  const handleAddFijo = async (e: React.FormEvent) => {
    e.preventDefault()
    const valor = parseFloat(newFijoValor.replace(/\./g, '').replace(',', '.'))
    if (!newFijoNombre.trim() || isNaN(valor) || valor <= 0) {
      toast.error('Ingresa nombre y valor')
      return
    }
    const r = await api.createRbGastoFijo({ nombre: newFijoNombre.trim(), valor, periodo: newFijoPeriodo })
    if (r.success) {
      toast.success('Gasto fijo creado')
      setNewFijoNombre(''); setNewFijoValor('')
      loadAll()
    } else toast.error(r.error || 'Error')
  }

  const handleDeleteFijo = async (id: string) => {
    if (!confirm('¿Eliminar este gasto fijo?')) return
    const r = await api.deleteRbGastoFijo(id)
    if (r.success) { toast.success('Eliminado'); loadAll() }
  }

  const handleToggleFijo = async (fijo: any) => {
    const r = await api.updateRbGastoFijo(fijo.id, {
      nombre: fijo.nombre, valor: fijo.valor, periodo: fijo.periodo,
      is_active: !fijo.is_active,
    })
    if (r.success) loadAll()
  }

  // ── COLORES POR TIPO ────────────────────────────────────────────────────────
  const typeColor = (type: string) =>
    type === 'ingreso' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : type === 'gasto' ? 'text-red-400 bg-red-500/10 border-red-500/30'
    : 'text-blue-400 bg-blue-500/10 border-blue-500/30'

  const gananciaColor = (v: number) => v >= 0 ? 'text-emerald-400' : 'text-red-400'

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* ── Header + mes ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wallet className="h-5 w-5 text-violet-400" />
            Control Financiero Gastrobar
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">Registra gastos, ingresos y calcula tu ganancia real</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month" value={month}
            onChange={e => setMonth(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white"
          />
          <Button variant="ghost" size="icon" onClick={loadAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── KPI Cards rápidas ── */}
      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Gastos', value: resumen.global?.total_gastos ?? 0, icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'Total Ventas', value: resumen.global?.total_ventas ?? 0, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Gastos Fijos', value: resumen.global?.total_gastos_fijos ?? 0, icon: Settings, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Ganancia Neta', value: resumen.global?.ganancia_neta ?? 0, icon: BarChart3, color: resumen.global?.ganancia_neta >= 0 ? 'text-emerald-400' : 'text-red-400', bg: resumen.global?.ganancia_neta >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20' },
          ].map(card => (
            <div key={card.label} className={`rounded-xl border p-3 ${card.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <card.icon className={`h-4 w-4 ${card.color}`} />
                <span className="text-xs text-zinc-400">{card.label}</span>
              </div>
              <p className={`text-lg font-bold ${card.color}`}>{fmtCOP(card.value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Sub-tabs ── */}
      <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 overflow-x-auto">
        {([
          { id: 'timeline', label: 'Línea de Tiempo', icon: Clock },
          { id: 'gastos',   label: 'Gastos',          icon: TrendingDown },
          { id: 'ingresos', label: 'Ingresos',         icon: TrendingUp },
          { id: 'fijos',    label: 'Gastos Fijos',     icon: Settings },
          { id: 'resumen',  label: 'Resumen',          icon: BarChart3 },
        ] as { id: SubTab; label: string; icon: any }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              subTab === t.id
                ? 'bg-violet-600 text-white shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ TIMELINE ══════════════════════════════════════════════════════════ */}
      {subTab === 'timeline' && (
        <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
          {timeline.length === 0 ? (
            <p className="text-center text-zinc-500 py-8 text-sm">Sin registros para este mes</p>
          ) : timeline.map((item: any) => (
            <div key={item.id}
              className={`flex items-start gap-3 p-3 rounded-xl border ${typeColor(item.type)}`}>
              <div className="mt-0.5">
                {item.type === 'ingreso'
                  ? <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
                  : <ArrowDownCircle className="h-4 w-4 text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm text-white truncate">{item.titulo}</span>
                  <span className={`text-sm font-bold shrink-0 ${item.type === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {item.type === 'ingreso' ? '+' : '-'}{fmtCOP(Math.abs(Number(item.valor)))}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-500">{fmtDate(item.fecha)}</span>
                  {item.categoria && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-700/60 text-zinc-300">
                      {item.categoria}
                    </span>
                  )}
                </div>
                {item.notas && <p className="text-xs text-zinc-400 mt-0.5 italic">{item.notas}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ GASTOS ════════════════════════════════════════════════════════════ */}
      {subTab === 'gastos' && (
        <div className="space-y-4">
          {/* Quick-add inline */}
          <form onSubmit={handleAddGasto} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Registrar gasto rápido
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              <input
                ref={conceptoRef}
                value={newConcepto}
                onChange={e => setNewConcepto(e.target.value)}
                placeholder="Concepto (ej: Carne de res)"
                className="col-span-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <input
                type="text" inputMode="numeric"
                value={newValor}
                onChange={e => setNewValor(e.target.value)}
                placeholder="Valor ($)"
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <input
                type="number" min="0.01" step="0.01"
                value={newCantidad}
                onChange={e => setNewCantidad(e.target.value)}
                placeholder="Cant."
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <select
                value={newCategoria}
                onChange={e => setNewCategoria(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
              >
                {CATEGORIAS_GASTO.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                value={newNotas}
                onChange={e => setNewNotas(e.target.value)}
                placeholder="Notas (opcional)"
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <Button type="submit" className="bg-red-600 hover:bg-red-500 text-white gap-1.5">
                <Plus className="h-4 w-4" /> Registrar
              </Button>
            </div>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
              <Clock className="h-3 w-3" /> La fecha y hora se capturan automáticamente
            </p>
          </form>

          {/* Total */}
          <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
            <span className="text-sm text-zinc-300">Total gastos del mes</span>
            <span className="text-lg font-bold text-red-400">
              {fmtCOP(gastos.reduce((s, g) => s + Number(g.total), 0))}
            </span>
          </div>

          {/* Lista gastos */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {gastos.length === 0 ? (
              <p className="text-center text-zinc-500 py-6 text-sm">Sin gastos registrados</p>
            ) : gastos.map((g: any) => (
              <div key={g.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 hover:border-zinc-700 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{g.concepto}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 shrink-0">{g.categoria}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-zinc-500">{fmtDate(g.registered_at)}</span>
                    {Number(g.cantidad) !== 1 && (
                      <span className="text-xs text-zinc-400">{g.cantidad} × {fmtCOP(Number(g.valor_unitario))}</span>
                    )}
                  </div>
                  {g.notas && <p className="text-xs text-zinc-500 italic mt-0.5">{g.notas}</p>}
                </div>
                <span className="text-sm font-bold text-red-400 shrink-0">{fmtCOP(Number(g.total))}</span>
                <button
                  onClick={() => handleDeleteGasto(g.id)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ INGRESOS ══════════════════════════════════════════════════════════ */}
      {subTab === 'ingresos' && (
        <div className="space-y-4">
          <form onSubmit={handleAddIngreso} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Registrar ingresos del día
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                type="date" value={newFecha}
                onChange={e => setNewFecha(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
              />
              <input
                type="number" min="0" value={newPedidos}
                onChange={e => setNewPedidos(e.target.value)}
                placeholder="# Pedidos"
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <input
                type="text" inputMode="numeric" value={newVentas}
                onChange={e => setNewVentas(e.target.value)}
                placeholder="Valor ventas ($)"
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <input
                type="text" inputMode="numeric" value={newGanancia}
                onChange={e => setNewGanancia(e.target.value)}
                placeholder="Ganancia ($)"
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 mt-2">
              <Plus className="h-4 w-4" /> Guardar ingresos del día
            </Button>
          </form>

          {/* Tabla ingresos */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-2.5 text-xs text-zinc-400 font-medium">Fecha</th>
                  <th className="text-right px-4 py-2.5 text-xs text-zinc-400 font-medium"># Pedidos</th>
                  <th className="text-right px-4 py-2.5 text-xs text-zinc-400 font-medium">Ventas</th>
                  <th className="text-right px-4 py-2.5 text-xs text-zinc-400 font-medium">Ganancia</th>
                  <th className="px-4 py-2.5 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {ingresos.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-6 text-zinc-500">Sin ingresos registrados</td></tr>
                ) : ingresos.map((ing: any) => (
                  <tr key={ing.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-4 py-2.5 text-white">{fmtDateOnly(ing.fecha + 'T12:00:00')}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-300">{ing.num_pedidos}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-emerald-400">{fmtCOP(Number(ing.valor_ventas))}</td>
                    <td className={`px-4 py-2.5 text-right font-bold ${gananciaColor(Number(ing.ganancia))}`}>
                      {fmtCOP(Number(ing.ganancia))}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => handleDeleteIngreso(ing.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {ingresos.length > 0 && (
                <tfoot>
                  <tr className="border-t border-zinc-700 bg-zinc-800/40">
                    <td className="px-4 py-2.5 text-xs font-semibold text-zinc-400">TOTAL</td>
                    <td className="px-4 py-2.5 text-right text-xs text-zinc-300">
                      {ingresos.reduce((s: number, i: any) => s + Number(i.num_pedidos), 0)} pedidos
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-400">
                      {fmtCOP(ingresos.reduce((s: number, i: any) => s + Number(i.valor_ventas), 0))}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-bold ${gananciaColor(ingresos.reduce((s: number, i: any) => s + Number(i.ganancia), 0))}`}>
                      {fmtCOP(ingresos.reduce((s: number, i: any) => s + Number(i.ganancia), 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ══ GASTOS FIJOS ══════════════════════════════════════════════════════ */}
      {subTab === 'fijos' && (
        <div className="space-y-4">
          <form onSubmit={handleAddFijo} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
              Agregar gasto fijo (nómina, servicios…)
            </p>
            <div className="flex gap-2">
              <input
                value={newFijoNombre}
                onChange={e => setNewFijoNombre(e.target.value)}
                placeholder="Nombre (ej: Cocineros)"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <input
                type="text" inputMode="numeric"
                value={newFijoValor}
                onChange={e => setNewFijoValor(e.target.value)}
                placeholder="Valor ($)"
                className="w-36 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <select
                value={newFijoPeriodo}
                onChange={e => setNewFijoPeriodo(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
              >
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
                <option value="semanal">Semanal</option>
              </select>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white gap-1.5">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </form>

          <div className="space-y-2">
            {fijos.length === 0 ? (
              <p className="text-center text-zinc-500 py-6 text-sm">Sin gastos fijos configurados</p>
            ) : fijos.map((f: any) => (
              <div key={f.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${f.is_active ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/40 border-zinc-800/40 opacity-60'}`}>
                <div className="flex-1">
                  <span className={`text-sm font-medium ${f.is_active ? 'text-white' : 'text-zinc-500 line-through'}`}>{f.nombre}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-zinc-500 capitalize">{f.periodo}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-amber-400">{fmtCOP(Number(f.valor))}</span>
                <button onClick={() => handleToggleFijo(f)} className="text-zinc-500 hover:text-white transition-colors">
                  {f.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => handleDeleteFijo(f.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {fijos.filter((f: any) => f.is_active).length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-zinc-300">Total gastos fijos activos / mes</span>
              <span className="font-bold text-amber-400">
                {fmtCOP(fijos.filter((f: any) => f.is_active).reduce((s: number, f: any) => {
                  if (f.periodo === 'quincenal') return s + Number(f.valor) * 2
                  if (f.periodo === 'semanal')   return s + Number(f.valor) * 4
                  return s + Number(f.valor)
                }, 0))}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ══ RESUMEN QUINCENAL ══════════════════════════════════════════════════ */}
      {subTab === 'resumen' && resumen && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['quincena1', 'quincena2'] as const).map((qk, qi) => {
              const q = resumen[qk]
              if (!q) return null
              return (
                <div key={qk} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-400" />
                    Quincena {qi + 1} — {month} (días {qi === 0 ? '1–15' : '16–31'})
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Gastos variables', value: q.gastos_variables, color: 'text-red-400' },
                      { label: 'Gastos fijos',     value: q.gastos_fijos,    color: 'text-amber-400' },
                      { label: 'Ventas',            value: q.ventas,          color: 'text-emerald-400' },
                      { label: 'Ganancia neta',     value: q.ganancia_neta,   color: q.ganancia_neta >= 0 ? 'text-emerald-400' : 'text-red-400', bold: true },
                    ].map(row => (
                      <div key={row.label} className={`flex items-center justify-between ${row.bold ? 'border-t border-zinc-700 pt-2 mt-2' : ''}`}>
                        <span className="text-xs text-zinc-400">{row.label}</span>
                        <span className={`text-sm ${row.bold ? 'font-bold text-base' : 'font-medium'} ${row.color}`}>
                          {fmtCOP(row.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Global */}
          <div className="bg-zinc-900 rounded-xl border border-violet-500/30 p-4">
            <h3 className="text-sm font-bold text-violet-300 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Resumen Global del Mes — {month}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Gastos', value: resumen.global?.total_gastos, color: 'text-red-400' },
                { label: 'Total Ventas', value: resumen.global?.total_ventas, color: 'text-emerald-400' },
                { label: 'Gastos Fijos', value: resumen.global?.total_gastos_fijos, color: 'text-amber-400' },
                { label: 'Ganancia Neta', value: resumen.global?.ganancia_neta, color: resumen.global?.ganancia_neta >= 0 ? 'text-emerald-400' : 'text-red-400' },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className="text-xs text-zinc-400 mb-1">{item.label}</p>
                  <p className={`text-lg font-black ${item.color}`}>{fmtCOP(item.value ?? 0)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gastos fijos detalle */}
          {resumen.gastos_fijos?.length > 0 && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Gastos Fijos Activos</h4>
              <div className="space-y-1">
                {resumen.gastos_fijos.filter((f: any) => f.is_active !== 0).map((f: any) => (
                  <div key={f.nombre} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">{f.nombre}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 capitalize">{f.periodo}</span>
                      <span className="text-sm font-medium text-amber-400">{fmtCOP(Number(f.valor))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

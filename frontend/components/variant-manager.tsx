'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { ProductVariant, VariantPriceTier } from '@/lib/types'
import { formatCOP } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Plus, Trash2, Edit2, Package, Tag, TrendingUp, Upload, ChevronDown, ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  productId: string
  productName: string
  open: boolean
  onClose: () => void
}

const EMPTY_VARIANT = { sku: '', color: '', size: '', material: '', stock: 0, minStock: 0, costPrice: '', priceOverride: '' }
const EMPTY_TIER    = { minQty: 1, price: '', tenantMarginPct: 0 }

export function VariantManager({ productId, productName, open, onClose }: Props) {
  const [variants, setVariants]           = useState<ProductVariant[]>([])
  const [loading, setLoading]             = useState(false)
  const [expandedId, setExpandedId]       = useState<string | null>(null)

  // Forms
  const [showAddVariant, setShowAddVariant]   = useState(false)
  const [editingVariant, setEditingVariant]   = useState<ProductVariant | null>(null)
  const [variantForm, setVariantForm]         = useState(EMPTY_VARIANT)
  const [savingVariant, setSavingVariant]     = useState(false)

  const [showAddTier, setShowAddTier]         = useState<string | null>(null) // variantId
  const [tierForm, setTierForm]               = useState(EMPTY_TIER)
  const [savingTier, setSavingTier]           = useState(false)

  // Stock adjustment
  const [stockVariant, setStockVariant]       = useState<ProductVariant | null>(null)
  const [stockForm, setStockForm]             = useState({ quantity: 0, type: 'entrada', reason: '' })
  const [savingStock, setSavingStock]         = useState(false)

  // CSV import
  const [showImport, setShowImport]           = useState(false)
  const [csvText, setCsvText]                 = useState('')
  const [importing, setImporting]             = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getVariantsByProduct(productId)
      setVariants(Array.isArray(data) ? data : (data as any)?.data ?? [])
    } catch { toast.error('Error cargando variantes') }
    finally { setLoading(false) }
  }, [productId])

  useEffect(() => { if (open) load() }, [open, load])

  // ── Variant CRUD ────────────────────────────────────────────────────────────

  const openAdd = () => { setVariantForm(EMPTY_VARIANT); setEditingVariant(null); setShowAddVariant(true) }
  const openEdit = (v: ProductVariant) => {
    setVariantForm({
      sku: v.sku, color: v.color || '', size: v.size || '',
      material: v.material || '', stock: v.stock,
      minStock: v.minStock, costPrice: v.costPrice?.toString() || '',
      priceOverride: v.priceOverride?.toString() || '',
    })
    setEditingVariant(v)
    setShowAddVariant(true)
  }

  const saveVariant = async () => {
    if (!variantForm.sku.trim()) return toast.error('SKU requerido')
    setSavingVariant(true)
    try {
      const payload = {
        sku: variantForm.sku.trim(),
        color: variantForm.color || undefined,
        size: variantForm.size || undefined,
        material: variantForm.material || undefined,
        stock: Number(variantForm.stock),
        minStock: Number(variantForm.minStock),
        costPrice: variantForm.costPrice ? Number(variantForm.costPrice) : undefined,
        priceOverride: variantForm.priceOverride ? Number(variantForm.priceOverride) : undefined,
      }
      if (editingVariant) {
        await api.updateVariant(editingVariant.id, payload)
        toast.success('Variante actualizada')
      } else {
        await api.createVariant(productId, payload)
        toast.success('Variante creada')
      }
      setShowAddVariant(false)
      load()
    } catch (e: any) { toast.error(e?.message || 'Error guardando variante') }
    finally { setSavingVariant(false) }
  }

  const deleteVariant = async (id: string) => {
    if (!confirm('¿Eliminar variante?')) return
    try {
      await api.deleteVariant(id)
      toast.success('Variante eliminada')
      load()
    } catch { toast.error('Error eliminando variante') }
  }

  // ── Price Tiers ─────────────────────────────────────────────────────────────

  const saveTier = async () => {
    if (!showAddTier) return
    if (!tierForm.price) return toast.error('Precio requerido')
    setSavingTier(true)
    try {
      await api.createVariantTier(showAddTier, {
        minQty: Number(tierForm.minQty),
        price: Number(tierForm.price),
        tenantMarginPct: Number(tierForm.tenantMarginPct),
      })
      toast.success('Tier creado')
      setShowAddTier(null)
      setTierForm(EMPTY_TIER)
      load()
    } catch (e: any) { toast.error(e?.message || 'Error creando tier') }
    finally { setSavingTier(false) }
  }

  const deleteTier = async (tierId: string) => {
    if (!confirm('¿Eliminar tier?')) return
    try {
      await api.deleteVariantTier(tierId)
      toast.success('Tier eliminado')
      load()
    } catch { toast.error('Error eliminando tier') }
  }

  // ── Stock Adjustment ────────────────────────────────────────────────────────

  const saveStock = async () => {
    if (!stockVariant) return
    if (!stockForm.reason.trim()) return toast.error('Motivo requerido')
    setSavingStock(true)
    try {
      await api.adjustVariantStock(stockVariant.id, {
        quantity: Number(stockForm.quantity),
        type: stockForm.type,
        reason: stockForm.reason,
      })
      toast.success('Stock ajustado')
      setStockVariant(null)
      setStockForm({ quantity: 0, type: 'entrada', reason: '' })
      load()
    } catch (e: any) { toast.error(e?.message || 'Error ajustando stock') }
    finally { setSavingStock(false) }
  }

  // ── CSV Import ──────────────────────────────────────────────────────────────

  const importCsv = async () => {
    if (!csvText.trim()) return toast.error('CSV vacío')
    setImporting(true)
    try {
      const result = await api.importVariantsCsv(csvText)
      const r = result?.data ?? result
      toast.success(`Importado: ${r.variantsCreated} variantes, ${r.productsCreated} productos nuevos`)
      if (r.errors?.length) toast.warning(`${r.variantsFailed} errores`)
      setShowImport(false)
      setCsvText('')
      load()
    } catch (e: any) { toast.error(e?.message || 'Error importando CSV') }
    finally { setImporting(false) }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={open} onOpenChange={v => !v && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Variantes — {productName}
            </DialogTitle>
          </DialogHeader>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" /> Nueva variante
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="w-4 h-4 mr-1" /> Importar CSV
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <a href={api.getVariantImportTemplateUrl()} download>Descargar plantilla</a>
            </Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Cargando variantes…</p>
          ) : variants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No hay variantes. Crea la primera.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {variants.map(v => (
                <div key={v.id} className="border rounded-lg overflow-hidden">
                  {/* Header row */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                  >
                    <div className="flex-1 flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-sm">{v.label || v.sku}</span>
                      <Badge variant="outline" className="text-xs">{v.sku}</Badge>
                      <Badge
                        variant={v.stock === 0 ? 'destructive' : v.stock <= v.minStock ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        Stock: {v.stock}
                      </Badge>
                      {v.costPrice && (
                        <span className="text-xs text-muted-foreground">Costo: {formatCOP(v.costPrice)}</span>
                      )}
                      {v.priceTiers && v.priceTiers.length > 0 && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Tag className="w-3 h-3" /> {v.priceTiers.length} tiers
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setStockVariant(v); setStockForm({ quantity: 0, type: 'entrada', reason: '' }) }}>
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); openEdit(v) }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={e => { e.stopPropagation(); deleteVariant(v.id) }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {expandedId === v.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded: price tiers */}
                  {expandedId === v.id && (
                    <div className="border-t px-4 py-3 bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Precios escalonados (tiers)</p>
                        <Button size="sm" variant="outline" onClick={() => { setShowAddTier(v.id); setTierForm(EMPTY_TIER) }}>
                          <Plus className="w-3 h-3 mr-1" /> Agregar tier
                        </Button>
                      </div>
                      {(!v.priceTiers || v.priceTiers.length === 0) ? (
                        <p className="text-xs text-muted-foreground">Sin tiers — se usa el precio base del producto.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Desde (uds.)</TableHead>
                              <TableHead className="text-xs">Precio</TableHead>
                              <TableHead className="text-xs">Margen plataforma</TableHead>
                              <TableHead className="text-xs">Precio proveedor</TableHead>
                              <TableHead />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {v.priceTiers.map((t, idx) => {
                              const nextMin = v.priceTiers![idx + 1]?.minQty
                              const rangeLabel = nextMin
                                ? `${t.minQty} – ${nextMin - 1} uds.`
                                : `${t.minQty}+ uds.`
                              const providerPrice = v.costPrice
                                ? t.price * (1 - t.tenantMarginPct / 100)
                                : null
                              return (
                                <TableRow key={t.id}>
                                  <TableCell className="text-xs">{rangeLabel}</TableCell>
                                  <TableCell className="text-xs font-medium">{formatCOP(t.price)}</TableCell>
                                  <TableCell className="text-xs">{t.tenantMarginPct}%</TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {providerPrice ? formatCOP(providerPrice) : '—'}
                                  </TableCell>
                                  <TableCell>
                                    <Button size="sm" variant="ghost" className="text-destructive h-6 w-6 p-0"
                                      onClick={() => deleteTier(t.id)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Variant Dialog ── */}
      <Dialog open={showAddVariant} onOpenChange={v => !v && setShowAddVariant(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVariant ? 'Editar variante' : 'Nueva variante'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">SKU *</Label>
                <Input placeholder="SE-SISO-BLK" value={variantForm.sku}
                  onChange={e => setVariantForm(p => ({ ...p, sku: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Color</Label>
                <Input placeholder="Negro" value={variantForm.color}
                  onChange={e => setVariantForm(p => ({ ...p, color: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Talla</Label>
                <Input placeholder="M" value={variantForm.size}
                  onChange={e => setVariantForm(p => ({ ...p, size: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Material</Label>
                <Input placeholder="Algodón" value={variantForm.material}
                  onChange={e => setVariantForm(p => ({ ...p, material: e.target.value }))} />
              </div>
              {!editingVariant && (
                <div>
                  <Label className="text-xs">Stock inicial</Label>
                  <Input type="number" min={0} value={variantForm.stock}
                    onChange={e => setVariantForm(p => ({ ...p, stock: Number(e.target.value) }))} />
                </div>
              )}
              <div>
                <Label className="text-xs">Stock mínimo</Label>
                <Input type="number" min={0} value={variantForm.minStock}
                  onChange={e => setVariantForm(p => ({ ...p, minStock: Number(e.target.value) }))} />
              </div>
              <div>
                <Label className="text-xs">Costo (proveedor)</Label>
                <Input type="number" min={0} placeholder="0" value={variantForm.costPrice}
                  onChange={e => setVariantForm(p => ({ ...p, costPrice: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Precio override</Label>
                <Input type="number" min={0} placeholder="Usa precio base si vacío" value={variantForm.priceOverride}
                  onChange={e => setVariantForm(p => ({ ...p, priceOverride: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVariant(false)}>Cancelar</Button>
            <Button onClick={saveVariant} disabled={savingVariant}>
              {savingVariant ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Tier Dialog ── */}
      <Dialog open={!!showAddTier} onOpenChange={v => !v && setShowAddTier(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo precio escalonado</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Cantidad mínima (uds.)</Label>
              <Input type="number" min={1} value={tierForm.minQty}
                onChange={e => setTierForm(p => ({ ...p, minQty: Number(e.target.value) }))} />
              <p className="text-xs text-muted-foreground mt-1">
                Aplica desde esta cantidad en adelante hasta el siguiente tier.
              </p>
            </div>
            <div>
              <Label className="text-xs">Precio unitario *</Label>
              <Input type="number" min={0} placeholder="45000" value={tierForm.price}
                onChange={e => setTierForm(p => ({ ...p, price: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Margen plataforma (%)</Label>
              <Input type="number" min={0} max={100} value={tierForm.tenantMarginPct}
                onChange={e => setTierForm(p => ({ ...p, tenantMarginPct: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTier(null)}>Cancelar</Button>
            <Button onClick={saveTier} disabled={savingTier}>
              {savingTier ? 'Guardando…' : 'Crear tier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Stock Adjustment Dialog ── */}
      <Dialog open={!!stockVariant} onOpenChange={v => !v && setStockVariant(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajustar stock — {stockVariant?.label || stockVariant?.sku}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={stockForm.type}
                onValueChange={v => setStockForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="salida">Salida</SelectItem>
                  <SelectItem value="ajuste">Ajuste (cantidad exacta)</SelectItem>
                  <SelectItem value="merma">Merma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Cantidad</Label>
              <Input type="number" min={0} value={stockForm.quantity}
                onChange={e => setStockForm(p => ({ ...p, quantity: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs">Motivo *</Label>
              <Input placeholder="Ej: Recepción pedido proveedor" value={stockForm.reason}
                onChange={e => setStockForm(p => ({ ...p, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockVariant(null)}>Cancelar</Button>
            <Button onClick={saveStock} disabled={savingStock}>
              {savingStock ? 'Guardando…' : 'Ajustar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CSV Import Dialog ── */}
      <Dialog open={showImport} onOpenChange={v => !v && setShowImport(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar variantes desde CSV</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Columnas requeridas: <code>Handle, Product Name, Variant SKU</code>. Opcionales: Color, Size, Variant Stock, Base Price, Cost Price, Supplier.
          </p>
          <textarea
            className="w-full h-48 text-xs font-mono border rounded p-2 resize-none"
            placeholder="Handle,Product Name,Attribute: Color,Attribute: Size,Variant SKU,Variant Stock,Base Price,Cost Price&#10;body-siso,Body Siso Premium,Negro,Única,SE-BLK,15,45000,30000"
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" asChild>
              <a href={api.getVariantImportTemplateUrl()} download>Descargar plantilla</a>
            </Button>
            <Button variant="outline" onClick={() => setShowImport(false)}>Cancelar</Button>
            <Button onClick={importCsv} disabled={importing}>
              {importing ? 'Importando…' : 'Importar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

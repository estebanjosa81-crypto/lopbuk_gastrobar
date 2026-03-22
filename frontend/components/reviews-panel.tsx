'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { CloudinaryUpload } from '@/components/ui/cloudinary-upload'
import {
  Star, StarOff, Trash2, CheckCircle, XCircle, Clock, MessageSquare,
  Pencil, Search, Filter, ChevronDown, ChevronUp,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
}
const STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  aprobado:  'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800',
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={18}
            className={n <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditReviewModal({
  review,
  onClose,
  onSaved,
}: {
  review: any
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    reviewerName: review.reviewerName ?? '',
    reviewerEmail: review.reviewerEmail ?? '',
    rating: review.rating ?? 5,
    title: review.title ?? '',
    body: review.body ?? '',
    imageUrl1: review.imageUrl1 ?? '',
    imageUrl2: review.imageUrl2 ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string) => (v: any) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave() {
    setSaving(true)
    setError('')
    const res = await api.updateReview(review.id, {
      reviewerName: form.reviewerName,
      reviewerEmail: form.reviewerEmail || undefined,
      rating: form.rating,
      title: form.title || undefined,
      body: form.body || undefined,
      imageUrl1: form.imageUrl1 || null,
      imageUrl2: form.imageUrl2 || null,
    })
    setSaving(false)
    if (res.success) { onSaved(); onClose() }
    else setError(res.error || 'Error al guardar')
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar reseña</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Nombre del reseñador</label>
            <Input value={form.reviewerName} onChange={e => set('reviewerName')(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Email (opcional)</label>
            <Input value={form.reviewerEmail} onChange={e => set('reviewerEmail')(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Calificación</label>
            <StarRating value={form.rating} onChange={set('rating')} />
          </div>
          <div>
            <label className="text-sm font-medium">Título (opcional)</label>
            <Input value={form.title} onChange={e => set('title')(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Cuerpo</label>
            <Textarea value={form.body} onChange={e => set('body')(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Imagen 1</label>
              <CloudinaryUpload value={form.imageUrl1} onChange={set('imageUrl1')} label="Subir imagen 1" />
            </div>
            <div>
              <label className="text-sm font-medium">Imagen 2</label>
              <CloudinaryUpload value={form.imageUrl2} onChange={set('imageUrl2')} label="Subir imagen 2" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  onRefresh,
}: {
  review: any
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [replyText, setReplyText] = useState(review.reply ?? '')
  const [showReply, setShowReply] = useState(false)
  const [saving, setSaving] = useState(false)

  async function changeStatus(status: 'aprobado' | 'rechazado' | 'pendiente') {
    setSaving(true)
    await api.updateReviewStatus(review.id, status)
    setSaving(false)
    onRefresh()
  }

  async function saveReply() {
    setSaving(true)
    await api.updateReviewStatus(review.id, review.status, replyText)
    setSaving(false)
    setShowReply(false)
    onRefresh()
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta reseña?')) return
    await api.deleteReview(review.id)
    onRefresh()
  }

  return (
    <>
      {editing && (
        <EditReviewModal review={review} onClose={() => setEditing(false)} onSaved={onRefresh} />
      )}
      <Card className="border border-gray-200">
        <CardContent className="p-4 space-y-2">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-sm">{review.reviewerName}</span>
              {review.reviewerEmail && (
                <span className="text-xs text-gray-500">{review.reviewerEmail}</span>
              )}
              <span className="text-xs text-gray-400">
                {review.productName} · {new Date(review.createdAt).toLocaleDateString('es-CO')}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StarRating value={review.rating} />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[review.status]}`}>
                {STATUS_LABELS[review.status]}
              </span>
            </div>
          </div>

          {/* Content */}
          {review.title && <p className="font-medium text-sm">{review.title}</p>}
          {review.body && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {expanded || review.body.length <= 140
                ? review.body
                : review.body.slice(0, 140) + '…'}
              {review.body.length > 140 && (
                <button
                  className="text-blue-500 text-xs ml-1"
                  onClick={() => setExpanded(p => !p)}
                >
                  {expanded ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </p>
          )}

          {/* Images */}
          {(review.imageUrl1 || review.imageUrl2) && (
            <div className="flex gap-2">
              {review.imageUrl1 && (
                <img src={review.imageUrl1} alt="img1" className="w-20 h-20 object-cover rounded border" />
              )}
              {review.imageUrl2 && (
                <img src={review.imageUrl2} alt="img2" className="w-20 h-20 object-cover rounded border" />
              )}
            </div>
          )}

          {/* Merchant reply */}
          {review.reply && (
            <div className="bg-blue-50 border border-blue-100 rounded p-2 text-sm text-blue-800">
              <span className="font-medium">Tu respuesta: </span>{review.reply}
            </div>
          )}

          {showReply && (
            <div className="space-y-1">
              <Textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Escribe tu respuesta…"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveReply} disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar respuesta'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowReply(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap pt-1">
            {review.status !== 'aprobado' && (
              <Button size="sm" variant="outline" className="text-green-600 border-green-300"
                onClick={() => changeStatus('aprobado')} disabled={saving}>
                <CheckCircle size={14} className="mr-1" /> Aprobar
              </Button>
            )}
            {review.status !== 'rechazado' && (
              <Button size="sm" variant="outline" className="text-red-500 border-red-300"
                onClick={() => changeStatus('rechazado')} disabled={saving}>
                <XCircle size={14} className="mr-1" /> Rechazar
              </Button>
            )}
            {review.status !== 'pendiente' && (
              <Button size="sm" variant="outline" className="text-yellow-600 border-yellow-300"
                onClick={() => changeStatus('pendiente')} disabled={saving}>
                <Clock size={14} className="mr-1" /> Pendiente
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => { setShowReply(p => !p); setReplyText(review.reply ?? '') }}>
              <MessageSquare size={14} className="mr-1" /> Responder
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil size={14} className="mr-1" /> Editar
            </Button>
            <Button size="sm" variant="outline" className="text-red-500 border-red-300" onClick={handleDelete}>
              <Trash2 size={14} className="mr-1" /> Eliminar
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function ReviewsPanel() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterProduct, setFilterProduct] = useState('all')
  const [products, setProducts] = useState<any[]>([])

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    const params: any = {}
    if (filterStatus !== 'todos') params.status = filterStatus
    if (filterProduct !== 'all') params.productId = filterProduct
    const res = await api.getReviews(params)
    if (res.success && res.data) setReviews(res.data)
    setLoading(false)
  }, [filterStatus, filterProduct])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    api.getProducts({ limit: 500 }).then(res => {
      if (res.success && res.data) {
        const list = (res.data as any).products ?? res.data
        setProducts(Array.isArray(list) ? list : [])
      }
    })
  }, [])

  const counts = {
    total: reviews.length,
    pendiente: reviews.filter(r => r.status === 'pendiente').length,
    aprobado: reviews.filter(r => r.status === 'aprobado').length,
    rechazado: reviews.filter(r => r.status === 'rechazado').length,
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: counts.total, color: 'bg-blue-50 text-blue-800' },
          { label: 'Pendientes', value: counts.pendiente, color: 'bg-yellow-50 text-yellow-800' },
          { label: 'Aprobadas', value: counts.aprobado, color: 'bg-green-50 text-green-800' },
          { label: 'Rechazadas', value: counts.rechazado, color: 'bg-red-50 text-red-800' },
        ].map(s => (
          <div key={s.label} className={`rounded-lg p-3 text-center ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="aprobado">Aprobado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterProduct} onValueChange={setFilterProduct}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filtrar por producto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los productos</SelectItem>
            {products.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-gray-500 text-sm">Cargando reseñas…</p>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Star size={40} className="mx-auto mb-2 opacity-30" />
          <p>No hay reseñas{filterStatus !== 'todos' ? ` con estado "${STATUS_LABELS[filterStatus]}"` : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <ReviewCard key={r.id} review={r} onRefresh={fetchReviews} />
          ))}
        </div>
      )}
    </div>
  )
}

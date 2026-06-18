'use client'

/**
 * ConfirmDialog — diálogo de confirmación reutilizable.
 * Soporta el patrón "escribe el nombre exacto" (estilo GitHub) para
 * acciones destructivas, y una zona de impacto opcional.
 */
import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle } from 'lucide-react'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  /** Texto del botón de confirmación. */
  confirmLabel?: string
  /** Si es destructivo, pinta el botón en rojo. */
  destructive?: boolean
  /** Si se pasa, exige escribir EXACTAMENTE este texto para habilitar el botón. */
  requireText?: string
  /** Bloque de impacto opcional ("Se eliminarán X productos…"). */
  impact?: React.ReactNode
  loading?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = 'Confirmar',
  destructive = false, requireText, impact, loading = false, onConfirm,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('')
  useEffect(() => { if (!open) setTyped('') }, [open])

  const ready = !requireText || typed.trim() === requireText.trim()

  return (
    <Dialog open={open} onOpenChange={v => !loading && onOpenChange(v)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {destructive && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {impact && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-foreground/80">
            {impact}
          </div>
        )}

        {requireText && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              Escribe <span className="font-mono font-semibold text-foreground">{requireText}</span> para confirmar:
            </p>
            <Input value={typed} onChange={e => setTyped(e.target.value)} autoFocus placeholder={requireText} className="font-mono" />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={!ready || loading}
          >
            {loading ? 'Procesando…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

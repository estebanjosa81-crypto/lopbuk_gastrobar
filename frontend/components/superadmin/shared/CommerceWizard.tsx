'use client'

import { useState } from 'react'
import { X, ChevronRight, ChevronLeft, Store, CreditCard, User, CheckCircle2, Eye, EyeOff, RefreshCw, Check } from 'lucide-react'
import type { WizardData } from '../hooks/useTenantLifecycle'

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Comercio',    icon: Store },
  { label: 'Plan',        icon: CreditCard },
  { label: 'Propietario', icon: User },
  { label: 'Confirmar',   icon: CheckCircle2 },
]

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((s, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        const Icon = s.icon
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                done   ? 'bg-primary text-primary-foreground' :
                active ? 'bg-primary/10 border-2 border-primary text-primary' :
                         'bg-muted text-muted-foreground border border-border'
              }`}>
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-[10px] whitespace-nowrap ${active ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-4 transition-colors ${done ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Plan cards ────────────────────────────────────────────────────────────────

const PLANS: { id: 'basico' | 'profesional' | 'empresarial'; label: string; desc: string; users: number; products: number }[] = [
  { id: 'basico',       label: 'Básico',       desc: 'POS + Inventario',                    users: 3,    products: 200   },
  { id: 'profesional',  label: 'Profesional',  desc: 'Básico + Tienda online',              users: 10,   products: 1000  },
  { id: 'empresarial',  label: 'Empresarial',  desc: 'Todo + RestBar + Finanzas',           users: 30,   products: 5000  },
]

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function Input({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      {...props}
      className={`w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${
        error ? 'border-red-400' : 'border-input'
      } ${props.className ?? ''}`}
    />
  )
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function Step1({
  data, errors, onChange,
  businessTypes,
}: {
  data: WizardData
  errors: Partial<Record<keyof WizardData, string>>
  onChange: (p: Partial<WizardData>) => void
  businessTypes: string[]
}) {
  return (
    <div className="space-y-4">
      <Field label="Nombre del comercio" error={errors.name}>
        <Input
          value={data.name}
          error={errors.name}
          onChange={e => {
            const name = e.target.value
            const slug = name.toLowerCase()
              .normalize('NFD').replace(/[̀-ͯ]/g, '')
              .replace(/[^a-z0-9\s-]/g, '').trim()
              .replace(/\s+/g, '-').replace(/-+/g, '-')
            onChange({ name, slug })
          }}
          placeholder="Ej: Restaurante El Buen Sabor"
          autoFocus
        />
      </Field>

      <Field label="Slug (URL única)" error={errors.slug}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">
            lopbuk.app/
          </span>
          <Input
            value={data.slug}
            error={errors.slug}
            onChange={e => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            placeholder="mi-comercio"
            className="pl-[76px]"
          />
        </div>
        <p className="text-xs text-muted-foreground">Solo letras minúsculas, números y guiones.</p>
      </Field>

      <Field label="Tipo de negocio (opcional)">
        <select
          value={data.businessType}
          onChange={e => onChange({ businessType: e.target.value })}
          className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Sin categoría</option>
          {businessTypes.map(bt => <option key={bt} value={bt}>{bt}</option>)}
        </select>
      </Field>
    </div>
  )
}

function Step2({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLANS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange({ plan: p.id, maxUsers: p.users, maxProducts: p.products })}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              data.plan === p.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
            }`}
          >
            <div className="font-semibold text-sm">{p.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
            <div className="text-xs text-muted-foreground mt-2">
              {p.users} usuarios · {p.products.toLocaleString()} productos
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Máx. usuarios">
          <Input
            type="number"
            min={1}
            max={9999}
            value={data.maxUsers}
            onChange={e => onChange({ maxUsers: parseInt(e.target.value) || 1 })}
          />
        </Field>
        <Field label="Máx. productos">
          <Input
            type="number"
            min={1}
            max={99999}
            value={data.maxProducts}
            onChange={e => onChange({ maxProducts: parseInt(e.target.value) || 1 })}
          />
        </Field>
      </div>
    </div>
  )
}

function Step3({
  data, errors, onChange,
}: {
  data: WizardData
  errors: Partial<Record<keyof WizardData, string>>
  onChange: (p: Partial<WizardData>) => void
}) {
  const [showPwd, setShowPwd] = useState(false)
  return (
    <div className="space-y-4">
      <Field label="Nombre del propietario" error={errors.ownerName}>
        <Input
          value={data.ownerName}
          error={errors.ownerName}
          onChange={e => onChange({ ownerName: e.target.value })}
          placeholder="Juan García"
        />
      </Field>

      <Field label="Email del propietario" error={errors.ownerEmail}>
        <Input
          type="email"
          value={data.ownerEmail}
          error={errors.ownerEmail}
          onChange={e => onChange({ ownerEmail: e.target.value })}
          placeholder="juan@micomercio.com"
        />
      </Field>

      <Field label="Contraseña inicial" error={errors.ownerPassword}>
        <div className="relative">
          <Input
            type={showPwd ? 'text' : 'password'}
            value={data.ownerPassword}
            error={errors.ownerPassword}
            onChange={e => onChange({ ownerPassword: e.target.value })}
            placeholder="Mínimo 6 caracteres"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      <Field label="Confirmar contraseña" error={errors.ownerPasswordConfirm}>
        <Input
          type={showPwd ? 'text' : 'password'}
          value={data.ownerPasswordConfirm}
          error={errors.ownerPasswordConfirm}
          onChange={e => onChange({ ownerPasswordConfirm: e.target.value })}
          placeholder="Repite la contraseña"
        />
      </Field>
    </div>
  )
}

function Step4({ data }: { data: WizardData }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Revisa los datos antes de crear el comercio. Una vez creado, el propietario podrá iniciar sesión inmediatamente.
      </p>
      <div className="rounded-xl border border-border bg-muted/30 divide-y divide-border text-sm">
        {[
          { label: 'Nombre', value: data.name },
          { label: 'Slug', value: `lopbuk.app/${data.slug}` },
          { label: 'Tipo', value: data.businessType || '—' },
          { label: 'Plan', value: data.plan.charAt(0).toUpperCase() + data.plan.slice(1) },
          { label: 'Máx. usuarios', value: String(data.maxUsers) },
          { label: 'Máx. productos', value: String(data.maxProducts) },
          { label: 'Propietario', value: data.ownerName },
          { label: 'Email', value: data.ownerEmail },
          { label: 'Contraseña', value: '●●●●●●' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between px-4 py-2.5">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right break-all">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Wizard modal ──────────────────────────────────────────────────────────────

export function CommerceWizard({
  step, data, errors, isSubmitting, businessTypes,
  onChange, onNext, onBack, onSubmit, onClose,
}: {
  step: number
  data: WizardData
  errors: Partial<Record<keyof WizardData, string>>
  isSubmitting: boolean
  businessTypes: string[]
  onChange: (p: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
  onSubmit: () => void
  onClose: () => void
}) {
  const isLast = step === 4

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-background rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-lg">Crear comercio</h2>
            <p className="text-xs text-muted-foreground">Paso {step} de 4</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <StepBar current={step} />
          {step === 1 && <Step1 data={data} errors={errors} onChange={onChange} businessTypes={businessTypes} />}
          {step === 2 && <Step2 data={data} onChange={onChange} />}
          {step === 3 && <Step3 data={data} errors={errors} onChange={onChange} />}
          {step === 4 && <Step4 data={data} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <button
            onClick={onBack}
            disabled={step === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-input text-sm hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Atrás
          </button>
          {isLast ? (
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              {isSubmitting ? 'Creando…' : 'Crear comercio'}
            </button>
          ) : (
            <button
              onClick={onNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Info,
  Code2,
  BarChart3,
  Package,
  ShoppingCart,
  CreditCard,
  Users,
  Github,
  Linkedin,
  Mail,
  Star,
  Calculator,
  ScanLine,
  Upload,
  LayoutDashboard,
  Crown,
} from 'lucide-react'

const tech = ['Next.js', 'React 19', 'TypeScript', 'Node.js', 'Express', 'MySQL', 'Tailwind', 'Socket.IO']

const modules = [
  { icon: LayoutDashboard, name: 'Dashboard' },
  { icon: ShoppingCart, name: 'Punto de Venta' },
  { icon: Package, name: 'Inventario' },
  { icon: CreditCard, name: 'Fiados' },
  { icon: Calculator, name: 'Caja' },
  { icon: BarChart3, name: 'Analítica' },
  { icon: ScanLine, name: 'Escáner' },
  { icon: Users, name: 'Multi-usuario' },
  { icon: Upload, name: 'CSV Import' },
]

export function AboutModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
          <Info className="h-4 w-4" />
          Acerca de
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 bg-transparent shadow-none [&>button]:text-white/60 [&>button]:hover:text-white [&>button]:z-50">
        <div className="relative group">
          {/* Subtle border glow */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-emerald-500/40 via-emerald-500/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Card body */}
          <div className="relative rounded-2xl bg-[#0b1120] overflow-hidden">
            {/* Single subtle gradient accent */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.06)_0%,_transparent_50%)] pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />

            {/* ——— HEADER ——— */}
            <div className="px-7 pt-7 pb-5">
              <DialogHeader>
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/image/lopbukicon.png" alt="Lopbuk" width={48} height={48} className="rounded-xl ring-1 ring-white/10" />
                  <div>
                    <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                      Lopbuk
                    </DialogTitle>
                    <DialogDescription className="text-white/40 text-xs font-medium">
                      Inventory Management — v2.0
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <p className="text-white/35 text-[13px] leading-relaxed mt-4">
                Gestión de inventario, ventas, fiados, caja y analítica en una sola plataforma.
              </p>

              {/* New features + support info */}
              <p className="text-white/40 text-[13px] leading-relaxed mt-3">
                <strong>Nuevas funcionalidades:</strong> Punto de Venta mejorado, Escáner remoto, Multi‑usuario con roles, Importación CSV, y reportes analíticos. Estas mejoras están activas y en constante evolución.
              </p>
              <p className="text-white/40 text-[12px] leading-relaxed mt-2">
                <strong>Desarrollo y soporte:</strong> Esta plataforma es desarrollada y mantenida por <strong>Jhon Esteban Josa Q.</strong> y su equipo. Ofrecemos desarrollo a medida y soporte técnico.
                <br />Contacto: <a href="mailto:estebanjosa81@gmail.com" className="underline">estebanjosa81@gmail.com</a>
              </p>
            </div>

            <div className="mx-7 h-px bg-white/[0.06]" />

            {/* ——— MODULES ——— */}
            <div className="px-7 py-5">
              <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">9 Módulos</p>
              <div className="grid grid-cols-3 gap-1.5">
                {modules.map((mod) => (
                  <div key={mod.name} className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                    <mod.icon className="w-3.5 h-3.5 text-white/25 shrink-0" />
                    <span className="text-[11px] text-white/50 truncate">{mod.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-7 h-px bg-white/[0.06]" />

            {/* ——— DEVELOPER — EPIC BUILDER ——— */}
            <div className="px-7 py-5">
              <div className="relative rounded-xl overflow-hidden">
                {/* Animated gradient border */}
                <div
                  className="absolute -inset-px rounded-xl"
                  style={{
                    background: 'conic-gradient(from var(--angle, 0deg), #10b981, #0d9488, #06b6d4, #8b5cf6, #f59e0b, #10b981)',
                    animation: 'epicSpin 4s linear infinite',
                  }}
                />
                {/* Inner bg */}
                <div className="relative rounded-xl bg-[#0b1120] m-px">
                  {/* Subtle scanline effect */}
                  <div
                    className="absolute inset-0 rounded-xl pointer-events-none opacity-[0.03]"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)',
                    }}
                  />
                  {/* Moving code rain line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-full pointer-events-none overflow-hidden rounded-xl"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-emerald-400/[0.07] to-transparent"
                      style={{ animation: 'scanDown 3s ease-in-out infinite' }}
                    />
                  </div>

                  <div className="relative flex items-center gap-4 p-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-amber-400/70 to-amber-600/70" style={{ animation: 'epicSpin 8s linear infinite' }} />
                      <div className="absolute -inset-[2px] rounded-full bg-[#0b1120]" />
                      <div className="relative w-14 h-14 rounded-full overflow-hidden ring-1 ring-amber-400/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/image/jhonjosa.png" alt="Developer" className="w-full h-full object-cover object-top" />
                      </div>
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2">
                        <Crown className="w-3 h-3 text-amber-400" />
                      </div>
                    </div>
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">Jhon Esteban Josa Q.</h4>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-2 h-2 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-emerald-400/70 text-[11px] font-medium flex items-center gap-1.5">
                        Full Stack Developer
                        <span className="inline-flex items-center gap-1 text-[9px] text-amber-400/80 bg-amber-400/[0.08] border border-amber-400/15 rounded px-1.5 py-px font-bold uppercase tracking-wider">
                          <Code2 className="w-2.5 h-2.5" />
                          Building
                        </span>
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <a href="https://github.com/estebanIoI" target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white/60 transition-colors">
                          <Github className="w-3.5 h-3.5" />
                        </a>
                        <a href="#" className="text-white/20 hover:text-white/60 transition-colors">
                          <Linkedin className="w-3.5 h-3.5" />
                        </a>
                        <a href="mailto:estebanjosa81@gmail.com" className="text-white/20 hover:text-white/60 transition-colors">
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    {/* Terminal-style status */}
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[9px] font-mono text-emerald-400/50 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        online
                      </span>
                      <span className="text-[9px] font-mono text-white/20">2024–2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Keyframes for epic effects */}
            <style jsx>{`
              @keyframes epicSpin {
                from { --angle: 0deg; }
                to { --angle: 360deg; }
              }
              @keyframes scanDown {
                0%, 100% { transform: translateY(-100%); }
                50% { transform: translateY(400%); }
              }
              @property --angle {
                syntax: '<angle>';
                initial-value: 0deg;
                inherits: false;
              }
            `}</style>

            <div className="mx-7 h-px bg-white/[0.06]" />

            {/* ——— TECH ——— */}
            <div className="px-7 py-5">
              <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-3">Stack</p>
              <div className="flex flex-wrap gap-1.5">
                {tech.map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-md text-[11px] font-medium text-white/40 bg-white/[0.04] border border-white/[0.06]">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* ——— FOOTER ——— */}
            <div className="px-7 py-3.5 border-t border-white/[0.06]">
              <p className="text-center text-[10px] text-white/20">
                <span className="font-medium text-white/30">DAIMUZ</span> · © 2026 Lopbuk
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

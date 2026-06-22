'use client'

/**
 * ActiveProgramBanner — Active Program Layer (T3): cuando el usuario contrató un
 * coach, el OS muestra su programa activo (semana N/total). Es el inicio de que el
 * coaching "vive dentro del sistema" (la entrega/feed completos llegan en T4–T6).
 */
import { Flame, ChevronRight } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const ASSET = API_URL.replace(/\/api$/, '')
const abs = (u?: string | null) => (!u ? '' : u.startsWith('http') ? u : `${ASSET}${u}`)

export default function ActiveProgramBanner({ program, onOpen }: { program: any; onOpen?: () => void }) {
  if (!program) return null
  return (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-2xl p-4 text-white shadow-lg flex items-center gap-3"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0c4a6e 100%)' }}
    >
      <div className="w-12 h-12 rounded-xl bg-white/10 overflow-hidden shrink-0">
        {program.trainerPhoto ? <img src={abs(program.trainerPhoto)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Flame className="w-6 h-6 text-sky-300" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-sky-300 font-bold">🔥 Programa activo</p>
        <p className="font-bold truncate">{program.title}</p>
        <p className="text-xs text-white/60">
          Coach {program.trainerName}{program.totalWeeks ? ` · Semana ${program.week}/${program.totalWeeks}` : ` · Semana ${program.week}`}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-white/50 shrink-0" />
    </button>
  )
}

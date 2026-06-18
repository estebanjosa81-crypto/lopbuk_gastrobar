'use client'

/**
 * CommunityTab — SuperAdmin: gestiona la Comunidad Daimuz.
 * Crear usuarios comunidad_admin, listar admins y ver métricas globales.
 */
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { UserPlus, Loader2, Users, FileText, Heart, MessageSquare, ExternalLink } from 'lucide-react'
import { communityApi } from '@/components/community/api'

export function CommunityTab() {
  const [admins, setAdmins] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [a, s] = await Promise.all([communityApi.listAdmins(), communityApi.superStats()])
      setAdmins(a); setStats(s)
    } catch (e: any) { toast.error(e.message || 'Error al cargar') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const crear = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('Completa todos los campos'); return }
    setCreating(true)
    try {
      await communityApi.createAdmin(form)
      toast.success('Admin de comunidad creado')
      setForm({ name: '', email: '', password: '' })
      load()
    } catch (e: any) { toast.error(e.message || 'No se pudo crear') }
    finally { setCreating(false) }
  }

  const metrics = [
    { label: 'Posts publicados', value: stats?.published, icon: FileText },
    { label: 'Reacciones', value: stats?.reactions, icon: Heart },
    { label: 'Comentarios', value: stats?.comments, icon: MessageSquare },
    { label: 'Admins', value: stats?.admins, icon: Users },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold">Comunidad Daimuz</h3>
          <p className="text-sm text-muted-foreground">Crea administradores de comunidad y revisa métricas globales.</p>
        </div>
        <a href="/comunidad" target="_blank" className="text-sm text-primary inline-flex items-center gap-1.5">Ver feed <ExternalLink className="h-3.5 w-3.5" /></a>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map(m => {
          const Icon = m.icon
          return (
            <div key={m.label} className="rounded-xl border bg-card p-4">
              <Icon className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{loading ? '—' : (m.value ?? 0)}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          )
        })}
      </div>

      {/* Crear admin */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h4 className="font-semibold flex items-center gap-2"><UserPlus className="h-4 w-4" /> Nuevo admin de comunidad</h4>
        <div className="grid sm:grid-cols-3 gap-2">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre" className="border rounded-lg px-3 py-2 text-sm bg-background" />
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" className="border rounded-lg px-3 py-2 text-sm bg-background" />
          <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Contraseña" type="password" className="border rounded-lg px-3 py-2 text-sm bg-background" />
        </div>
        <button onClick={crear} disabled={creating} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Crear admin
        </button>
      </div>

      {/* Lista de admins */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b"><h4 className="font-semibold">Admins de comunidad</h4></div>
        {loading ? <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> :
          admins.length === 0 ? <p className="p-6 text-sm text-muted-foreground">Aún no hay admins de comunidad.</p> :
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left"><tr><th className="p-3">Nombre</th><th className="p-3">Email</th><th className="p-3">Posts</th><th className="p-3">Estado</th></tr></thead>
            <tbody>
              {admins.map(a => (
                <tr key={a.id} className="border-t">
                  <td className="p-3 font-medium">{a.name}</td>
                  <td className="p-3 text-muted-foreground">{a.email}</td>
                  <td className="p-3">{a.posts}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${a.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{a.isActive ? 'Activo' : 'Inactivo'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>}
      </div>
    </div>
  )
}

export default CommunityTab

'use client'

// Landing maestra del CURSO + APLICATIVO Chat Daimuz.
// Base oficial: C:\daimuzdev\daimuz (base de la empresa + landing + imágenes).
import { Starfield } from '@/components/portfolio/starfield'
import { RobotAssistant } from '@/components/portfolio/robot-assistant'

const LOGIN_URL = 'https://daimuz.alexsters.works/login'
const HOTMART_URL = 'https://go.hotmart.com/TU-CODIGO-AQUI'
const WHATSAPP = 'https://wa.me/573000000000'
const A = '#6366f1'

const ALIADO = [
  { icon: '⚡', t: 'Atiende sin demora', d: 'Responde al instante a cada cliente, a cualquier hora.' },
  { icon: '🛍️', t: 'Recomienda y cierra', d: 'Identifica la necesidad, sugiere la mejor opción y guía al pago.' },
  { icon: '⏰', t: 'Ahorra tiempo', d: 'Deja de responder lo mismo todo el día. El agente lo hace por ti.' },
  { icon: '📈', t: 'Mejora resultados', d: 'Más conversaciones convertidas, menos ventas perdidas.' },
]

const KPIS = [
  { l: 'Ventas del agente', v: '$48.750', d: '+32.8%' },
  { l: 'Clientes', v: '326', d: '+28.4%' },
  { l: 'Conversión', v: '18.6%', d: '+4.2%' },
  { l: 'Recurrente', v: '$12.980', d: '+11.7%' },
]
const FUNNEL = [['Atracción', '24.350'], ['Leads', '5.650'], ['Diagnóstico', '1.950'], ['Cierre', '326'], ['Upsell', '126']]

const APP_CAPS = [
  ['🤖', 'Agentes IA', 'Crea y entrena agentes que atienden y venden.'],
  ['🗂️', 'CRM', 'Clientes, leads y seguimiento en un solo lugar.'],
  ['✅', 'Tareas', 'Pendientes y recordatorios del negocio.'],
  ['📅', 'Calendario', 'Agenda, citas y entregas organizadas.'],
  ['📊', 'Reportes en tiempo real', 'Ventas, conversión y datos al instante.'],
  ['⚙️', 'Automatizaciones', 'Flujos que trabajan solos por tu negocio.'],
  ['💳', 'Cobra rápido', 'Enlaces de pago y checkout sin fricción.'],
  ['📦', 'Productos digitales', 'Vende cursos, membresías y servicios.'],
  ['💬', 'Mensajes multicanal', 'WhatsApp, web y redes desde un panel.'],
]

const MODES = [
  { tag: '🛠️ Modo Operativo', t: 'Tú manejas los módulos', d: 'Control total: usas POS, inventario, tienda y más, según tu necesidad. Incluido.' },
  { tag: '🤖 Modo ControlChat', t: 'La IA opera tu negocio', d: 'Le escribes y publica productos, lanza ofertas, configura y activa módulos por ti. Plan alto.', hot: true },
]

const LOGROS = [
  ['⚡', 'Automatizar ventas', 'Un agente que atiende, califica y vende 24/7.'],
  ['💬', 'Responder leads', 'Resuelve dudas al instante y genera confianza.'],
  ['📈', 'Convertir por chat', 'Guiones, diagnóstico, urgencia y cierres asistidos.'],
  ['👑', 'Vender planes', 'Presenta membresías y suscripciones con claridad.'],
  ['🧠', 'Mejorar con datos', 'Cada conversación mejora tus objeciones y ofertas.'],
]

const COMBO = [
  ['Fundamentos y oferta', 'El modelo y tu propuesta de valor.'],
  ['Constructor del agente', 'Crea tu agente IA desde cero.'],
  ['Conocimiento propio', 'Entrénalo con tus productos y FAQ.'],
  ['Operación del negocio', 'CRM, pedidos y seguimiento por chat.'],
  ['Embudos para Hotmart', 'El embudo perfecto para vender.'],
  ['Cierres asistidos', 'Scripts de cierre por WhatsApp y DM.'],
  ['Membresías y planes', 'Cómo presentar y vender lo recurrente.'],
  ['Orgánico y publicidad', 'Contenido y anuncios que atraen comercios.'],
]
const BONOS = ['Plantilla HTML lista para vender', 'Biblioteca de prompts', 'Scripts de cierre', 'Guiones de contenido (30 días)', 'Embudo perfecto', 'Dashboard de métricas']

const SECTORES = [
  ['🍔', 'Restaurantes', 'Recibe pedidos, responde menú y agenda entregas sin saturarte.'],
  ['👕', 'Tiendas de ropa', 'Recomienda tallas, muestra catálogo y cierra por chat.'],
  ['🔧', 'Ferreterías', 'Responde disponibilidad y precios al instante.'],
  ['🛒', 'Supermercados', 'Toma pedidos y organiza domicilios.'],
  ['💼', 'Servicios', 'Agenda citas, cotiza y hace seguimiento.'],
  ['📲', 'Digitales', 'Vende cursos y membresías con embudos.'],
]

const EMBUDO = ['Contenido orgánico', 'DM / WhatsApp', 'El agente diagnostica', 'Oferta del curso', 'Compra (Hotmart)', 'Activa tu plan', 'Seguimiento y renovación']

const PLANES = [
  { name: 'Básico', who: 'Atención automática inicial', specs: ['Agente IA de atención', 'FAQ y respuestas', 'Comercio conectado'] },
  { name: 'Pro', who: 'Vender y dar seguimiento', specs: ['Todo lo del Básico', 'CRM + seguimiento de leads', 'Cierres asistidos'], hot: true },
  { name: 'Premium', who: 'Embudos y automatización', specs: ['Todo lo del Pro', 'Embudos + reportes', 'Automatizaciones + soporte'] },
]

const FAQ = [
  ['¿Necesito saber de tecnología?', 'No. El curso es paso a paso y el aplicativo te guía. Si no quieres configurarlo tú, hay configuración asistida.'],
  ['¿El curso y la suscripción son lo mismo?', 'No. El curso enseña el método; la suscripción mantiene tu agente activo y conectado a tu comercio.'],
  ['¿Para qué negocio sirve?', 'Restaurantes, tiendas, ferreterías, servicios y emprendimientos digitales.'],
  ['¿Cómo accedo al aplicativo?', 'Con tu plan activo entras por “Acceder” y operas tu comercio (o dejas que el agente lo opere por ti).'],
]

function S({ id, eb, title, sub, children }: { id?: string; eb: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="relative z-10 max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: A }}>{eb}</p>
        <h2 className="text-3xl sm:text-4xl font-bold">{title}</h2>
        {sub && <p className="text-sm text-gray-400 mt-3 max-w-2xl mx-auto">{sub}</p>}
      </div>
      {children}
    </section>
  )
}

export default function CursoChatDaimuz() {
  return (
    <div className="min-h-screen text-white relative" style={{ background: '#06060d' }}>
      <Starfield color={A} />

      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-md" style={{ background: 'rgba(6,6,13,.6)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="flex items-center gap-2 font-black tracking-tight"><span className="w-2.5 h-2.5 rounded-full" style={{ background: A }} /> DAIMUZ</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="#aplicativo" className="hidden md:inline text-sm opacity-70 hover:opacity-100">Aplicativo</a>
            <a href="#planes" className="hidden sm:inline text-sm opacity-70 hover:opacity-100">Planes</a>
            <a href="#faq" className="hidden sm:inline text-sm opacity-70 hover:opacity-100">FAQ</a>
            <a href={LOGIN_URL} className="px-4 py-2 rounded-full text-sm font-semibold border border-white/15 hover:bg-white/10">Acceder</a>
            <a href={HOTMART_URL} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: A, color: '#fff' }}>Inscribirme</a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="inicio" className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-10 grid lg:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest border" style={{ borderColor: `${A}55`, color: A, background: `${A}15` }}>⚡ Todo en uno · IA · Ventas · Automatización</span>
          <h1 className="text-4xl sm:text-6xl font-black leading-tight">Chat Daimuz:<br /><span style={{ color: A }}>construye tu agente y vende más.</span></h1>
          <p className="text-lg text-gray-300 max-w-xl">Tu negocio no duerme; tu WhatsApp sí te cansa. Aprende a crear y entrenar tu <strong>agente de IA</strong> para atender, vender y controlar tu comercio — y mantenlo activo con el aplicativo.</p>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm text-gray-300 w-full max-w-xl">
            {['Constructor de agente IA desde cero', 'Embudo perfecto para Hotmart', 'Cierres por WhatsApp y DM', 'Aplicativo + curso + plantillas'].map(p => (
              <li key={p} className="flex items-center gap-2"><span style={{ color: A }}>✓</span> {p}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            <a href={HOTMART_URL} target="_blank" rel="noopener noreferrer" className="px-7 py-3.5 rounded-full text-sm font-semibold transition-transform hover:scale-105" style={{ background: A, color: '#fff', boxShadow: `0 6px 26px ${A}66` }}>🚀 Quiero inscribirme</a>
            <a href={LOGIN_URL} className="px-7 py-3.5 rounded-full text-sm font-semibold border border-white/15 bg-white/5 hover:bg-white/10 transition">Acceder al aplicativo →</a>
          </div>
          <p className="text-xs text-gray-500">Acceso inmediato · Pago seguro · Sin experiencia técnica avanzada</p>
        </div>
        <div className="relative z-10 w-full"><RobotAssistant accent={A} robotHeight={300} /></div>
      </section>

      {/* MÁS QUE UN CHATBOT */}
      <S eb="Más que un chatbot" title="Un aliado para tu negocio" sub="Un asistente que conoce tu negocio mejor que nadie y trabaja por ti.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ALIADO.map(c => (
            <div key={c.t} className="rounded-2xl p-5 border border-white/10 bg-white/[0.03]">
              <div className="text-2xl mb-2">{c.icon}</div>
              <h3 className="font-bold mb-1">{c.t}</h3>
              <p className="text-sm text-gray-400">{c.d}</p>
            </div>
          ))}
        </div>
      </S>

      {/* EL APLICATIVO */}
      <S id="aplicativo" eb="El aplicativo" title="Tu panel de control inteligente" sub="Así se ve tu negocio operando con Chat Daimuz (datos ilustrativos).">
        <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-6 items-stretch">
          {/* Mockup dashboard */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold"><span>🤖 Chat Daimuz</span><span className="ml-auto text-xs text-gray-500">Resumen general</span></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {KPIS.map(k => (
                <div key={k.l} className="rounded-xl bg-white/[0.04] p-3">
                  <p className="text-[11px] text-gray-400">{k.l}</p>
                  <p className="text-lg font-extrabold">{k.v}</p>
                  <p className="text-[11px] font-semibold" style={{ color: '#34d399' }}>{k.d}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-2">Embudo de ventas</p>
            <div className="space-y-1.5">
              {FUNNEL.map(([l, v], i) => (
                <div key={l} className="rounded-md text-xs font-medium px-3 py-1.5 flex justify-between" style={{ background: `${A}${['33','2b','22','1a','12'][i]}`, marginLeft: `${i * 8}%`, marginRight: `${i * 4}%` }}>
                  <span>{l}</span><span className="opacity-80">{v}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Capacidades */}
          <div className="grid sm:grid-cols-2 gap-3">
            {APP_CAPS.map(([ic, t, d]) => (
              <div key={t} className="rounded-xl p-4 border border-white/10 bg-white/[0.03]">
                <div className="text-xl mb-1">{ic}</div>
                <h3 className="font-bold text-sm">{t}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </S>

      {/* DOS MODOS */}
      <S eb="Dos formas de operar" title="Tú decides cuánto delegar">
        <div className="grid md:grid-cols-2 gap-5">
          {MODES.map(m => (
            <div key={m.t} className="rounded-2xl p-6 border" style={{ borderColor: m.hot ? `${A}66` : 'rgba(255,255,255,.1)', background: m.hot ? `${A}12` : 'rgba(255,255,255,.03)' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: m.hot ? A : '#cbd5e1' }}>{m.tag}</p>
              <h3 className="text-xl font-bold mb-2">{m.t}</h3>
              <p className="text-sm text-gray-400">{m.d}</p>
            </div>
          ))}
        </div>
      </S>

      {/* ¿QUÉ VAS A LOGRAR? */}
      <S id="beneficios" eb="¿Qué vas a lograr?" title="Un sistema comercial que vende por ti">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LOGROS.map(([ic, t, d]) => (
            <div key={t} className="rounded-2xl p-5 border border-white/10 bg-white/[0.03]"><div className="text-2xl mb-2">{ic}</div><h3 className="font-bold mb-1">{t}</h3><p className="text-sm text-gray-400">{d}</p></div>
          ))}
        </div>
      </S>

      {/* SECTORES */}
      <S eb="Casos de uso" title="Funciona en tu sector">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTORES.map(([ic, t, d]) => (
            <div key={t} className="rounded-xl p-4 border border-white/10 bg-white/[0.03] flex gap-3"><div className="text-2xl">{ic}</div><div><h3 className="font-bold text-sm">{t}</h3><p className="text-xs text-gray-400">{d}</p></div></div>
          ))}
        </div>
      </S>

      {/* COMBO + BONOS */}
      <S eb="Lo que incluye" title="El combo completo del curso">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {COMBO.map(([t, d], i) => (
            <div key={t} className="rounded-xl p-4 border border-white/10 bg-white/[0.03]"><p className="text-xs font-bold mb-1" style={{ color: A }}>{String(i + 1).padStart(2, '0')}</p><h3 className="font-bold text-sm mb-1">{t}</h3><p className="text-xs text-gray-400">{d}</p></div>
          ))}
        </div>
        <div className="rounded-2xl border border-white/10 p-5" style={{ background: `${A}0e` }}>
          <p className="text-sm font-semibold mb-3">🎁 Bonos incluidos</p>
          <div className="flex flex-wrap gap-2">{BONOS.map(b => <span key={b} className="text-xs px-3 py-1.5 rounded-full bg-white/[0.06]">{b}</span>)}</div>
        </div>
      </S>

      {/* EMBUDO */}
      <S id="embudo" eb="El embudo perfecto" title="De contenido a suscripción">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {EMBUDO.map((step, i) => (
            <span key={step} className="flex items-center gap-2"><span className="px-4 py-2 rounded-full text-sm font-medium border border-white/10 bg-white/[0.04]">{step}</span>{i < EMBUDO.length - 1 && <span style={{ color: A }}>→</span>}</span>
          ))}
        </div>
      </S>

      {/* COMPARACIÓN */}
      <S eb="La diferencia" title="Con sistema vs sin sistema">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl p-6 border border-white/10 bg-white/[0.02]">
            <h3 className="font-bold mb-3 text-gray-300">😓 Sin método</h3>
            <ul className="space-y-2 text-sm text-gray-400">{['Respondes tarde y pierdes clientes', 'Dependes de estar disponible', 'Tienes productos pero no seguimiento', 'Vendes por intuición'].map(x => <li key={x} className="flex gap-2"><span className="text-red-400">✕</span> {x}</li>)}</ul>
          </div>
          <div className="rounded-2xl p-6 border" style={{ borderColor: `${A}66`, background: `${A}12` }}>
            <h3 className="font-bold mb-3">🚀 Con Chat Daimuz</h3>
            <ul className="space-y-2 text-sm text-gray-200">{['Atiendes 24/7 sin saturarte', 'El agente vende mientras descansas', 'CRM, seguimiento y recordatorios', 'Vendes con embudo y datos'].map(x => <li key={x} className="flex gap-2"><span style={{ color: A }}>✓</span> {x}</li>)}</ul>
          </div>
        </div>
      </S>

      {/* PLANES */}
      <S id="planes" eb="Membresía y planes" title="Activa tu comercio con Chat Daimuz" sub="El curso te enseña el método. La suscripción mantiene tu agente activo trabajando para tu negocio.">
        <div className="grid md:grid-cols-3 gap-5">
          {PLANES.map(p => (
            <div key={p.name} className="rounded-2xl p-6 border flex flex-col" style={{ borderColor: p.hot ? `${A}66` : 'rgba(255,255,255,.1)', background: p.hot ? `${A}12` : 'rgba(255,255,255,.03)' }}>
              {p.hot && <span className="self-start text-[10px] font-bold px-2 py-0.5 rounded-full mb-2" style={{ background: A, color: '#fff' }}>MÁS POPULAR</span>}
              <p className="font-bold text-lg">{p.name}</p>
              <p className="text-xs text-gray-400 mb-4">{p.who}</p>
              <ul className="space-y-2 text-sm text-gray-300 flex-1">{p.specs.map(sp => <li key={sp} className="flex items-start gap-2"><span style={{ color: A }}>✓</span> {sp}</li>)}</ul>
              <a href={LOGIN_URL} className="mt-5 text-center px-5 py-2.5 rounded-full text-sm font-semibold" style={{ background: p.hot ? A : 'rgba(255,255,255,.08)', color: '#fff' }}>Activar plan</a>
            </div>
          ))}
        </div>
      </S>

      {/* FAQ */}
      <S id="faq" eb="Preguntas frecuentes" title="Resolvemos tus dudas">
        <div className="max-w-3xl mx-auto space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><summary className="font-semibold cursor-pointer text-sm">{q}</summary><p className="text-sm text-gray-400 mt-2 leading-relaxed">{a}</p></details>
          ))}
        </div>
      </S>

      {/* CTA FINAL */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-5xl font-black mb-4">Empieza hoy a vender<br />con tu agente IA</h2>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">Inscríbete al curso, monta tu agente y activa tu comercio en Chat Daimuz.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a href={HOTMART_URL} target="_blank" rel="noopener noreferrer" className="px-8 py-3.5 rounded-full font-semibold transition-transform hover:scale-105" style={{ background: A, color: '#fff', boxShadow: `0 6px 30px ${A}66` }}>🚀 Inscribirme al curso</a>
          <a href={LOGIN_URL} className="px-8 py-3.5 rounded-full font-semibold border border-white/15 bg-white/5 hover:bg-white/10 transition">Acceder al aplicativo</a>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="px-8 py-3.5 rounded-full font-semibold border border-white/10 hover:bg-white/5 transition">Hablar con ventas</a>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-sm text-gray-500">DAIMUZ · Chat Daimuz Academy — crea tu agente IA y convierte tu comercio en un sistema de ventas</footer>
    </div>
  )
}

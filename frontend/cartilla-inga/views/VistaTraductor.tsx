import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowLeftRight, BookOpen, X, Loader2 } from 'lucide-react';
import { traductorAPI, type ResultadoTraductorAPI } from '../services/api';

const CATEGORIA_COLOR: Record<string, string> = {
  saludo:       'bg-emerald-100 text-emerald-700',
  cuerpo:       'bg-blue-100 text-blue-700',
  familia:      'bg-purple-100 text-purple-700',
  animal:       'bg-amber-100 text-amber-700',
  naturaleza:   'bg-green-100 text-green-700',
  numero:       'bg-indigo-100 text-indigo-700',
  color:        'bg-pink-100 text-pink-700',
  tiempo:       'bg-sky-100 text-sky-700',
  alimento:     'bg-orange-100 text-orange-700',
};

function catBadge(cat: string) {
  return CATEGORIA_COLOR[cat?.toLowerCase()] ?? 'bg-slate-100 text-slate-500';
}

function ResaltarCoincidencia({ texto, busqueda }: { texto: string; busqueda: string }) {
  if (!busqueda) return <>{texto}</>;
  const idx = texto.toLowerCase().indexOf(busqueda.toLowerCase());
  if (idx === -1) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, idx)}
      <mark className="bg-amber-200 text-amber-900 rounded px-0.5">{texto.slice(idx, idx + busqueda.length)}</mark>
      {texto.slice(idx + busqueda.length)}
    </>
  );
}

export const VistaTraductor: React.FC = () => {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<ResultadoTraductorAPI[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState('');
  const [sinResultados, setSinResultados] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResultados([]);
      setSinResultados(false);
      setBuscado('');
      return;
    }
    setBuscando(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await traductorAPI.buscar(q);
        setResultados(data.resultados);
        setSinResultados(data.resultados.length === 0);
        setBuscado(q);
      } catch {
        setSinResultados(true);
      } finally {
        setBuscando(false);
      }
    }, 350);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const limpiar = () => {
    setQuery('');
    setResultados([]);
    setSinResultados(false);
    setBuscado('');
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">

      {/* Cabecera */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
          <ArrowLeftRight className="w-3.5 h-3.5" />
          Traductor
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Español ↔ Inga</h1>
        <p className="text-slate-400 text-sm mt-1">
          Busca palabras en español o en lengua Inga del banco de vocabulario
        </p>
      </div>

      {/* Buscador */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {buscando
            ? <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
            : <Search className="w-5 h-5 text-slate-400" />}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Escribe una palabra en español o en Inga…"
          className="w-full pl-12 pr-12 py-4 bg-white border-2 border-slate-200 focus:border-emerald-500 rounded-2xl text-slate-800 text-base shadow-sm outline-none transition placeholder:text-slate-300"
        />
        {query && (
          <button
            onClick={limpiar}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 px-1">
            {resultados.length} resultado{resultados.length > 1 ? 's' : ''} para «{buscado}»
          </p>
          <div className="space-y-2">
            {resultados.map(r => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-start gap-4 hover:border-emerald-200 hover:shadow-md transition"
              >
                {/* Columna Español */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Español</p>
                  <p className={`text-base font-bold leading-snug ${r.coincide === 'espanol' ? 'text-emerald-700' : 'text-slate-800'}`}>
                    <ResaltarCoincidencia texto={r.espanol} busqueda={r.coincide === 'espanol' ? buscado : ''} />
                  </p>
                </div>

                {/* Flecha */}
                <div className="flex items-center self-center shrink-0 px-1">
                  <div className="bg-emerald-100 p-1.5 rounded-full">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>

                {/* Columna Inga */}
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Inga</p>
                  <p className={`text-base font-bold leading-snug italic ${r.coincide === 'inga' ? 'text-emerald-700' : 'text-slate-800'}`}>
                    <ResaltarCoincidencia texto={r.inga} busqueda={r.coincide === 'inga' ? buscado : ''} />
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Notas */}
          {resultados.some(r => r.notas) && (
            <div className="space-y-1.5 pt-1">
              {resultados.filter(r => r.notas).map(r => (
                <div key={`nota-${r.id}`} className="flex items-start gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
                  <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                  <span><strong>{r.inga}</strong>: {r.notas}</span>
                </div>
              ))}
            </div>
          )}

          {/* Categorías */}
          <div className="flex flex-wrap gap-1.5 px-1 pt-1">
            {[...new Set(resultados.map(r => r.categoria).filter(Boolean))].map(cat => (
              <span key={cat} className={`text-xs px-2.5 py-1 rounded-full font-medium ${catBadge(cat)}`}>
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sin resultados */}
      {sinResultados && !buscando && (
        <div className="text-center py-12 space-y-3">
          <div className="text-4xl">🔍</div>
          <p className="font-semibold text-slate-600">No encontramos «{buscado}»</p>
          <p className="text-sm text-slate-400">
            Esta palabra aún no está en el banco de vocabulario Inga.
          </p>
        </div>
      )}

      {/* Estado vacío inicial */}
      {!query && resultados.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center space-y-4">
          <div className="flex justify-center gap-4 text-3xl">
            <span>🇨🇴</span>
            <ArrowLeftRight className="w-6 h-6 text-slate-300 self-center" />
            <span>📖</span>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Traduce palabras al instante</p>
            <p className="text-sm text-slate-400 mt-1">
              Escribe en español o en Inga y el sistema buscará automáticamente en el banco de vocabulario.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-left">
            {[
              { es: 'Buenos días', inga: 'Puangi' },
              { es: 'Agua',        inga: 'Yaku'   },
              { es: 'Madre',       inga: 'Mama'   },
              { es: 'Tierra',      inga: 'Alpa'   },
            ].map(ej => (
              <button
                key={ej.es}
                onClick={() => setQuery(ej.es)}
                className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-xl text-sm transition group"
              >
                <span className="text-slate-500 group-hover:text-emerald-700 font-medium">{ej.es}</span>
                <ArrowLeftRight className="w-3 h-3 text-slate-300 group-hover:text-emerald-400 shrink-0" />
                <span className="text-slate-400 italic group-hover:text-emerald-600">{ej.inga}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from "react";
import { 
  DollarSign, 
  Check 
} from "lucide-react";

export default function Precios() {
  const [plusLeads, setPlusLeads] = useState(1000);
  const [proLeads, setProLeads] = useState(1000);

  const plusCost = Math.round((plusLeads / 1000) * 20 * 100) / 100;
  const proCost = Math.round((proLeads / 1000) * 35 * 100) / 100;

  return (
    <div id="pricing_section" className="space-y-8 pb-12 max-w-5xl mx-auto">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6 animate-fade-in">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-sans text-md font-bold text-slate-800 uppercase tracking-tight">
              Planes y Precios Flexibles
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Escala tu estrategia de prospección. Elige un plan y calcula el costo exacto según el volumen mensual de leads.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Free */}
          <div className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50/35 p-6 hover:border-slate-200 transition-all shadow-sm justify-between">
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 uppercase tracking-wide">
                  Siempre Gratis
                </span>
                <h4 className="text-xl font-bold text-slate-900 mt-2 font-sans">Plan Free</h4>
                <p className="text-xs text-slate-400 font-sans mt-1">Para arrancar sin compromisos</p>
              </div>

              <div className="flex items-baseline gap-1 py-1">
                <span className="text-3xl font-extrabold text-slate-900 font-sans">USD 0</span>
                <span className="text-xs text-slate-450 font-medium font-sans">/siempre gratis</span>
              </div>

              <div className="border-t border-slate-100/80 pt-4">
                <ul className="space-y-2.5 text-xs text-slate-650 font-sans">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Hasta <strong>6,000 envíos mensuales</strong> (límite free de Mailjet)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Carga de leads en formato <strong>XLSX o CSV</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Reenvíos programables e inteligentes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Soporte <strong>Multicampaña</strong></span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100/50 mt-6">
              <button
                type="button"
                className="w-full text-center h-10 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Contacto
              </button>
            </div>
          </div>

          {/* Plan Plus */}
          <div className="flex flex-col rounded-2xl border-2 border-indigo-100 bg-indigo-50/10 p-6 shadow-sm hover:border-indigo-250 transition-all justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-750 text-[9px] font-extrabold px-3 py-1 uppercase rounded-bl-xl tracking-wider">
              Popular
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase tracking-wide">
                  Enriquecimiento
                </span>
                <h4 className="text-xl font-bold text-slate-900 mt-2 font-sans font-sans">Plan Plus</h4>
                <p className="text-xs text-slate-400 font-sans mt-1">Para leads que no tengan email</p>
              </div>

              <div className="flex items-baseline gap-1 py-1">
                <span className="text-3xl font-extrabold text-slate-900 font-sans">USD {plusCost}</span>
                <span className="text-xs text-slate-450 font-medium font-sans">/mes</span>
              </div>

              {/* Slider Plus */}
              <div className="bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100/60 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-indigo-950 tracking-wider">
                  <span>Leads mensuales:</span>
                  <span className="text-indigo-650 font-mono text-xs bg-white px-2 py-0.5 rounded-md shadow-xs font-bold">{plusLeads}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="6000"
                  step="100"
                  value={plusLeads}
                  onChange={(e) => setPlusLeads(Number(e.target.value))}
                  className="w-full h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                />
              </div>

              <div className="border-t border-indigo-100/50 pt-4">
                <ul className="space-y-2.5 text-xs text-slate-650 font-sans">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>Todo lo del Plan Free</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Enriquecimiento de leads sin email (<strong>$20 c/1000 leads</strong>)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Búsqueda, validación y detección inteligente de rebotes</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-indigo-100/50 mt-6">
              <button
                type="button"
                className="w-full text-center h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Contacto
              </button>
            </div>
          </div>

          {/* Plan Pro */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/10 p-6 hover:border-slate-350 transition-all shadow-sm justify-between">
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white uppercase tracking-wide">
                  LinkedIn Directo
                </span>
                <h4 className="text-xl font-bold text-slate-900 mt-2 font-sans font-sans">Plan Pro</h4>
                <p className="text-xs text-slate-400 font-sans mt-1">LinkedIn Sales Navigator Integrado</p>
              </div>

              <div className="flex items-baseline gap-1 py-1">
                <span className="text-3xl font-extrabold text-slate-900 font-sans">USD {proCost}</span>
                <span className="text-xs text-slate-450 font-medium font-sans">/mes</span>
              </div>

              {/* Slider Pro */}
              <div className="bg-slate-100/60 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-800 tracking-wider">
                  <span>Leads mensuales:</span>
                  <span className="text-slate-700 font-mono text-xs bg-white px-2 py-0.5 rounded-md shadow-xs font-bold">{proLeads}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="6000"
                  step="100"
                  value={proLeads}
                  onChange={(e) => setProLeads(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800 focus:outline-none"
                />
              </div>

              <div className="border-t border-slate-150 pt-4">
                <ul className="space-y-2.5 text-xs text-slate-650 font-sans">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span><strong>Todo lo del Plan Plus</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5 text-indigo-650" />
                    <span>Sube listas directamente desde una <strong>URL de LinkedIn Sales Navigator</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>Extracción automatizada y coste de <strong>$35 cada 1000 leads</strong></span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-150 mt-6">
              <button
                type="button"
                className="w-full text-center h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Contacto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

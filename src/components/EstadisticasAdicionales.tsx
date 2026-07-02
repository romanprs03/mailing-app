/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetchAdditionalStats } from "../api";
import {
  RefreshCw,
  Loader2,
  Mail,
  MailOpen,
  MousePointerClick,
  AlertTriangle,
  Ban,
  ShieldAlert,
  UserMinus,
  Clock,
  Activity,
  Inbox,
  X,
  Search,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Building2,
  Send,
  Gauge,
  Layers,
} from "lucide-react";

interface EstadisticasAdicionalesProps {
  id_usuario: string;
}

interface StatLead {
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Helpers de números
// ---------------------------------------------------------------------------
const num = (v: any): number => {
  if (typeof v === "number") return isNaN(v) ? 0 : v;
  if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v);
  return 0;
};

// Toma el primer valor definido (incluyendo 0) de una lista de candidatos.
const pref = (...vals: any[]): number => {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== "") return num(v);
  }
  return 0;
};

// Valor de una métrica concreta para un lead, combinando el contador crudo de
// Mailjet con el campo "amigable" que también manda el backend.
const metricValue = (lead: StatLead, key: string): number => {
  switch (key) {
    case "entregados":
      return pref(lead.DeliveredCount, lead.entregados);
    case "abiertos":
      return pref(lead.OpenedCount, lead.abiertos);
    case "clics":
      return pref(lead.ClickedCount, lead.clics);
    case "rebotados": {
      const directo = pref(lead.BouncedCount, lead.rebotados);
      if (directo > 0) return directo;
      return num(lead.HardBouncedCount) + num(lead.SoftBouncedCount);
    }
    case "bloqueados":
      return num(lead.BlockedCount);
    case "spam":
      return num(lead.SpamComplaintCount);
    case "desuscritos":
      return num(lead.UnsubscribedCount);
    case "diferidos":
      return num(lead.DeferredCount);
    case "procesados":
      return pref(lead.ProcessedCount, lead.QueuedCount, lead.PreQueuedCount);
    case "encola":
      return num(lead.QueuedCount) + num(lead.PreQueuedCount);
    default:
      return 0;
  }
};

// ---------------------------------------------------------------------------
// Configuración visual de cada métrica (clases Tailwind literales para que
// Tailwind pueda detectarlas en build; nada de strings dinámicos).
// ---------------------------------------------------------------------------
type MetricColor = {
  card: string;
  iconWrap: string;
  value: string;
  label: string;
  bar: string;
  dot: string;
};

const COLORS: Record<string, MetricColor> = {
  indigo: {
    card: "border-indigo-100 hover:border-indigo-300 bg-indigo-50/30",
    iconWrap: "bg-indigo-100 text-indigo-600",
    value: "text-indigo-700",
    label: "text-indigo-700",
    bar: "bg-indigo-500",
    dot: "#6366f1",
  },
  emerald: {
    card: "border-emerald-100 hover:border-emerald-300 bg-emerald-50/30",
    iconWrap: "bg-emerald-100 text-emerald-600",
    value: "text-emerald-700",
    label: "text-emerald-700",
    bar: "bg-emerald-500",
    dot: "#10b981",
  },
  violet: {
    card: "border-violet-100 hover:border-violet-300 bg-violet-50/30",
    iconWrap: "bg-violet-100 text-violet-600",
    value: "text-violet-700",
    label: "text-violet-700",
    bar: "bg-violet-500",
    dot: "#8b5cf6",
  },
  rose: {
    card: "border-rose-100 hover:border-rose-300 bg-rose-50/30",
    iconWrap: "bg-rose-100 text-rose-600",
    value: "text-rose-700",
    label: "text-rose-700",
    bar: "bg-rose-500",
    dot: "#f43f5e",
  },
  amber: {
    card: "border-amber-100 hover:border-amber-300 bg-amber-50/30",
    iconWrap: "bg-amber-100 text-amber-600",
    value: "text-amber-700",
    label: "text-amber-700",
    bar: "bg-amber-500",
    dot: "#f59e0b",
  },
  orange: {
    card: "border-orange-100 hover:border-orange-300 bg-orange-50/30",
    iconWrap: "bg-orange-100 text-orange-600",
    value: "text-orange-700",
    label: "text-orange-700",
    bar: "bg-orange-500",
    dot: "#f97316",
  },
  sky: {
    card: "border-sky-100 hover:border-sky-300 bg-sky-50/30",
    iconWrap: "bg-sky-100 text-sky-600",
    value: "text-sky-700",
    label: "text-sky-700",
    bar: "bg-sky-500",
    dot: "#0ea5e9",
  },
  slate: {
    card: "border-slate-200 hover:border-slate-300 bg-slate-50",
    iconWrap: "bg-slate-200 text-slate-600",
    value: "text-slate-700",
    label: "text-slate-600",
    bar: "bg-slate-400",
    dot: "#94a3b8",
  },
  zinc: {
    card: "border-zinc-200 hover:border-zinc-300 bg-zinc-50",
    iconWrap: "bg-zinc-200 text-zinc-600",
    value: "text-zinc-700",
    label: "text-zinc-600",
    bar: "bg-zinc-400",
    dot: "#a1a1aa",
  },
};

interface MetricDef {
  key: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
}

const METRIC_DEFS: MetricDef[] = [
  { key: "procesados", label: "Procesados", desc: "Procesados por el motor", icon: Activity, color: "sky" },
  { key: "entregados", label: "Entregados", desc: "Correos entregados", icon: Mail, color: "indigo" },
  { key: "abiertos", label: "Abiertos", desc: "Aperturas registradas", icon: MailOpen, color: "emerald" },
  { key: "clics", label: "Clics", desc: "Clics en enlaces", icon: MousePointerClick, color: "violet" },
  { key: "rebotados", label: "Rebotados", desc: "Rebotes (hard + soft)", icon: AlertTriangle, color: "rose" },
  { key: "bloqueados", label: "Bloqueados", desc: "Bloqueados por el servidor", icon: Ban, color: "amber" },
  { key: "spam", label: "Quejas de Spam", desc: "Marcados como spam", icon: ShieldAlert, color: "orange" },
  { key: "desuscritos", label: "Desuscritos", desc: "Bajas de la lista", icon: UserMinus, color: "slate" },
  { key: "diferidos", label: "Diferidos", desc: "Envío diferido", icon: Clock, color: "sky" },
  { key: "encola", label: "En cola", desc: "Esperando envío", icon: Inbox, color: "zinc" },
];

// ---------------------------------------------------------------------------
// Helpers de lead
// ---------------------------------------------------------------------------
const getCompany = (lead: StatLead): string =>
  lead.empresa || lead.nombre_negocio || lead.nombre || lead.email_lead || "Lead sin nombre";

const getCampaignName = (lead: StatLead): string =>
  lead.campaign_name || lead.nombre_campana || "Sin campaña";

const getLeadId = (lead: StatLead, idx: number): string =>
  String(lead.id_lead || lead.id || lead.ContactID || lead.email_lead || idx);

const formatDate = (dateStr?: string): string => {
  if (!dateStr || dateStr === "Sin actividad" || dateStr.trim() === "") return "Sin actividad";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${date.getDate()} ${meses[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

// Badge de campaña reutilizable (para que en TODO lugar donde aparece un lead
// se vea clarísimo a qué campaña pertenece).
const CampaignBadge = ({ lead }: { lead: StatLead }) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100 max-w-full">
    <Layers className="h-2.5 w-2.5 shrink-0" />
    <span className="truncate">{getCampaignName(lead)}</span>
  </span>
);

const StatusBadge = ({ status }: { status?: string }) => {
  const s = (status || "").toLowerCase();
  if (s.includes("respond"))
    return <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100">Respondido</span>;
  if (s.includes("enviad"))
    return <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100">Enviado</span>;
  if (s.includes("rebot"))
    return <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-100">Rebotado</span>;
  return <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">{status || "Pendiente"}</span>;
};

export default function EstadisticasAdicionales({ id_usuario }: EstadisticasAdicionalesProps) {
  const [leads, setLeads] = useState<StatLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>("Nunca");

  const [activeMetric, setActiveMetric] = useState<MetricDef | null>(null);
  const [selectedLead, setSelectedLead] = useState<StatLead | null>(null);
  const [filterTerm, setFilterTerm] = useState<string>("");

  const loadStats = async () => {
    if (!id_usuario) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdditionalStats(id_usuario);
      setLeads(Array.isArray(data) ? data : []);
      setLastRefreshed(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch (err: any) {
      console.warn("Error cargando estadísticas adicionales:", err);
      setError("No pudimos recuperar las estadísticas adicionales en este momento. Intenta actualizar en unos instantes.");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id_usuario]);

  // Totales agregados de todas las métricas.
  const totals = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const def of METRIC_DEFS) {
      acc[def.key] = leads.reduce((sum, l) => sum + metricValue(l, def.key), 0);
    }
    return acc;
  }, [leads]);

  // Tasas de rendimiento (KPIs hero).
  const entregados = totals.entregados || 0;
  const abiertos = totals.abiertos || 0;
  const clics = totals.clics || 0;
  const procesados = totals.procesados || 0;

  const tasaEntrega = procesados > 0 ? ((entregados / procesados) * 100).toFixed(1) : "0.0";
  const tasaApertura = entregados > 0 ? ((abiertos / entregados) * 100).toFixed(1) : "0.0";
  const tasaClics = entregados > 0 ? ((clics / entregados) * 100).toFixed(1) : "0.0";
  const ctor = abiertos > 0 ? ((clics / abiertos) * 100).toFixed(1) : "0.0";

  // Embudo: Procesados -> Entregados -> Abiertos -> Clics.
  const funnel = [
    { label: "Procesados", val: procesados, color: "sky" },
    { label: "Entregados", val: entregados, color: "indigo" },
    { label: "Abiertos", val: abiertos, color: "emerald" },
    { label: "Clics", val: clics, color: "violet" },
  ];
  const funnelMax = Math.max(...funnel.map((f) => f.val), 1);

  // Leads que tienen al menos 1 en la métrica activa (para la sublista).
  const metricLeads = useMemo(() => {
    if (!activeMetric) return [];
    return leads
      .map((l, idx) => ({ lead: l, idx, val: metricValue(l, activeMetric.key) }))
      .filter((x) => x.val > 0)
      .sort((a, b) => b.val - a.val);
  }, [activeMetric, leads]);

  // Filtro de la lista principal de leads.
  const filteredLeads = useMemo(() => {
    const q = filterTerm.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((lead) =>
      [getCompany(lead), getCampaignName(lead), lead.email_lead, lead.status, lead.status_lead]
        .some((v) => v && String(v).toLowerCase().includes(q))
    );
  }, [filterTerm, leads]);

  const totalLeads = leads.length;

  // -------------------------------------------------------------------------
  // Mini pantalla de carga
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] gap-5">
        <div className="relative h-14 w-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-100" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 border-r-indigo-600 animate-spin" />
          <BarChart3 className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-slate-700">Procesando tus estadísticas…</p>
          <p className="text-xs text-slate-400">Estamos combinando las métricas de todos tus leads. Esto puede tardar unos segundos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Barra de control */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Gauge className="h-4 w-4 text-indigo-500" />
            Estadísticas Adicionales
          </h2>
          <p className="text-xs text-slate-500">
            Métricas de entrega, aperturas y clics combinadas de todos tus leads.
            <span className="ml-1 text-slate-400">Última actualización: <strong className="font-mono text-slate-600">{lastRefreshed}</strong></span>
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <span className="text-xs font-mono font-extrabold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/60">
            {totalLeads} leads
          </span>
          <button
            type="button"
            onClick={loadStats}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all disabled:bg-slate-200 disabled:text-slate-500 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-xs text-amber-800 flex items-center justify-between font-medium">
          <span>⚠️ {error}</span>
          <button onClick={loadStats} className="inline-flex items-center gap-1 font-bold text-amber-900 hover:underline cursor-pointer">
            <RefreshCw className="h-3 w-3" /> Reintentar
          </button>
        </div>
      )}

      {totalLeads === 0 && !error ? (
        <div className="flex flex-col items-center justify-center p-16 border border-dashed border-slate-200 bg-white rounded-2xl text-center min-h-[300px]">
          <Activity className="h-10 w-10 text-slate-300 animate-pulse mb-3" />
          <p className="text-sm font-semibold text-slate-600">Todavía no hay estadísticas para mostrar</p>
          <p className="text-xs text-slate-400 mt-2 max-w-sm">
            Cuando tus campañas empiecen a registrar entregas, aperturas y clics, verás acá el desglose completo por lead.
          </p>
        </div>
      ) : totalLeads > 0 ? (
        <>
          {/* HERO KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Tasa de Entrega", val: tasaEntrega, sub: `${entregados} de ${procesados} procesados`, icon: Send, color: "text-indigo-600", bar: "bg-indigo-500" },
              { label: "Tasa de Apertura", val: tasaApertura, sub: `${abiertos} aperturas`, icon: MailOpen, color: "text-emerald-600", bar: "bg-emerald-500" },
              { label: "Tasa de Clics (CTR)", val: tasaClics, sub: `${clics} clics sobre entregados`, icon: MousePointerClick, color: "text-violet-600", bar: "bg-violet-500" },
              { label: "Clic-Apertura (CTOR)", val: ctor, sub: `${clics} clics sobre aperturas`, icon: TrendingUp, color: "text-sky-600", bar: "bg-sky-500" },
            ].map((kpi, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -2 }}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{kpi.label}</span>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className={`font-mono text-3xl font-extrabold ${kpi.color}`}>{kpi.val}</span>
                  <span className="text-sm font-bold text-slate-400">%</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(parseFloat(kpi.val), 100)}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${kpi.bar}`}
                  />
                </div>
                <p className="mt-2 text-[10px] text-slate-400">{kpi.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* GRID DE MÉTRICAS CLICKEABLES */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Desglose por métrica</h3>
              <span className="text-[10px] text-slate-400 italic">— tocá una tarjeta para ver los leads que la componen</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {METRIC_DEFS.map((def) => {
                const c = COLORS[def.color];
                const val = totals[def.key] || 0;
                const count = leads.filter((l) => metricValue(l, def.key) > 0).length;
                return (
                  <motion.button
                    key={def.key}
                    type="button"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveMetric(def)}
                    className={`text-left rounded-2xl border ${c.card} p-4 shadow-sm transition-all cursor-pointer group`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.iconWrap}`}>
                        <def.icon className="h-4 w-4" />
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className={`font-mono text-2xl font-extrabold ${c.value}`}>{val}</span>
                    </div>
                    <p className={`text-[11px] font-bold ${c.label} mt-0.5`}>{def.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {count > 0 ? `${count} ${count === 1 ? "lead" : "leads"}` : def.desc}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* EMBUDO DE CONVERSIÓN */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Embudo de Conversión</h4>
            </div>
            <div className="space-y-3">
              {funnel.map((f, i) => {
                const c = COLORS[f.color];
                const widthPerc = (f.val / funnelMax) * 100;
                const rel = i > 0 && funnel[i - 1].val > 0 ? ((f.val / funnel[i - 1].val) * 100).toFixed(1) : null;
                return (
                  <div key={f.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-2 font-semibold text-slate-600">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.dot }} />
                        {f.label}
                      </span>
                      <span className="flex items-center gap-2">
                        {rel && <span className="text-[10px] text-slate-400">{rel}% del paso anterior</span>}
                        <strong className="font-mono text-slate-800">{f.val}</strong>
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPerc}%` }}
                        transition={{ duration: 0.7, delay: i * 0.06 }}
                        className={`h-full rounded-full ${c.bar}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LISTA DE LEADS CON SUS ESTADÍSTICAS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-500" />
                  Leads y sus estadísticas
                </h3>
                <p className="text-xs text-slate-500 mt-1">Detalle por lead. Tocá una fila para ver el desglose completo.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={filterTerm}
                  onChange={(e) => setFilterTerm(e.target.value)}
                  placeholder="Buscar por empresa, campaña, email…"
                  className="w-full h-10 bg-slate-50 rounded-lg border border-slate-200 pl-9 pr-9 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                />
                {filterTerm && (
                  <button
                    type="button"
                    onClick={() => setFilterTerm("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold text-slate-600">Sin coincidencias</p>
                <p className="text-xs text-slate-400 mt-1">Ningún lead coincide con “{filterTerm}”.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left border-collapse min-w-[720px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                      <th className="py-3 px-4">Empresa / Campaña</th>
                      <th className="py-3 px-3 text-center">Entreg.</th>
                      <th className="py-3 px-3 text-center">Abiertos</th>
                      <th className="py-3 px-3 text-center">Clics</th>
                      <th className="py-3 px-3 text-center">Rebotes</th>
                      <th className="py-3 px-3">Estado</th>
                      <th className="py-3 px-4 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead, idx) => (
                      <tr
                        key={getLeadId(lead, idx)}
                        onClick={() => setSelectedLead(lead)}
                        className="hover:bg-slate-50/75 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="space-y-1 max-w-[240px]">
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                              {getCompany(lead)}
                            </p>
                            <CampaignBadge lead={lead} />
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-xs font-bold text-indigo-700">{metricValue(lead, "entregados")}</td>
                        <td className="py-3.5 px-3 text-center font-mono text-xs font-bold text-emerald-700">{metricValue(lead, "abiertos")}</td>
                        <td className="py-3.5 px-3 text-center font-mono text-xs font-bold text-violet-700">{metricValue(lead, "clics")}</td>
                        <td className="py-3.5 px-3 text-center font-mono text-xs font-bold text-rose-700">{metricValue(lead, "rebotados")}</td>
                        <td className="py-3.5 px-3"><StatusBadge status={lead.status_lead || lead.status} /></td>
                        <td className="py-3.5 px-4 text-right">
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 inline-block transition-colors" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* ===================================================================== */}
      {/* MODAL: sublista de leads por métrica                                   */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {activeMetric && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setActiveMetric(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${COLORS[activeMetric.color].iconWrap}`}>
                    <activeMetric.icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{activeMetric.label}</h3>
                    <p className="text-[11px] text-slate-500">
                      {metricLeads.length} {metricLeads.length === 1 ? "lead" : "leads"} con al menos 1 · Total: <strong className="font-mono">{totals[activeMetric.key] || 0}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveMetric(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto p-4 space-y-2">
                {metricLeads.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Ningún lead registró <strong>{activeMetric.label.toLowerCase()}</strong> todavía.
                  </div>
                ) : (
                  metricLeads.map(({ lead, idx, val }) => (
                    <button
                      key={getLeadId(lead, idx)}
                      type="button"
                      onClick={() => {
                        setSelectedLead(lead);
                        setActiveMetric(null);
                      }}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 p-3 transition-all cursor-pointer text-left"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{getCompany(lead)}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CampaignBadge lead={lead} />
                          {lead.email_lead && (
                            <span className="text-[10px] text-slate-400 truncate">{lead.email_lead}</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`font-mono text-lg font-extrabold ${COLORS[activeMetric.color].value}`}>{val}</span>
                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{activeMetric.label}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* MODAL: detalle completo de un lead                                     */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSelectedLead(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-slate-100">
                <div className="min-w-0 space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 truncate">{getCompany(selectedLead)}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CampaignBadge lead={selectedLead} />
                    <StatusBadge status={selectedLead.status_lead || selectedLead.status} />
                  </div>
                  {selectedLead.email_lead && (
                    <p className="text-xs text-slate-500 truncate">{selectedLead.email_lead}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto p-6 space-y-5">
                {/* Métricas principales */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Métricas principales</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {METRIC_DEFS.slice(0, 5).map((def) => {
                      const c = COLORS[def.color];
                      return (
                        <div key={def.key} className={`rounded-xl border ${c.card} p-2.5 text-center`}>
                          <p className={`text-[9px] font-bold uppercase tracking-tight ${c.label}`}>{def.label}</p>
                          <p className={`font-mono text-base font-extrabold ${c.value} mt-0.5`}>{metricValue(selectedLead, def.key)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Desglose completo de contadores */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Desglose completo</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { label: "Procesados", v: metricValue(selectedLead, "procesados") },
                      { label: "Entregados", v: num(selectedLead.DeliveredCount) },
                      { label: "Aperturas", v: num(selectedLead.OpenedCount) },
                      { label: "Clics", v: num(selectedLead.ClickedCount) },
                      { label: "Rebotes", v: num(selectedLead.BouncedCount) },
                      { label: "Rebote duro", v: num(selectedLead.HardBouncedCount) },
                      { label: "Rebote suave", v: num(selectedLead.SoftBouncedCount) },
                      { label: "Bloqueados", v: num(selectedLead.BlockedCount) },
                      { label: "Quejas Spam", v: num(selectedLead.SpamComplaintCount) },
                      { label: "Desuscritos", v: num(selectedLead.UnsubscribedCount) },
                      { label: "Diferidos", v: num(selectedLead.DeferredCount) },
                      { label: "En cola", v: num(selectedLead.QueuedCount) + num(selectedLead.PreQueuedCount) },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                        <span className="text-[11px] text-slate-500 font-medium">{row.label}</span>
                        <span className="font-mono text-xs font-bold text-slate-800">{row.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Última actividad</p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      {formatDate(selectedLead.LastActivityAt || selectedLead.ultima_actividad)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Creado</p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{formatDate(selectedLead.created_at)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

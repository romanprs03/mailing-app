/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { fetchCampaignMetrics, fetchPreviousCampaigns, fetchAdditionalStats } from "../api";
import { MetricasResponse, CampanaAnterior } from "../types";
import { 
  RefreshCw, 
  Mail, 
  MessageSquare, 
  AlertTriangle, 
  EyeOff, 
  Inbox, 
  TrendingUp, 
  BarChart, 
  PieChart as PieIcon, 
  Activity,
  Award,
  Loader2,
  Calendar,
  History,
  BookOpen,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Zap
} from "lucide-react";

interface DashboardProps {
  id_usuario: string;
}

// ---------------------------------------------------------------------------
// Helpers para leer los contadores de cada lead del segundo webhook
// (misma lógica que la pestaña "Estadísticas Adicionales").
// ---------------------------------------------------------------------------
const num = (v: any): number => {
  if (typeof v === "number") return isNaN(v) ? 0 : v;
  if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v);
  return 0;
};

const pref = (...vals: any[]): number => {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== "") return num(v);
  }
  return 0;
};

// Correos entregados de un lead (contador Mailjet + campo amigable del backend).
const leadEntregados = (lead: any): number => pref(lead.DeliveredCount, lead.entregados);

// Rebotes de un lead (directo, o suma de rebote duro + suave si no viene directo).
const leadRebotados = (lead: any): number => {
  const directo = pref(lead.BouncedCount, lead.rebotados);
  if (directo > 0) return directo;
  return num(lead.HardBouncedCount) + num(lead.SoftBouncedCount);
};

export default function Dashboard({ id_usuario }: DashboardProps) {
  const [metrics, setMetrics] = useState<MetricasResponse | null>(null);
  const [statLeads, setStatLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>("Nunca sincronizado");
  const [leadsProcessing, setLeadsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [showCompletedBanner, setShowCompletedBanner] = useState<boolean>(false);

  const [prevCampaigns, setPrevCampaigns] = useState<CampanaAnterior[] | null>(null);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [prevError, setPrevError] = useState<string | null>(null);
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});
  const [selectedCampaignName, setSelectedCampaignName] = useState<string | null>(null);

  const handleToggleCampaign = (campName: string, campaignObj: any) => {
    let currentState = activeStates[campName];
    if (currentState === undefined) {
      const val = campaignObj.activa !== undefined ? campaignObj.activa : campaignObj.activo;
      if (val !== undefined) {
        if (typeof val === "boolean") currentState = val;
        else if (typeof val === "string") currentState = val.toLowerCase() === "true" || val === "1";
        else if (typeof val === "number") currentState = val === 1;
        else currentState = !!val;
      } else {
        currentState = true;
      }
    }
    const newState = !currentState;
    
    // 1. Actualizar estado local
    setActiveStates(prev => ({
      ...prev,
      [campName]: newState
    }));

    // 2. Enviar al webhook en segundo plano (post-and-forget)
    fetch("https://romanparisi.online/webhook/c45d131d-bcbd-4800-859b-ae182489b63a", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id_usuario,
        campaign_name: campName,
        activo: newState,
        campana_detalles: campaignObj,
        timestamp: new Date().toISOString()
      })
    }).catch(err => {
      console.warn("Fallo silencioso al enviar webhook:", err);
    });
  };

  const handleToggleSelectCampaign = (campName: string) => {
    setSelectedCampaignName(prev => prev === campName ? null : campName);
  };

  const isFetchingRef = useRef(false);
  const consecutiveUnchangedRef = useRef<number>(0);
  const prevTotalRef = useRef<number>(-1);
  const offlineTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadPreviousCampaigns = async () => {
    if (!id_usuario) return;
    setLoadingPrev(true);
    setPrevError(null);
    try {
      const data = await fetchPreviousCampaigns(id_usuario);
      setPrevCampaigns(data || []);

      // Preseteamos el estado inicial de activación según lo recibido del webhook
      if (data && Array.isArray(data)) {
        const initialStates: Record<string, boolean> = { ...activeStates };
        data.forEach((camp) => {
          const nombre = camp.campaign_name || camp.nombre_campana;
          if (nombre) {
            if (activeStates[nombre] === undefined) {
              const val = camp.activa !== undefined ? camp.activa : camp.activo;
              let isAct = true;
              if (val !== undefined) {
                if (typeof val === "boolean") isAct = val;
                else if (typeof val === "string") isAct = val.toLowerCase() === "true" || val === "1";
                else if (typeof val === "number") isAct = val === 1;
                else isAct = !!val;
              }
              initialStates[nombre] = isAct;
            }
          }
        });
        setActiveStates(initialStates);
      }
    } catch (err: any) {
      console.warn("Error cargando campañas anteriores:", err);
      setPrevError("No se pudieron recuperar las campañas anteriores.");
    } finally {
      setLoadingPrev(false);
    }
  };

  // Botón "Actualizar base"
  const handleActualizarBase = async () => {
    if (offlineTimerRef.current) {
      clearTimeout(offlineTimerRef.current);
    }
    
    setIsConnected(true);
    await loadMetrics(false);
    setIsConnected(true);

    offlineTimerRef.current = setTimeout(() => {
      setIsConnected(false);
    }, 5 * 60 * 1000); // 5 minutos exactos
  };

  // Limpiar temporizador de desconexión al desmontar
  useEffect(() => {
    return () => {
      if (offlineTimerRef.current) {
         clearTimeout(offlineTimerRef.current);
      }
    };
  }, []);

  // Carga de las estadísticas por lead (segundo webhook) que alimentan las
  // tarjetas Enviado y Rebotado. Fire-and-forget: un fallo aquí no rompe el
  // resto del dashboard.
  const loadStatLeads = async () => {
    if (!id_usuario) return;
    try {
      const rows = await fetchAdditionalStats(id_usuario);
      const arr = Array.isArray(rows) ? rows : [];
      setStatLeads(arr);
      localStorage.setItem(`theairoom_${id_usuario}_stat_leads`, JSON.stringify(arr));
    } catch (err) {
      console.warn("No se pudieron traer las estadísticas por lead para el dashboard:", err);
    }
  };

  // Carga de métricas reales del webhook
  const loadMetrics = async (silent = false) => {
    if (!id_usuario) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    if (!silent) {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
    }

    try {
      const data = await fetchCampaignMetrics(id_usuario, "");
      
      if (data && (data.Pendiente !== undefined || data.Enviado !== undefined)) {
        setMetrics(data);
        setIsConnected(true);
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastRefreshed(timeNow);
        
        // Guardar en persistencia local con clave única de usuario
        localStorage.setItem(`theairoom_${id_usuario}_metrics_data`, JSON.stringify(data));
        localStorage.setItem(`theairoom_${id_usuario}_metrics_time`, timeNow);

        // Refrescar en paralelo las estadísticas por lead (Enviado / Rebotado).
        loadStatLeads();

        const isProcessing = localStorage.getItem(`pepper_leads_processing_${id_usuario}`) === "true";
        if (isProcessing) {
          const pVal = (data.Pendiente || 0) + (data.Enviado || 0) + (data.Respondido || 0) + (data.Rebotado || 0) + (data["No encontrado"] || 0);
          if (prevTotalRef.current === -1) {
            prevTotalRef.current = pVal;
            consecutiveUnchangedRef.current = 1;
          } else if (pVal === prevTotalRef.current) {
            consecutiveUnchangedRef.current += 1;
            if (consecutiveUnchangedRef.current >= 5) {
              setLeadsProcessing(false);
              localStorage.setItem(`pepper_leads_processing_${id_usuario}`, "false");
              setShowCompletedBanner(true);
              consecutiveUnchangedRef.current = 0;
              prevTotalRef.current = -1;
            }
          } else {
            prevTotalRef.current = pVal;
            consecutiveUnchangedRef.current = 1;
          }
        } else {
          consecutiveUnchangedRef.current = 0;
          prevTotalRef.current = -1;
        }

        if (!silent) {
          setSuccessMsg("Métricas actualizadas exitosamente.");
        }
      } else {
        throw new Error("El canal respondió pero no devolvió conteos válidos.");
      }
    } catch (err: any) {
      console.warn("Error actualizando métricas", err);
      setIsConnected(false);
      if (!silent) {
        setError(
          "No se pudieron recuperar las métricas de tu dashboard porque no tienes campañas activas en este momento."
        );
      }
    } finally {
      isFetchingRef.current = false;
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Re-inicializa y carga las métricas del usuario actual al cambiar id_usuario o cambiar leadsProcessing
  useEffect(() => {
    if (id_usuario) {
      const isProcessing = localStorage.getItem(`pepper_leads_processing_${id_usuario}`) === "true";
      setLeadsProcessing(isProcessing);
      
      // Reiniciar auxiliares de conteo consecutivas
      consecutiveUnchangedRef.current = 0;
      prevTotalRef.current = -1;
      setShowCompletedBanner(false);
      setPrevCampaigns(null);
      setPrevError(null);
      setActiveStates({});
      setSelectedCampaignName(null);

      // Cargar la cache de estadísticas por lead y refrescarlas del segundo webhook
      const savedStats = localStorage.getItem(`theairoom_${id_usuario}_stat_leads`);
      if (savedStats) {
        try {
          setStatLeads(JSON.parse(savedStats) || []);
        } catch {
          setStatLeads([]);
        }
      } else {
        setStatLeads([]);
      }
      loadStatLeads();

      // Intentar cargar la cache del usuario específico de localStorage
      const saved = localStorage.getItem(`theairoom_${id_usuario}_metrics_data`);
      const savedTime = localStorage.getItem(`theairoom_${id_usuario}_metrics_time`);
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMetrics(parsed);
          const pVal = (parsed.Pendiente || 0) + (parsed.Enviado || 0) + (parsed.Respondido || 0) + (parsed.Rebotado || 0) + (parsed["No encontrado"] || 0);
          prevTotalRef.current = pVal;
          setLastRefreshed(savedTime || "Nunca sincronizado");
          
          if (isProcessing) {
            loadMetrics(true); // fondo silencioso para refrescar
          }
        } catch (e) {
          setMetrics(null);
          prevTotalRef.current = -1;
          setLastRefreshed("Nunca sincronizado");
          loadMetrics(false);
        }
      } else {
        setMetrics(null);
        prevTotalRef.current = -1;
        setLastRefreshed("Nunca sincronizado");
        loadMetrics(false);
      }

      let interval: NodeJS.Timeout | null = null;
      
      // Solo iniciamos la rueda de carga / polling si de verdad se está procesando
      if (isProcessing) {
        interval = setInterval(() => {
          loadMetrics(true);
        }, 2500);
      }

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      setMetrics(null);
      setLastRefreshed("Nunca sincronizado");
    }
  }, [id_usuario, leadsProcessing]);

  // Metricas de la campaña seleccionada o las globales del webhook/almacenadas
  const currentMetrics = (() => {
    if (selectedCampaignName && prevCampaigns) {
      const selectedCamp = prevCampaigns.find(c => {
        const nombre = c.campaign_name || c.nombre_campana;
        return nombre === selectedCampaignName;
      });
      if (selectedCamp) {
        return {
          campaign_name: selectedCamp.campaign_name || selectedCamp.nombre_campana || selectedCampaignName,
          asunto: selectedCamp.asunto || "",
          Pendiente: selectedCamp.Pendiente || 0,
          Enviado: selectedCamp.Enviado || 0,
          Respondido: selectedCamp.Respondido || 0,
          Rebotado: selectedCamp.Rebotado || 0,
          "No encontrado": selectedCamp["No encontrado"] || 0,
        };
      }
    }
    return metrics;
  })();

  // Estadísticas por lead (segundo webhook) que alimentan Enviado y Rebotado.
  // Si hay una campaña anterior seleccionada, filtramos los leads por su nombre.
  const relevantStatLeads = selectedCampaignName
    ? statLeads.filter((l) => (l.campaign_name || l.nombre_campana) === selectedCampaignName)
    : statLeads;

  const entregadosTotal = relevantStatLeads.reduce((s, l) => s + leadEntregados(l), 0);
  const rebotadosTotal = relevantStatLeads.reduce((s, l) => s + leadRebotados(l), 0);
  const hasStatData = relevantStatLeads.length > 0;

  // Cálculos estadísticos con safe fallbacks
  const p = currentMetrics?.Pendiente || 0;                 // ← webhook de métricas
  const r = currentMetrics?.Respondido || 0;                // ← webhook de métricas
  const nf = currentMetrics?.["No encontrado"] || 0;        // ← webhook de métricas
  // Rebotado = rebotados; Enviado = entregados + rebotados (ambos del 2º webhook).
  // Si el segundo webhook no trajo datos, caemos a los valores del webhook de métricas.
  const reb = hasStatData ? rebotadosTotal : (currentMetrics?.Rebotado || 0);
  const e = hasStatData ? (entregadosTotal + rebotadosTotal) : (currentMetrics?.Enviado || 0);

  const activeCampaignName = currentMetrics?.campaign_name || localStorage.getItem(`theairoom_${id_usuario}_campaign_title_config`) || "";

  // Rebotado está contenido dentro de Enviado, por eso NO se suma aparte al total.
  const totalLeads = p + e + r + nf;

  const processedLeads = e + r + nf;

  const responseRate = e > 0 ? ((r / e) * 100).toFixed(1) : "0.0";
  // Entregabilidad = entregados / enviados (los que llegaron sin rebotar).
  const deliveredForRate = hasStatData ? entregadosTotal : Math.max(e - reb, 0);
  const deliveryRate = e > 0 ? ((deliveredForRate / e) * 100).toFixed(1) : "0.0";
  const bounceRate = e > 0 ? ((reb / e) * 100).toFixed(1) : "0.0";

  // Configuración de segmentos para el visualizador circular de dona (Pure SVG)
  // Rebotado va incluido dentro de Enviado, por eso no aparece como segmento propio.
  const donutData = [
    { label: "Pendiente", count: p, color: "#94a3b8" },
    { label: "Enviado", count: e, color: "#6366f1" },
    { label: "Respondido", count: r, color: "#10b981" },
    { label: "No encontrado", count: nf, color: "#a1a1aa" },
  ].filter(item => item.count > 0);

  const sumCount = donutData.reduce((acc, curr) => acc + curr.count, 0);

  let cumulativeAngle = 0;
  const donutSegments = donutData.map((item) => {
    const percentage = sumCount > 0 ? item.count / sumCount : 0;
    const strokeDashArray = `${percentage * 100} ${100 - (percentage * 100)}`;
    const strokeDashOffset = -cumulativeAngle;
    cumulativeAngle += percentage * 100;

    return {
      ...item,
      dashArray: strokeDashArray,
      dashOffset: strokeDashOffset,
      percentage: (percentage * 100).toFixed(1)
    };
  });

  return (
    <div className="space-y-6">
      {/* Barra de control en tiempo real con Estado de Base de Datos */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans">
            Panel de Desempeño General
          </h2>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 font-sans">Estado de la base de datos:</span>
              {isConnected ? (
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-emerald-600 font-sans">En línea</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold text-rose-600 font-sans">Offline</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          id="btn_actualizar_base"
          type="button"
          onClick={handleActualizarBase}
          disabled={loading}
          className="inline-flex self-start md:self-auto items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all disabled:bg-slate-200 disabled:text-slate-500 cursor-pointer shadow-sm"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Actualizar base
        </button>
      </div>

      {showCompletedBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 flex items-center justify-between gap-4"
          id="banner_completed_leads"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950 font-sans">
                ¡Listo! Todos tus leads subidos exitosamente
              </p>
              <p className="text-[11px] text-emerald-700 leading-relaxed font-sans">
                La sincronización de leads ha finalizado. Toda tu base de datos para cold email está activa.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCompletedBanner(false)}
            className="shrink-0 text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-3 py-1.5 bg-white/80 hover:bg-white rounded-lg border border-emerald-200 transition-all cursor-pointer shadow-sm font-sans"
          >
            Aceptar
          </button>
        </motion.div>
      )}

      {leadsProcessing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-indigo-100 bg-indigo-50/45 p-4 flex items-center justify-between gap-4"
          id="banner_processing_leads"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-950 font-sans">
                Sus leads se están procesando
              </p>
              <p className="text-[11px] text-indigo-700 leading-relaxed font-sans">
                Esto puede tardar unos minutos. Sincronizando base de datos en vivo (leads detectados hasta ahora: <strong className="font-mono">{totalLeads}</strong>)...
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {error || successMsg ? (
        <div className="space-y-2">
          {error && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-xs text-amber-800 flex items-center justify-between font-medium">
              <span>⚠️ {error}</span>
            </div>
          )}
          {successMsg && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-3 text-xs text-emerald-800 font-medium">
              ✅ {successMsg}
            </div>
          )}
        </div>
      ) : null}

      {/* Si no hay campañas ni datos guardados, dejar opaco/vacío o mostrar aviso elegante de que no hay campañas */}
      {!currentMetrics ? (
        <div className="flex flex-col items-center justify-center p-16 border border-dashed border-slate-200 bg-white rounded-2xl text-center min-h-[300px]" id="empty_campaign_stats">
          <Activity className="h-10 w-10 text-slate-300 animate-pulse mb-3" />
          <p className="text-sm font-semibold text-slate-600 font-sans">No tienes campañas activas descodificadas</p>
          <p className="text-xs text-slate-400 mt-2 max-w-sm font-sans">
            Si no se pudieron recuperar las métricas del dashboard es porque no tienes campañas activas en este momento. Una vez inyectada una campaña, empezarán a sincronizarse los leads automáticamente.
          </p>
        </div>
      ) : (
        <>
          {/* Grid de Tarjetas de Métricas para la Campaña */}
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Distribución en Tiempo Real de Leads
            </h3>
            {leadsProcessing && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded font-sans">
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                Sincronizando
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {/* PENDIENTE */}
            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-slate-105 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pendiente</span>
                {leadsProcessing ? (
                  <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                ) : (
                  <Inbox className="h-4 w-4 text-slate-450" />
                )}
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-slate-800">{p}</span>
                <span className="text-[10px] text-slate-400 font-sans font-medium">leads</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-400 font-sans">
                Preparados para envío
              </div>
            </motion.div>

            {/* ENVIADO */}
            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Enviado</span>
                <Mail className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-slate-900">{e}</span>
                <span className="text-[10px] text-indigo-400 font-sans font-medium">leads</span>
              </div>
              <div className="mt-1 text-[10px] text-indigo-600 font-sans">
                {hasStatData
                  ? `${entregadosTotal} entregados · ${rebotadosTotal} rebotados`
                  : `${(totalLeads > 0 ? (e / totalLeads) * 100 : 0).toFixed(1)}% del lote total`}
              </div>
            </motion.div>

            {/* RESPONDIDO */}
            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Respondido</span>
                <MessageSquare className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-emerald-800">{r}</span>
                <span className="text-[10px] text-emerald-400 font-sans font-medium">respuestas</span>
              </div>
              <div className="mt-1 text-[10px] text-emerald-600 font-semibold font-sans">
                {responseRate}% reply rate
              </div>
            </motion.div>

            {/* REBOTADO */}
            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-rose-100 bg-rose-50/20 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Rebotado</span>
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-rose-800">{reb}</span>
                <span className="text-[10px] text-rose-450 font-sans font-medium">bounces</span>
              </div>
              <div className="mt-1 text-[10px] text-rose-600 font-sans">
                {bounceRate}% tasa de rebote
              </div>
            </motion.div>

            {/* NO ENCONTRADO */}
            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-650">No encontrado</span>
                <EyeOff className="h-4 w-4 text-zinc-500" />
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-zinc-700">{nf}</span>
                <span className="text-[10px] text-slate-400 font-sans font-medium">sin email</span>
              </div>
              <div className="mt-1 text-[10px] text-zinc-550 font-sans">
                Emails no hallados
              </div>
            </motion.div>
          </div>

          {/* KPIS DE RENDIMIENTO Y GRAFICOS */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* KPI: Eficiencia */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                  <h4 className="font-sans text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Eficiencia De Entrega
                  </h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-xs text-slate-500">Tasa de Respuesta (Reply Rate)</span>
                      <span className="text-sm font-bold text-emerald-600 font-mono">{responseRate}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(parseFloat(responseRate) * 2.5, 100)}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-xs text-slate-500">Entregabilidad (Inbox placement)</span>
                      <span className="text-sm font-bold text-indigo-600 font-mono">{deliveryRate}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${deliveryRate}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-indigo-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-xs text-slate-500">Rebotes (Bounce Rate)</span>
                      <span className="text-sm font-bold text-rose-600 font-mono">{bounceRate}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${bounceRate}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-rose-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400 flex items-center justify-between font-sans">
                <span>Leads totales: <strong className="font-mono text-slate-600">{totalLeads}</strong></span>
                <span>Procesados: <strong className="font-mono text-slate-600">{(totalLeads - p)}</strong></span>
              </div>
            </div>

            {/* Dona de Distribución */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <PieIcon className="h-4 w-4 text-indigo-500" />
                <h4 className="font-sans text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Distribución Proporcional
                </h4>
              </div>

              {sumCount > 0 ? (
                <div className="flex items-center justify-center py-4 relative">
                  <svg width="150" height="150" viewBox="0 0 42 42" className="transform -rotate-90">
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="5" />
                    
                    {donutSegments.map((segment, index) => (
                      <circle
                         key={index}
                         cx="21"
                         cy="21"
                         r="15.915"
                         fill="transparent"
                         stroke={segment.color}
                         strokeWidth="5"
                         strokeDasharray={segment.dashArray}
                         strokeDashoffset={segment.dashOffset}
                         className="transition-all duration-700 ease-out hover:stroke-[6px]"
                      />
                    ))}
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <span className="font-mono text-xl font-extrabold text-slate-800">
                      {((processedLeads / (totalLeads || 1)) * 100).toFixed(0)}%
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">Procesados</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-400 italic">
                  Sin datos distribuidos
                </div>
              )}

              <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-slate-500 justify-center font-sans">
                {donutSegments.map((seg, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span>{seg.label} ({seg.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Volúmenes de barras */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <BarChart className="h-4 w-4 text-indigo-500" />
                <h4 className="font-sans text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Métricas Absolutas
                </h4>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: "Pendiente", val: p, max: totalLeads, bg: "bg-slate-400" },
                  { label: "Enviados", val: e, max: totalLeads, bg: "bg-indigo-500" },
                  { label: "Respuestas", val: r, max: totalLeads, bg: "bg-emerald-500" },
                  { label: "Rebotes", val: reb, max: totalLeads, bg: "bg-rose-500" },
                  { label: "No encontrado", val: nf, max: totalLeads, bg: "bg-zinc-400" },
                ].map((bar, index) => {
                  const widthPerc = bar.max > 0 ? (bar.val / bar.max) * 100 : 0;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-600 font-sans">
                        <span>{bar.label}</span>
                        <strong className="font-mono text-slate-800">{bar.val}</strong>
                      </div>
                      <div className="h-2.5 w-full bg-slate-50 rounded">
                        <motion.div
                          id={`bar_${index}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPerc}%` }}
                          transition={{ duration: 0.6, delay: index * 0.05 }}
                          className={`h-full rounded ${bar.bg}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Removidos Supabase & n8n referencias */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-indigo-600 font-bold tracking-tight mt-3">
                <span className="flex items-center gap-1 font-sans">
                  <Award className="h-3 w-3" />
                  Conexión segura cifrada
                </span>
                <span className="font-mono">Motor The AI Room</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sección de Campañas Anteriores */}
      <div className="pt-6 border-t border-slate-100 flex flex-col items-center">
        {!prevCampaigns ? (
          <div className="text-center space-y-4">
            <p className="text-xs text-slate-500 font-sans">¿Quieres revisar tus envíos históricos?</p>
            <button
              type="button"
              onClick={loadPreviousCampaigns}
              disabled={loadingPrev}
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-350 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
            >
              {loadingPrev ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                  Cargando campañas...
                </>
              ) : (
                <>
                  <History className="h-4 w-4 text-slate-500" />
                  Cargar campañas
                </>
              )}
            </button>
            {prevError && (
              <p className="text-xs text-rose-600 font-medium">{prevError}</p>
            )}
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <History className="h-4 w-4 text-slate-450" />
                Campañas
              </h3>
              <button
                type="button"
                onClick={loadPreviousCampaigns}
                disabled={loadingPrev}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-600 transition-all cursor-pointer"
              >
                <RefreshCw className={`h-2.5 w-2.5 ${loadingPrev ? "animate-spin" : ""}`} />
                Sincronizar historial
              </button>
            </div>

            {prevError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700">
                {prevError}
              </div>
            )}

            {prevCampaigns.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-slate-150 bg-slate-50/50 rounded-xl text-xs text-slate-400 italic">
                No se encontraron registros de campañas anteriores en tu cuenta.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {prevCampaigns.map((camp, idx) => {
                  const nombre = camp.campaign_name || camp.nombre_campana || `Histórica #${idx + 1}`;
                  const p_prev = camp.Pendiente || 0;
                  const e_prev = camp.Enviado || 0;
                  const r_prev = camp.Respondido || 0;
                  const reb_prev = camp.Rebotado || 0;
                  const nf_prev = camp["No encontrado"] || 0;
                  const total_prev = p_prev + e_prev + r_prev + reb_prev + nf_prev;
                  const webhookActivaState = (() => {
                    const val = camp.activa !== undefined ? camp.activa : camp.activo;
                    if (val === undefined) return true; // default to true if missing
                    if (typeof val === "boolean") return val;
                    if (typeof val === "string") return val.toLowerCase() === "true" || val === "1";
                    if (typeof val === "number") return val === 1;
                    return !!val;
                  })();
                  const isActive = activeStates[nombre] !== undefined ? activeStates[nombre] : webhookActivaState;

                  return (
                    <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                      {/* Cabecera de campaña anterior */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-3">
                        <div className="flex items-center gap-3">
                          {/* Checkbox para visualización en el Panel Principal */}
                          <button
                            type="button"
                            onClick={() => handleToggleSelectCampaign(nombre)}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                              selectedCampaignName === nombre
                                ? "border-indigo-600 bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-100"
                                : "border-slate-300 bg-white text-transparent hover:border-indigo-400"
                            }`}
                            title="Seleccionar para visualizar esta campaña en el Panel Principal"
                          >
                            <svg className="h-3 w-3 stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>

                          <div className="leading-tight space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-extrabold text-slate-800 font-sans tracking-tight">
                                {nombre}
                              </p>
                              {selectedCampaignName === nombre && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-widest border border-indigo-105">
                                  En Panel
                                </span>
                              )}
                            </div>
                            {camp.asunto && (
                              <p className="text-[10px] text-slate-400 font-sans italic truncate max-w-[120px] sm:max-w-xs">
                                Asunto: {camp.asunto}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Selector Switch Interactivo con Webhook POST - Diseño premium estilo iOS */}
                        <div 
                          className="flex items-center gap-2 select-none shrink-0 cursor-pointer" 
                          onClick={() => handleToggleCampaign(nombre, camp)}
                        >
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider transition-colors duration-200 ${isActive ? "text-emerald-600" : "text-slate-450"}`}>
                            {isActive ? "Activa" : "Inactiva"}
                          </span>
                          <button
                            type="button"
                            className={`relative inline-flex h-5.5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-in-out focus:outline-none ${
                              isActive ? "bg-[#34c759]" : "bg-[#e9e9ea]"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition duration-300 ease-in-out absolute top-0.5 ${
                                isActive ? "translate-x-4 left-0" : "translate-x-0.5 left-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Cuadradaso simplificado de métricas */}
                      <div className="grid grid-cols-5 gap-2 text-center">
                        <div className="rounded-xl bg-slate-50 p-2 border border-slate-100/50">
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">Pendiente</p>
                          <p className="font-mono text-xs font-bold text-slate-700 mt-1">{p_prev}</p>
                        </div>
                        <div className="rounded-xl bg-indigo-50/30 p-2 border border-indigo-100/30">
                          <p className="text-[9px] font-semibold text-indigo-400 uppercase tracking-tight">Enviado</p>
                          <p className="font-mono text-xs font-bold text-indigo-700 mt-1">{e_prev}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50/30 p-2 border border-emerald-100/30">
                          <p className="text-[9px] font-semibold text-emerald-500 uppercase tracking-tight">Respondido</p>
                          <p className="font-mono text-xs font-bold text-emerald-700 mt-1">{r_prev}</p>
                        </div>
                        <div className="rounded-xl bg-rose-50/30 p-2 border border-rose-100/30">
                          <p className="text-[9px] font-semibold text-rose-550 uppercase tracking-tight">Rebotado</p>
                          <p className="font-mono text-xs font-bold text-rose-700 mt-1">{reb_prev}</p>
                        </div>
                        <div className="rounded-xl bg-zinc-100/65 p-2 border border-zinc-200/50">
                          <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-tight">No Hallado</p>
                          <p className="font-mono text-xs font-bold text-zinc-600 mt-1">{nf_prev}</p>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
                        <span>Total: <strong className="font-mono text-slate-600">{total_prev}</strong> leads</span>
                        {e_prev > 0 && (
                          <span className="text-emerald-600 font-medium">Tasa de respuesta: {((r_prev / e_prev) * 100).toFixed(1)}%</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

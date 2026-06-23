import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
  Phone,
  Map,
  Globe,
  Star,
  HelpCircle,
  Check,
  X,
  Save,
  ArrowLeft,
  Mail,
  Instagram,
  Facebook,
  Video,
  ExternalLink,
  Sparkles,
  RefreshCw
} from "lucide-react";

interface Lead {
  id?: string | number;
  id_lead?: string | number;
  nombre_negocio?: string;
  nombre?: string;
  estado_envio?: string;
  estado?: string;
  fecha_creacion?: string;
  creado_en?: string;
  telefono?: string;
  direccion?: string;
  rating?: string | number;
  // URLs de redes sociales (si están, se muestran como activas con hipervínculo)
  website_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  necesidad_detectada?: string;
  asunto?: string;
  cuerpo?: string;
}

interface GoogleMapsLeadsProps {
  id_usuario: string;
}

export default function GoogleMapsLeads({ id_usuario }: GoogleMapsLeadsProps) {
  // Navigation / Detail States
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Leads Storage States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);

  // Search Engine Form States
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [currentChip, setCurrentChip] = useState<string>("");
  const [searchStringsArray, setSearchStringsArray] = useState<string[]>(["restaurante", "cafeteria"]);
  const [servicioAVender, setServicioAVender] = useState<string>("");
  const [maxCrawledPlacesPerSearch, setMaxCrawledPlacesPerSearch] = useState<number>(100);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Search Banner State: 'idle' | 'searching' | 'finished'
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "finished">("idle");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Edit fields for Lead Detail
  const [editedAsunto, setEditedAsunto] = useState<string>("");
  const [editedCuerpo, setEditedCuerpo] = useState<string>("");

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fallback items in case the webhook has no initial entries or returns empty
  const getFallbackLeads = (): Lead[] => [
    {
      id: "fallback-1",
      nombre_negocio: "Bistró del Parque",
      estado_envio: "Pendiente",
      fecha_creacion: "2026-06-15T12:00:00.000Z",
      telefono: "+54 11 4802-9988",
      direccion: "Av. Libertador 4100, Palermo, Buenos Aires",
      website_url: "https://bistrodelparque-ficticio.com",
      instagram_url: "https://instagram.com/bistrodelparque",
      rating: 4.6,
      necesidad_detectada: "No cuenta con Facebook ni TikTok activa. Su sitio web actual muestra tiempos de carga altos y carece de llamado a la acción enfocado en conversión gastronómica.",
      asunto: "Propuesta de potenciar reservas en Bistró del Parque via Redes y Web",
      cuerpo: "Hola equipo de Bistró del Parque,\n\nEstaba viendo su excelente calificación de 4.6 estrellas en Google Maps y noté que no están aprovechando canales clave como Facebook o TikTok para conectar con más comensales en Palermo.\n\nDiseñé una estrategia de corto plazo para aumentar sus reservas semanales utilizando automatización y optimización de su embudo digital.\n\n¿Les interesaría coordinar una breve llamada de 5 minutos esta semana para presentárselas?\n\nSaludos atentos,\n[Tu Nombre]"
    },
    {
      id: "fallback-2",
      nombre_negocio: "Café Místico",
      estado_envio: "Enviado",
      fecha_creacion: "2026-06-14T09:30:00.000Z",
      telefono: "+54 11 5530-1122",
      direccion: "Gorriti 4390, Palermo, Buenos Aires",
      website_url: "https://cafemistico-ejemplo.com.ar",
      instagram_url: "https://instagram.com/cafemistico",
      facebook_url: "https://facebook.com/cafemistico",
      tiktok_url: "https://tiktok.com/@cafemistico",
      rating: 4.2,
      necesidad_detectada: "Cuenta con amplia presencia digital pero los enlaces de reservas de Instagram están rotos, provocando dispersión de tráfico caliente.",
      asunto: "Solución de embudo y optimización de reservas en Gorriti",
      cuerpo: "Hola,\n\nPasé por su gran local en Gorriti y soy fanático de su café de especialidad. Sin embargo, al intentar reservar una mesa desde su Instagram para un evento, el link de redirección arrojaba un error de carga.\n\nEsto les está haciendo perder clientes recurrentes de Palermo diariamente. He preparado un checklist rápido para solucionar esto y maximizar su conversión.\n\nQuedo a disposición,\n[Tu Nombre]"
    },
    {
      id: "fallback-3",
      nombre_negocio: "Gimnasio Atenas Palermo",
      estado_envio: "Respondido",
      fecha_creacion: "2026-06-10T15:10:00.000Z",
      telefono: "+54 11 3911-5020",
      direccion: "Honduras 5120, Palermo, Buenos Aires",
      website_url: "",
      instagram_url: "https://instagram.com/atenaspalermo",
      rating: 3.8,
      necesidad_detectada: "Falta absoluta de sitio web de aterrizaje y captación de matrículas. Dependen 100% de mensajes directos manuales poco optimizados.",
      asunto: "Sistema automático de captación de matrículas para Gimnasio Atenas",
      cuerpo: "Estimado Director de Atenas Palermo,\n\nIdentifiqué que actualmente no disponen de un sitio web optimizado para registrar nuevos alumnos, lo que sobrecarga su Instagram con consultas repetitivas de precios.\n\nPodemos digitalizar este onboarding con una landing page de alta velocidad que cierre inscripciones las 24 horas del día de manera automática.\n\n¿Hablamos esta semana?\n\nUn saludo,"
    },
    {
      id: "fallback-4",
      nombre_negocio: "Odontología Integral Gorriti",
      estado_envio: "Pendiente",
      fecha_creacion: "2026-06-16T18:45:00.000Z",
      telefono: "+54 11 4771-0012",
      direccion: "Gorriti 4800, Palermo, Buenos Aires",
      website_url: "https://odontogorriti.com",
      facebook_url: "https://facebook.com/odontogorriti",
      rating: 4.9,
      necesidad_detectada: "Rating alto (4.9) pero sin comunidad ni engagement en Instagram. No educan al paciente local sobre tratamientos estéticos de alto ticket.",
      asunto: "Estrategia de atracción de pacientes estéticos para Odontología Gorriti",
      cuerpo: "Hola Dr.,\n\nFelicitaciones por tan impecable reputación de 4.9 estrellas en Palermo. Es difícil encontrar clínicas con tal satisfacción de pacientes.\n\nAnalizando sus canales, vemos una gran oportunidad desaprovechada al no contar con Instagram para potenciar la recomendación social de tratamientos de implantes y estética.\n\nCompilamos un plan visual simple explicando cómo capturar 10 nuevos pacientes calificados al mes.\n\nAbrazo,"
    },
    {
      id: "fallback-5",
      nombre_negocio: "Sushi Flow",
      estado_envio: "Pendiente",
      fecha_creacion: "2026-06-17T11:22:15.000Z",
      telefono: "+54 11 4115-9900",
      direccion: "Fitz Roy 1840, Palermo, Buenos Aires",
      website_url: "",
      instagram_url: "https://instagram.com/sushiflow",
      facebook_url: "https://facebook.com/sushiflow",
      tiktok_url: "https://tiktok.com/@sushiflow",
      rating: 4.1,
      necesidad_detectada: "Falta canalización web para ordenar online de forma directa, dejándole 15% a 20% de comisión a plataformas intermediarias como PedidosYa.",
      asunto: "Ahorro de comisiones y sistema de reservas directas para Sushi Flow",
      cuerpo: "Hola Sushi Flow Fitz Roy,\n\nSu marca tiene un posicionamiento estético sobresaliente en Palermo. Sin embargo, no disponer de una web propia para pedidos directos les extrae un amplio porcentaje de rentabilidad en plataformas de delivery.\n\nPodemos armarles una tienda express propia integrada para retener a sus clientes leales gratis.\n\n¿Tendrán 5 minutos esta semana para analizar números?\n\nAtentamente,\n[Tu Nombre]"
    }
  ];

  // Fetch initial leads from Webhook
  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://romanparisi.online/webhook/c92746e9-38d3-4916-ba25-2c4763b08686", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id_usuario })
      });

      if (!response.ok) {
        throw new Error(`Servidor retorno código: ${response.status}`);
      }

      const data = await response.json();

      // Parse array from response flexibly
      let fetchedArray: Lead[] = [];
      if (Array.isArray(data)) {
        fetchedArray = data;
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.leads)) fetchedArray = data.leads;
        else if (Array.isArray(data.data)) fetchedArray = data.data;
        else if (Array.isArray(data.items)) fetchedArray = data.items;
      }

      // Normalizar campos: el backend manda "instagram", "facebook", "tiktok"
      // (y "website_url"). La interface usa "*_url" para todos, así que
      // aceptamos cualquiera de los dos nombres al llegar.
      fetchedArray = fetchedArray.map(normalizeLead);

      if (fetchedArray && fetchedArray.length > 0) {
        setLeads(fetchedArray);
        setIsUsingFallback(false);
      } else {
        // Log info and use rich fallback items so the app is immediately alive and gorgeous
        console.info("El webhook retornó una lista vacía. Preseteando leads de muestra locales.");
        setLeads(getFallbackLeads().map(normalizeLead));
        setIsUsingFallback(true);
      }
    } catch (err: any) {
      console.warn("Falla en consulta de webhook. Usando listado local para asegurar operatividad:", err);
      setError("No se pudo conectar con el servidor de leads en este momento. Hemos cargado leads simulados.");
      setLeads(getFallbackLeads().map(normalizeLead));
      setIsUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  // Acepta tanto "instagram" como "instagram_url" desde el backend y lo deja
  // siempre en la forma canónica de la interface.
  const normalizeLead = (raw: any): Lead => {
    if (!raw || typeof raw !== "object") return raw;
    const pickUrl = (...candidates: any[]): string | undefined => {
      for (const c of candidates) {
        if (typeof c === "string" && c.trim() !== "") return c;
      }
      return undefined;
    };
    return {
      ...raw,
      website_url: pickUrl(raw.website_url, raw.website, raw.web),
      instagram_url: pickUrl(raw.instagram_url, raw.instagram, raw.ig),
      facebook_url: pickUrl(raw.facebook_url, raw.facebook, raw.fb),
      tiktok_url: pickUrl(raw.tiktok_url, raw.tiktok, raw.tt)
    };
  };

  useEffect(() => {
    fetchLeads();
  }, [id_usuario]);

  // Handle Search Trigger animation
  const handleInitiateSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Armar el payload con los 4 parámetros pedidos al usuario
    const payload = {
      id_usuario,
      ciudad: locationQuery.trim(),
      servicio: servicioAVender.trim(),
      rubros: searchStringsArray,
      max_resultados: maxCrawledPlacesPerSearch
    };

    setIsSearching(true);
    setSearchStatus("searching");

    try {
      const response = await fetch("https://romanparisi.online/webhook/d8645069-3046-474c-831c-4e9a2fa336ce", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`El webhook respondió con código: ${response.status}`);
      }

      // Esperar confirmación antes de cerrar el banner
      setSearchStatus("finished");
      // Refrescar la tabla de leads ahora que el webhook terminó
      await fetchLeads();
    } catch (err) {
      console.error("Falló la búsqueda en el webhook:", err);
      setSearchStatus("finished");
    } finally {
      setIsSearching(false);
    }
  };

  // Restablecer el banner de búsqueda cuando el usuario cierre el aviso manualmente
  const dismissSearchBanner = () => {
    setSearchStatus("idle");
  };

  // Chips manipulation inside lead search engine
  const handleKeyDownChip = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = currentChip.trim().replace(/,/g, "");
      if (val && !searchStringsArray.includes(val)) {
        setSearchStringsArray([...searchStringsArray, val]);
        setCurrentChip("");
      }
    }
  };

  const removeChip = (indexToRemove: number) => {
    setSearchStringsArray(searchStringsArray.filter((_, idx) => idx !== indexToRemove));
  };

  // Toast Trigger Helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Lead detailing selections
  const openLeadDetails = (lead: Lead) => {
    setSelectedLead(normalizeLead(lead));
    setEditedAsunto(lead.asunto || "");
    setEditedCuerpo(lead.cuerpo || "");
  };

  const handleSaveLeadEdits = async () => {
    if (!selectedLead) return;

    // Build trigger request payload
    const updatedLeadId = selectedLead.id || selectedLead.id_lead || "unknown";
    const payload = {
      id_lead: updatedLeadId,
      asunto: editedAsunto,
      cuerpo: editedCuerpo
    };

    // Trigger Fire-and-forget POST
    try {
      fetch("https://romanparisi.online/webhook/9c05bd5d-d444-4e36-a2a3-03cda855ecd7", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }).catch(e => console.error("Fondo de envío falló de forma silente por diseño:", e));
    } catch (e) {
      // Ignoramos errores por ser un canal fire-and-forget
    }

    // Update state locally so UI keeps the state modified during current session
    setLeads(prev => prev.map(item => {
      const matchId = item.id || item.id_lead;
      if (matchId === updatedLeadId) {
        return {
          ...item,
          asunto: editedAsunto,
          cuerpo: editedCuerpo
        };
      }
      return item;
    }));

    // Trigger Toast confirmation immediately
    showToast("💾 ¡Mensaje guardado exitosamente! Notificación enviada al webhook.");

    // Smoothly go back
    setSelectedLead(null);
  };

  // Pagination Helpers
  const totalPages = Math.ceil(leads.length / itemsPerPage);
  const currentLeads = leads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status?: string) => {
    const s = (status || "Pendiente").toLowerCase();
    switch (s) {
      case "enviado":
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">Enviado</span>;
      case "respondido":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">Respondido</span>;
      case "pendiente":
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">Pendiente</span>;
    }
  };

  const getFriendlyDate = (dateStr?: string) => {
    if (!dateStr) return "Ver hoy";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const dia = date.getDate();
      const mes = meses[date.getMonth()];
      const anio = date.getFullYear();
      return `${dia} ${mes} ${anio}`;
    } catch {
      return dateStr;
    }
  };

  // Rating Stars Builder
  const renderStars = (ratingNum?: string | number) => {
    const r = parseFloat(String(ratingNum || 0)) || 0;
    const rounded = Math.round(r);
    return (
      <div className="flex items-center gap-1 font-sans">
        <div className="flex text-amber-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < rounded ? "fill-amber-400" : "text-slate-200"}`} />
          ))}
        </div>
        <span className="text-xs font-bold text-slate-600 ml-1">({r.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Toast Notification element with AnimatePresence */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-900 px-5 py-3.5 shadow-xl text-white text-sm font-medium border border-slate-700"
          >
            <div className="h-2 w-2 rounded-full bg-[#4f39fb] animate-pulse" />
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!selectedLead ? (
          /* ========================================================== */
          /*                       VISTA PRINCIPAL                      */
          /* ========================================================== */
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* INGENIO DE BUSQUEDA CARD */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#4f39fb] shrink-0" />
                    Buscador Inteligente de Google Maps
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Define la ubicación y categorías de negocios que deseas mapear para extraer leads calificados.
                  </p>
                </div>
              </div>

              <form onSubmit={handleInitiateSearch} className="space-y-3">
                <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span className="flex-1">Ciudad</span>
                  <span className="flex-1">Servicio</span>
                  <span className="flex-[2]">Rubros</span>
                  <span className="w-20 text-center">Límite</span>
                  <span className="w-28" />
                </div>

                <div className="flex flex-col md:flex-row md:items-stretch gap-2">
                  {/* Location */}
                  <div className="relative flex-1 min-w-0">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <Map className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      id="locationQuery"
                      className="w-full h-10 bg-slate-50 rounded-lg border border-slate-200 pl-9 pr-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#4f39fb]/20 focus:border-[#4f39fb] outline-none transition-all font-medium"
                      placeholder="Ciudad (ej: Palermo, Buenos Aires)"
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                    />
                  </div>

                  {/* Servicio */}
                  <div className="relative flex-1 min-w-0">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      id="servicio_a_vender"
                      className="w-full h-10 bg-slate-50 rounded-lg border border-slate-200 pl-9 pr-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#4f39fb]/20 focus:border-[#4f39fb] outline-none transition-all font-medium"
                      placeholder="Servicio a ofrecer"
                      value={servicioAVender}
                      onChange={(e) => setServicioAVender(e.target.value)}
                    />
                  </div>

                  {/* Rubros (chips) */}
                  <div className="flex-[2] min-w-0 h-10 bg-slate-50 rounded-lg border border-slate-200 px-2 text-sm text-slate-800 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#4f39fb]/20 focus-within:border-[#4f39fb] outline-none transition-all flex items-center gap-1.5 overflow-x-auto">
                    {searchStringsArray.map((chip, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 rounded-md bg-[#4f39fb]/10 px-2 py-0.5 text-xs font-semibold text-[#4f39fb] border border-[#4f39fb]/20 shrink-0"
                      >
                        {chip}
                        <button
                          type="button"
                          onClick={() => removeChip(index)}
                          className="text-[#4f39fb]/60 hover:text-[#4f39fb] transition-colors"
                          aria-label={`Quitar ${chip}`}
                        >
                          <X className="h-3 w-3 shrink-0" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={currentChip}
                      onChange={(e) => setCurrentChip(e.target.value)}
                      onKeyDown={handleKeyDownChip}
                      className="flex-1 min-w-[120px] bg-transparent border-none py-0 px-1 text-sm outline-none placeholder:text-slate-400 font-medium"
                      placeholder={searchStringsArray.length ? "Añadir rubro…" : "Rubros (Enter para añadir)"}
                    />
                  </div>

                  {/* Límite */}
                  <div className="relative w-full md:w-20 shrink-0">
                    <input
                      type="number"
                      id="maxCrawledPlacesPerSearch"
                      max={100}
                      min={1}
                      className="w-full h-10 bg-slate-50 rounded-lg border border-slate-200 px-3 text-sm text-slate-800 text-center focus:bg-white focus:ring-2 focus:ring-[#4f39fb]/20 focus:border-[#4f39fb] outline-none transition-all font-mono font-semibold"
                      value={maxCrawledPlacesPerSearch}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(1, Number(e.target.value) || 1));
                        setMaxCrawledPlacesPerSearch(val);
                      }}
                    />
                  </div>

                  {/* Botón Buscar */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="h-10 px-4 rounded-lg bg-[#4f39fb] hover:bg-[#4f39fb]/90 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 w-full md:w-28"
                  >
                    {isSearching ? (
                      <>
                        <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
                        Buscando…
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 shrink-0" />
                        Buscar
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>

            {/* BANNER DE ESTADO DE BÚSQUEDA */}
            <AnimatePresence>
              {searchStatus !== "idle" && (
                <motion.div
                  key="search-banner"
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className={`rounded-2xl border p-5 md:p-6 shadow-sm flex items-center gap-4 ${
                    searchStatus === "searching"
                      ? "border-[#4f39fb]/30 bg-[#4f39fb]/5"
                      : "border-emerald-200 bg-emerald-50/60"
                  }`}
                >
                  {searchStatus === "searching" ? (
                    <>
                      <div className="relative h-12 w-12 shrink-0 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-[#4f39fb]/20" />
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#4f39fb] border-r-[#4f39fb] animate-spin" />
                        <Search className="h-5 w-5 text-[#4f39fb]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#4f39fb]">
                          La búsqueda ha iniciado, no abandone.
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">
                          Estamos extrayendo leads en Google Maps con los parámetros que indicaste. Esto puede tardar unos minutos.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-12 w-12 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Check className="h-6 w-6 text-emerald-600 stroke-[3px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-emerald-800">
                          ¡Búsqueda terminada! Encuentre sus nuevos leads debajo y la campaña nueva en su Dashboard.
                        </p>
                        <p className="text-xs text-emerald-700/80 mt-0.5 font-medium">
                          El procesamiento en Google Maps se completó con éxito.
                        </p>
                      </div>
                      <button
                        onClick={dismissSearchBanner}
                        className="p-2 text-emerald-700/60 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                        aria-label="Cerrar aviso de búsqueda"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* SECTOR DE LEADS INFERIOR */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Leads conseguidos hasta ahora:
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {isUsingFallback 
                      ? "Mostrando leads de muestra. Conecta una base de datos real con el webhook para poblar tu lista." 
                      : "Listado de prospectos comerciales del buscador."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={fetchLeads} 
                    className="p-2 text-slate-400 hover:text-[#4f39fb] rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                    title="Actualizar listado de leads"
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4.5 w-4.5 ${loading ? "animate-spin text-[#4f39fb]" : ""}`} />
                  </button>
                  <span className="text-xs font-mono font-extrabold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60">
                    Total: {leads.length} Leads
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <div className="h-8 w-8 rounded-full border-2 border-[#4f39fb] border-t-transparent animate-spin" style={{ borderColor: "#4f39fb transparent #4f39fb transparent" }} />
                  <p className="text-xs font-medium text-slate-500">Recuperando registros de Maps...</p>
                </div>
              ) : leads.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <p className="text-sm font-semibold text-slate-600">No se encontraron leads cargados.</p>
                  <p className="text-xs text-slate-400">Prueba iniciar una búsqueda de extracción para comenzar.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Leads Grid/Table structure */}
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                          <th className="py-3 px-5">Negocio</th>
                          <th className="py-3 px-5">Estado de Envío</th>
                          <th className="py-3 px-5">Fecha de Extracción</th>
                          <th className="py-3 px-5 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentLeads.map((lead, idx) => {
                          const name = lead.nombre_negocio || lead.nombre || "Comercio sin nombre";
                          const docDate = lead.fecha_creacion || lead.creado_en;
                          return (
                            <tr 
                              key={lead.id || lead.id_lead || idx}
                              onClick={() => openLeadDetails(lead)} 
                              className="hover:bg-slate-50/75 cursor-pointer transition-colors duration-150 group"
                            >
                              <td className="py-4 px-5">
                                <span className="text-slate-900 font-semibold group-hover:text-[#4f39fb] transition-colors text-sm">
                                  {name}
                                </span>
                              </td>
                              <td className="py-4 px-5">
                                {getStatusBadge(lead.estado_envio || lead.estado)}
                              </td>
                              <td className="py-4 px-5 text-xs text-slate-500 font-semibold">
                                {getFriendlyDate(docDate)}
                              </td>
                              <td className="py-4 px-5 text-right">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4f39fb] hover:bg-[#4f39fb] hover:shadow-md text-white text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap">
                                  Editar & Analizar
                                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination control */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-5 text-sm text-slate-500">
                      <span>Página <b>{currentPage}</b> de <b>{totalPages}</b></span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                        >
                          <ChevronRight className="h-4 w-4 text-slate-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ========================================================== */
          /*                     VISTA DE DETALLES                      */
          /* ========================================================== */
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Header / Nav-back */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setSelectedLead(null)}
                className="inline-flex w-fit items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al listado
              </button>
              <div className="flex items-center justify-between gap-4 border-b border-slate-150 pb-4">
                <h2 className="text-2xl font-bold font-sans tracking-tight text-slate-900">
                  {selectedLead.nombre_negocio || selectedLead.nombre || "Detalle del Lead"}
                </h2>
                <span>{getStatusBadge(selectedLead.estado_envio || selectedLead.estado)}</span>
              </div>
            </div>

            {/* Information Grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT & DEFAULTS - META DETAILS */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Cuadros de Información card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                    Información Comercial
                  </h4>

                  <div className="space-y-3.5 text-slate-800">
                    {/* Teléfono */}
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Teléfono</p>
                        <p className="text-xs font-semibold text-slate-800 select-all truncate">
                          {selectedLead.telefono || "No especificado"}
                        </p>
                      </div>
                    </div>

                    {/* Dirección */}
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <Map className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Dirección</p>
                        <p className="text-xs font-medium text-slate-800 leading-tight">
                          {selectedLead.direccion || "No especificada"}
                        </p>
                      </div>
                    </div>

                    {/* Sitios Web */}
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Sitio Web</p>
                        {selectedLead.website_url ? (
                          <a 
                            href={selectedLead.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-[#4f39fb] hover:underline inline-flex items-center gap-1 max-w-full"
                          >
                            <span className="truncate">{selectedLead.website_url}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          <p className="text-xs font-semibold text-slate-400">Sin sitio web</p>
                        )}
                      </div>
                    </div>

                    {/* Rating comercial */}
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Reputación en Google</p>
                        <div className="text-xs font-semibold mt-0.5">
                          {renderStars(selectedLead.rating)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Indicadores Digitales: URL-based */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                    Canales de Contacto Identificados
                  </h4>

                  <div className="grid grid-cols-2 gap-3">

                    {/* Website indicator */}
                    {(() => {
                      const has = Boolean(selectedLead.website_url);
                      const cardBase = "p-3.5 rounded-xl border flex flex-col items-center justify-center text-center space-y-1.5 transition-all";
                      const activeStyle = "bg-emerald-50/50 border-emerald-100 text-emerald-800 hover:bg-emerald-50 cursor-pointer";
                      const inactiveStyle = "bg-slate-50 border-slate-150 text-slate-400";
                      const Wrapper: any = has ? motion.a : "div";
                      const wrapperProps = has
                        ? {
                            href: selectedLead.website_url,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            whileTap: { scale: 0.97 }
                          }
                        : {};
                      return (
                        <Wrapper
                          className={`${cardBase} ${has ? activeStyle : inactiveStyle}`}
                          {...wrapperProps}
                        >
                          <Globe className={`h-5 w-5 ${has ? "text-emerald-600" : "text-slate-300"}`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Sitio Web</span>
                          {has ? (
                            <div className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                              <Check className="h-2.5 w-2.5 stroke-[3px]" /> SÍ
                            </div>
                          ) : (
                            <div className="bg-slate-200/60 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded">NO</div>
                          )}
                        </Wrapper>
                      );
                    })()}

                    {/* Instagram indicator */}
                    {(() => {
                      const url = selectedLead.instagram_url;
                      const has = Boolean(url);
                      const cardBase = "p-3.5 rounded-xl border flex flex-col items-center justify-center text-center space-y-1.5 transition-all";
                      const activeStyle = "bg-emerald-50/50 border-emerald-100 text-emerald-800 hover:bg-emerald-50 cursor-pointer";
                      const inactiveStyle = "bg-slate-50 border-slate-150 text-slate-400";
                      const Wrapper: any = has ? motion.a : "div";
                      const wrapperProps = has
                        ? {
                            href: url,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            whileTap: { scale: 0.97 }
                          }
                        : {};
                      return (
                        <Wrapper
                          className={`${cardBase} ${has ? activeStyle : inactiveStyle}`}
                          {...wrapperProps}
                        >
                          <Instagram className={`h-5 w-5 ${has ? "text-pink-600" : "text-slate-300"}`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Instagram</span>
                          {has ? (
                            <div className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                              <Check className="h-2.5 w-2.5 stroke-[3px]" /> SÍ
                            </div>
                          ) : (
                            <div className="bg-slate-200/60 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded">NO</div>
                          )}
                        </Wrapper>
                      );
                    })()}

                    {/* Facebook indicator */}
                    {(() => {
                      const url = selectedLead.facebook_url;
                      const has = Boolean(url);
                      const cardBase = "p-3.5 rounded-xl border flex flex-col items-center justify-center text-center space-y-1.5 transition-all";
                      const activeStyle = "bg-emerald-50/50 border-emerald-100 text-emerald-800 hover:bg-emerald-50 cursor-pointer";
                      const inactiveStyle = "bg-slate-50 border-slate-150 text-slate-400";
                      const Wrapper: any = has ? motion.a : "div";
                      const wrapperProps = has
                        ? {
                            href: url,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            whileTap: { scale: 0.97 }
                          }
                        : {};
                      return (
                        <Wrapper
                          className={`${cardBase} ${has ? activeStyle : inactiveStyle}`}
                          {...wrapperProps}
                        >
                          <Facebook className={`h-5 w-5 ${has ? "text-blue-600" : "text-slate-300"}`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Facebook</span>
                          {has ? (
                            <div className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                              <Check className="h-2.5 w-2.5 stroke-[3px]" /> SÍ
                            </div>
                          ) : (
                            <div className="bg-slate-200/60 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded">NO</div>
                          )}
                        </Wrapper>
                      );
                    })()}

                    {/* TikTok indicator */}
                    {(() => {
                      const url = selectedLead.tiktok_url;
                      const has = Boolean(url);
                      const cardBase = "p-3.5 rounded-xl border flex flex-col items-center justify-center text-center space-y-1.5 transition-all";
                      const activeStyle = "bg-emerald-50/50 border-emerald-100 text-emerald-800 hover:bg-emerald-50 cursor-pointer";
                      const inactiveStyle = "bg-slate-50 border-slate-150 text-slate-400";
                      const Wrapper: any = has ? motion.a : "div";
                      const wrapperProps = has
                        ? {
                            href: url,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            whileTap: { scale: 0.97 }
                          }
                        : {};
                      return (
                        <Wrapper
                          className={`${cardBase} ${has ? activeStyle : inactiveStyle}`}
                          {...wrapperProps}
                        >
                          <Video className={`h-5 w-5 ${has ? "text-rose-600" : "text-slate-300"}`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">TikTok</span>
                          {has ? (
                            <div className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                              <Check className="h-2.5 w-2.5 stroke-[3px]" /> SÍ
                            </div>
                          ) : (
                            <div className="bg-slate-200/60 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded">NO</div>
                          )}
                        </Wrapper>
                      );
                    })()}

                  </div>
                </div>

              </div>

              {/* RIGHT SIDE - EDITOR & DIAGNOSTIC */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Cuadro destacado de necesidad_detectada */}
                <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 shadow-inner space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                    <HelpCircle className="h-4 w-4 shrink-0" />
                    Necesidad Detectada por IA
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    {selectedLead.necesidad_detectada || "Ninguna necesidad específica reportada. Este comercio tiene una buena cobertura digital."}
                  </p>
                </div>

                {/* AREA DE EDICIÓN - PROTAGONISTA CENTRAL */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-5">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Mail className="h-5 w-5 text-[#4f39fb] shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Configurador de Propuesta de Cold Email</h4>
                      <p className="text-xs text-slate-500">Personaliza la propuesta para este comercio antes de enviar la secuencia.</p>
                    </div>
                  </div>

                  {/* Input de Asunto */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="leadAsunto">
                      Asunto del Correo
                    </label>
                    <input
                      type="text"
                      id="leadAsunto"
                      value={editedAsunto}
                      onChange={(e) => setEditedAsunto(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm text-slate-800 focus:ring-2 focus:ring-[#4f39fb]/20 focus:border-[#4f39fb] outline-none transition-all font-semibold font-sans bg-slate-50/50"
                      placeholder="Tema / Título de la propuesta comercial..."
                    />
                  </div>

                  {/* Textarea de Cuerpo */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="leadCuerpo">
                      Cuerpo del Correo (Propuesta Completa)
                    </label>
                    <textarea
                      id="leadCuerpo"
                      rows={12}
                      value={editedCuerpo}
                      onChange={(e) => setEditedCuerpo(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-800 focus:ring-2 focus:ring-[#4f39fb]/20 focus:border-[#4f39fb] outline-none transition-all font-sans leading-relaxed bg-slate-50/50 resize-y"
                      placeholder="Redacta los argumentos de atracción clave para captar la atención de este negocio..."
                    />
                  </div>

                  {/* Acciones de Edición */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setSelectedLead(null)}
                      className="px-5 py-3 border border-slate-200 rounded-xl text-slate-500 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveLeadEdits}
                      className="px-6 py-3 bg-[#4f39fb] hover:bg-[#4f39fb] hover:shadow-lg hover:shadow-[#4f39fb]/30 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      Guardar
                    </button>
                  </div>

                </div>

              </div>
              
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
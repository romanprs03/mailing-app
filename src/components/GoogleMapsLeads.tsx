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
  nombre_campana?: string;
  estado_envio?: string;
  estado?: string;
  fecha_creacion?: string;
  creado_en?: string;
  telefono?: string;
  direccion?: string;
  rating?: string | number;
  email?: string;
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

  // Search Engine Form States
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [currentChip, setCurrentChip] = useState<string>("");
  const [searchStringsArray, setSearchStringsArray] = useState<string[]>(["restaurante", "cafeteria"]);
  const [servicioAVender, setServicioAVender] = useState<string>("");
  const [maxCrawledPlacesPerSearch, setMaxCrawledPlacesPerSearch] = useState<number>(50);

  // Tope dinámico: 100 dividido entre la cantidad de rubros seleccionados.
  const maxPorRubro = searchStringsArray.length > 0 ? Math.floor(100 / searchStringsArray.length) : 100;

  // Search Banner State: 'idle' | 'searching' | 'finished'
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "finished">("idle");
  // Refresco manual del banner (botón "ver mis nuevos leads")
  const [bannerRefreshing, setBannerRefreshing] = useState<boolean>(false);
  // Cantidad de leads que había antes de iniciar la búsqueda y cuántos esperamos
  const [leadsBeforeSearch, setLeadsBeforeSearch] = useState<number>(0);
  const [expectedNewLeads, setExpectedNewLeads] = useState<number>(0);

  // Filtro de búsqueda dentro del listado de leads
  const [filterTerm, setFilterTerm] = useState<string>("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Edit fields for Lead Detail
  const [editedAsunto, setEditedAsunto] = useState<string>("");
  const [editedCuerpo, setEditedCuerpo] = useState<string>("");

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      // Si no hay nada, dejamos la lista vacía (solo datos reales de la base).
      setLeads(fetchedArray.map(normalizeLead));
    } catch (err: any) {
      console.error("Falla en consulta de webhook de leads:", err);
      setError("No se pudo conectar con el servidor de leads en este momento. Intenta actualizar en unos instantes.");
      setLeads([]);
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
      tiktok_url: pickUrl(raw.tiktok_url, raw.tiktok, raw.tt),
      email: pickUrl(raw.email, raw.mail, raw.correo)
    };
  };

  useEffect(() => {
    fetchLeads();
  }, [id_usuario]);

  // Mantener la "cantidad por rubro" dentro del tope cuando cambian los rubros.
  useEffect(() => {
    setMaxCrawledPlacesPerSearch((prev) => Math.min(Math.max(1, prev), maxPorRubro));
  }, [maxPorRubro]);

  // Mientras la búsqueda está en curso, cada vez que se actualiza la lista de
  // leads (vía el botón de recarga) comprobamos si ya llegaron todos los
  // esperados (cantidad por rubro * cantidad de rubros).
  useEffect(() => {
    if (
      searchStatus === "searching" &&
      expectedNewLeads > 0 &&
      leads.length - leadsBeforeSearch >= expectedNewLeads
    ) {
      setSearchStatus("finished");
    }
  }, [leads, searchStatus, expectedNewLeads, leadsBeforeSearch]);

  // Handle Search Trigger animation
  const handleInitiateSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Armar el payload con los 4 parámetros pedidos al usuario
    const payload = {
      id_usuario,
      ciudad: locationQuery.trim(),
      servicio: servicioAVender.trim(),
      rubros: searchStringsArray,
      max_resultados: maxCrawledPlacesPerSearch
    };

    // Recordar el estado actual para detectar luego cuándo terminó la carga.
    setLeadsBeforeSearch(leads.length);
    setExpectedNewLeads(maxCrawledPlacesPerSearch * searchStringsArray.length);
    setSearchStatus("searching");

    // Fire-and-forget: el webhook de extracción puede tardar mucho y dar
    // timeout, así que NO esperamos su respuesta. El usuario va recargando con
    // el botón del banner para traer los leads a medida que se generan.
    try {
      fetch("https://romanparisi.online/webhook/d8645069-3046-474c-831c-4e9a2fa336ce", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }).catch((err) => console.error("Falló el disparo de búsqueda en el webhook:", err));
    } catch (err) {
      console.error("Falló el disparo de búsqueda en el webhook:", err);
    }
  };

  // Botón del banner: recarga la lista de leads llamando al webhook de carga.
  const handleBannerRefresh = async () => {
    setBannerRefreshing(true);
    try {
      await fetchLeads();
    } finally {
      setBannerRefreshing(false);
    }
  };

  // Restablecer el banner de búsqueda cuando el usuario cierre el aviso manualmente
  const dismissSearchBanner = () => {
    setSearchStatus("idle");
  };

  // Chips manipulation inside lead search engine
  const handleKeyDownChip = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Se confirma un rubro con Enter, coma o barra espaciadora.
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      const val = currentChip.trim().replace(/[,\s]/g, "");
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
  // Filtrado: busca el término en cualquier valor (string/número) del lead.
  const normalizedFilter = filterTerm.trim().toLowerCase();
  const filteredLeads = normalizedFilter
    ? leads.filter((lead) =>
        Object.values(lead).some((value) => {
          if (value === null || value === undefined) return false;
          if (typeof value === "string" || typeof value === "number") {
            return String(value).toLowerCase().includes(normalizedFilter);
          }
          return false;
        })
      )
    : leads;

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const currentLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Si el filtro reduce las páginas por debajo de la actual, volvemos a la 1.
  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedFilter]);

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
                  <span className="w-28 text-center">Cantidad por rubro</span>
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
                      placeholder={searchStringsArray.length ? "Añadir rubro (espacio o coma)…" : "Rubros (espacio o coma para añadir)"}
                    />
                  </div>

                  {/* Cantidad por rubro (tope: 100 / cantidad de rubros) */}
                  <div className="relative w-full md:w-28 shrink-0">
                    <input
                      type="number"
                      id="maxCrawledPlacesPerSearch"
                      max={maxPorRubro}
                      min={1}
                      title={`Tope: ${maxPorRubro} por rubro (100 / ${searchStringsArray.length || 1} rubros)`}
                      className="w-full h-10 bg-slate-50 rounded-lg border border-slate-200 px-3 text-sm text-slate-800 text-center focus:bg-white focus:ring-2 focus:ring-[#4f39fb]/20 focus:border-[#4f39fb] outline-none transition-all font-mono font-semibold"
                      value={maxCrawledPlacesPerSearch}
                      onChange={(e) => {
                        const val = Math.min(maxPorRubro, Math.max(1, Number(e.target.value) || 1));
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
                    {searchStatus === "searching" ? (
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

                <p className="text-[11px] text-slate-400 px-1">
                  Tope de <b className="text-slate-500 font-semibold">{maxPorRubro}</b> negocios por rubro
                  {" "}(100 ÷ {searchStringsArray.length || 1} {searchStringsArray.length === 1 ? "rubro" : "rubros"}).
                  Confirma cada rubro con barra espaciadora o coma.
                </p>
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
                        <Sparkles className="h-5 w-5 text-[#4f39fb]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#4f39fb]">
                          Generando leads… puede tardar unos minutos.
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">
                          Presione el botón para traer sus nuevos leads a medida que se cargan.
                          {expectedNewLeads > 0 && (
                            <>
                              {" "}Nuevos cargados:{" "}
                              <b className="text-[#4f39fb]">
                                {Math.max(0, leads.length - leadsBeforeSearch)}/{expectedNewLeads}
                              </b>.
                            </>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={handleBannerRefresh}
                        disabled={bannerRefreshing}
                        className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#4f39fb] hover:bg-[#4f39fb]/90 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-60"
                      >
                        <RefreshCw className={`h-4 w-4 shrink-0 ${bannerRefreshing ? "animate-spin" : ""}`} />
                        Ver mis nuevos leads
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="h-12 w-12 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Check className="h-6 w-6 text-emerald-600 stroke-[3px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-emerald-800">
                          ¡Ya se subieron todos los leads! Encuéntrelos en el listado de abajo.
                        </p>
                        <p className="text-xs text-emerald-700/80 mt-0.5 font-medium">
                          Se cargaron los {expectedNewLeads} leads de esta búsqueda. La campaña nueva ya está en su Dashboard.
                        </p>
                      </div>
                      <button
                        onClick={dismissSearchBanner}
                        className="p-2 text-emerald-700/60 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer self-start"
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
              <div className="space-y-4 border-b border-slate-100 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Leads conseguidos hasta ahora:
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Listado de prospectos comerciales del buscador.
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
                      {normalizedFilter ? `${filteredLeads.length} / ${leads.length}` : `Total: ${leads.length}`} Leads
                    </span>
                  </div>
                </div>

                {/* Buscador: filtra por cualquier parámetro del lead */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    placeholder="Buscar por negocio, campaña, email, estado, dirección, teléfono…"
                    className="w-full h-10 bg-slate-50 rounded-lg border border-slate-200 pl-9 pr-9 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#4f39fb]/20 focus:border-[#4f39fb] outline-none transition-all font-medium"
                  />
                  {filterTerm && (
                    <button
                      type="button"
                      onClick={() => setFilterTerm("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <div className="h-8 w-8 rounded-full border-2 border-[#4f39fb] border-t-transparent animate-spin" style={{ borderColor: "#4f39fb transparent #4f39fb transparent" }} />
                  <p className="text-xs font-medium text-slate-500">Recuperando registros de Maps...</p>
                </div>
              ) : leads.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  {error ? (
                    <>
                      <p className="text-sm font-semibold text-rose-600">{error}</p>
                      <button
                        onClick={fetchLeads}
                        className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold text-[#4f39fb] hover:underline cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Reintentar
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-slate-600">Todavía no hay leads cargados.</p>
                      <p className="text-xs text-slate-400">Inicia una búsqueda de extracción para comenzar a poblar tu lista.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Leads Grid/Table structure */}
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                          <th className="py-3 px-5">Negocio</th>
                          <th className="py-3 px-5">Campaña</th>
                          <th className="py-3 px-5">Estado de Envío</th>
                          <th className="py-3 px-5">Fecha de Extracción</th>
                          <th className="py-3 px-5 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentLeads.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center">
                              <p className="text-sm font-semibold text-slate-600">Sin coincidencias</p>
                              <p className="text-xs text-slate-400 mt-1">
                                Ningún lead coincide con “{filterTerm}”. Probá con otro término.
                              </p>
                            </td>
                          </tr>
                        ) : currentLeads.map((lead, idx) => {
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
                                {lead.nombre_campana ? (
                                  <span className="inline-flex items-center rounded-md bg-[#4f39fb]/10 px-2.5 py-1 text-xs font-semibold text-[#4f39fb] border border-[#4f39fb]/20">
                                    {lead.nombre_campana}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
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

                    {/* Email de contacto (recibido por webhook con el nombre "email") */}
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Email</p>
                        {selectedLead.email ? (
                          <a
                            href={`mailto:${selectedLead.email}`}
                            className="text-xs font-semibold text-[#4f39fb] hover:underline truncate block select-all"
                          >
                            {selectedLead.email}
                          </a>
                        ) : (
                          <p className="text-xs font-semibold text-slate-400">No especificado</p>
                        )}
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
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Search, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  Type, 
  Send, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Mail
} from "lucide-react";

interface ReenviosProps {
  id_usuario: string | null;
}

interface LeadResponse {
  email: string;
  nombre?: string;
  empresa?: string;
  puesto?: string;
  [key: string]: any;
}

export default function Reenvios({ id_usuario }: ReenviosProps) {
  // Configuración de búsqueda
  const [cantidad, setCantidad] = useState("15");
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadResponse[]>([]);
  const [leadsSeleccionados, setLeadsSeleccionados] = useState<Record<string, boolean>>({});

  // Buscador y Paginación
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Paso actual: 1 para búsqueda/selección, 2 para definición de campaña
  const [paso, setPaso] = useState<1 | 2>(1);

  // Formulario del Paso 2
  const [nombreCampana, setNombreCampana] = useState("");
  const [nombreRemitente, setNombreRemitente] = useState("");
  const [asunto, setAsunto] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [useHtmlEditor, setUseHtmlEditor] = useState(false);
  
  // Estado de despliegue
  const [desplegando, setDesplegando] = useState(false);
  const [errorDespliegue, setErrorDespliegue] = useState<string | null>(null);
  const [exitoDespliegue, setExitoDespliegue] = useState(false);

  // Buscar leads
  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id_usuario) return;

    setBuscando(true);
    setErrorBusqueda(null);
    setLeads([]);
    setSearchQuery("");
    setCurrentPage(1);

    try {
      const response = await fetch("https://romanparisi.online/webhook/88e1af56-f186-4b1b-b69a-c54750f2e123", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_usuario,
          cantidad_tiempo: Number(cantidad) || 0
        })
      });

      if (!response.ok) {
        throw new Error(`Error en servidor: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.status === "no_leads") {
        setErrorBusqueda("No se encontraron leads para esa búsqueda.");
        setLeads([]);
        return;
      }

      const loadedLeads: LeadResponse[] = Array.isArray(data) ? data : (data.leads || []);
      
      setLeads(loadedLeads);
      
      // Marcar todos por defecto activados
      const initialSelection: Record<string, boolean> = {};
      loadedLeads.forEach((lead, idx) => {
        const emailKey = lead.email_lead || lead.email || `lead-${idx}`;
        initialSelection[emailKey] = true;
      });
      setLeadsSeleccionados(initialSelection);

      if (loadedLeads.length === 0) {
        setErrorBusqueda("No se encontraron leads para esa búsqueda.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorBusqueda("Ocurrió un error al intentar recuperar los leads para reenvío.");
    } finally {
      setBuscando(false);
    }
  };

  // Alternar selección individual
  const toggleSelectLead = (email: string) => {
    setLeadsSeleccionados(prev => ({
      ...prev,
      [email]: !prev[email]
    }));
  };

  // Filtrado de leads por buscador
  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    
    const emailStr = (lead.email_lead || lead.email || "").toLowerCase();
    const nombreStr = (lead.nombre || "").toLowerCase();
    const empresaStr = (lead.empresa || "").toLowerCase();
    const puestoStr = (lead.puesto || "").toLowerCase();
    
    return emailStr.includes(q) || nombreStr.includes(q) || empresaStr.includes(q) || puestoStr.includes(q);
  });

  // Alternar selección de todos los leads del listado filtrado
  const toggleAllLeads = () => {
    const allFilteredSelected = filteredLeads.length > 0 && 
      filteredLeads.every((lead, idx) => {
        const emailKey = lead.email_lead || lead.email || `lead-${idx}`;
        return !!leadsSeleccionados[emailKey];
      });
      
    const newSelection = { ...leadsSeleccionados };
    filteredLeads.forEach((lead, idx) => {
      const emailKey = lead.email_lead || lead.email || `lead-${idx}`;
      newSelection[emailKey] = !allFilteredSelected;
    });
    setLeadsSeleccionados(newSelection);
  };

  // Leads listos para reenviar (los marcados con checkbox/switch "Envío" en true)
  const leadsFiltradosParaEnviar = leads.filter((l, idx) => {
    const emailKey = l.email_lead || l.email || `lead-${idx}`;
    return leadsSeleccionados[emailKey];
  });

  // Avanzar al paso de creación de campaña
  const handleSiguiente = () => {
    if (leadsFiltradosParaEnviar.length === 0) {
      alert("Selecciona al menos un lead para continuar con la campaña de reenvío.");
      return;
    }
    setPaso(2);
  };

  // Desplegar campaña de reenvío
  const handleDesplegarReenvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id_usuario) return;
    if (!nombreCampana || !nombreRemitente || !asunto || !cuerpo) {
      setErrorDespliegue("Por favor, completa todos los campos del correo outreach.");
      return;
    }

    setDesplegando(true);
    setErrorDespliegue(null);

    try {
      const response = await fetch("https://romanparisi.online/webhook/db3688eb-1c94-4a33-90c4-6dc8e66d3a47", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id_usuario,
          nombre_campana: nombreCampana,
          nombre_remitente: nombreRemitente,
          asunto: asunto,
          cuerpo: cuerpo,
          formato_html: useHtmlEditor,
          leads: leadsFiltradosParaEnviar
        })
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.status}`);
      }

      setExitoDespliegue(true);
    } catch (err: any) {
      console.error(err);
      setErrorDespliegue("Error al desplegar la campaña de reenvío. Verifica la conexión.");
    } finally {
      setDesplegando(false);
    }
  };

  // Resetear estados para una nueva campaña
  const handleReset = () => {
    setPaso(1);
    setLeads([]);
    setLeadsSeleccionados({});
    setSearchQuery("");
    setCurrentPage(1);
    setNombreCampana("");
    setNombreRemitente("");
    setAsunto("");
    setCuerpo("");
    setExitoDespliegue(false);
    setErrorDespliegue(null);
  };

  // Parámetros de paginación
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * itemsPerPage;
  const leadsToDisplay = filteredLeads.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Indicador de Pasos del Wizard */}
      {!exitoDespliegue && (
        <div className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm" id="reenvios_wizard_steps">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm">
              🚀
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Campaña de Reenvío Inteligente</h2>
              <p className="text-[11px] text-slate-400 font-medium">Automatiza el seguimiento secuencial con tus leads</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full transition-colors ${
              paso === 1 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
            }`}>
              1. Filtrar Leads
            </span>
            <ArrowRight className="h-3 w-3 text-slate-300" />
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full transition-colors ${
              paso === 2 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
            }`}>
              2. Diseñar Campaña
            </span>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {exitoDespliegue ? (
          <motion.div
            key="success-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-12 border border-emerald-100 bg-white rounded-3xl text-center shadow-lg"
            id="success_panel"
          >
            <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 border border-emerald-200">
              <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-950 font-sans tracking-tight">
              ¡Campaña de Reenvío Desplegada!
            </h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md font-sans">
              La campaña de reenvío <strong className="text-slate-800">"{nombreCampana}"</strong> ha sido activada correctamente para los <strong>{leadsFiltradosParaEnviar.length} leads</strong> seleccionados.
            </p>
            
            <button
              onClick={handleReset}
              className="mt-8 px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
            >
              Iniciar otra campaña
            </button>
          </motion.div>
        ) : paso === 1 ? (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            {/* Input Config Box */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <Users className="h-5 w-5 text-indigo-500" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Criterio del reenvío
                </h3>
              </div>
              
              <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                Aquí se muestran los leads a los que se les envió mail por última vez hace tanto tiempo. Define la cantidad de días transcurridos desde el último contacto y presiona buscar.
              </p>

              <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row items-end gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="w-full sm:w-auto flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Tiempo Transcurrido (Días)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Ej: 15"
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      className="w-24 rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm outline-none transition-all focus:border-indigo-500 text-center font-bold"
                      required
                    />
                    <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 select-none uppercase tracking-wider">
                      Días
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={buscando}
                  className="w-full sm:w-auto h-11 px-8 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-higher flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {buscando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Buscar
                    </>
                  )}
                </button>
              </form>

              {errorBusqueda && (
                <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200/50 text-amber-800 text-xs px-4 py-3 rounded-xl font-medium">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>{errorBusqueda}</span>
                </div>
              )}
            </div>

            {/* List of retrieved users */}
            {leads.length > 0 && (
              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Leads Disponibles para Reenvío ({leads.length})
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Se marcarán todos por defecto. Filtra por texto y navega las páginas si es necesario.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleAllLeads}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline bg-transparent border-none cursor-pointer"
                    >
                      {filteredLeads.every(lead => leadsSeleccionados[lead.email_lead || lead.email]) ? "Deseleccionar Filtrados" : "Seleccionar Filtrados"}
                    </button>
                  </div>
                </div>

                {/* Buscador de leads */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar por email, nombre o empresa..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
                    />
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="text-xs text-rose-500 hover:text-rose-750 font-bold bg-transparent border-none cursor-pointer"
                    >
                      Limpiar Filtro
                    </button>
                  )}
                </div>

                {/* Tabla de Leads */}
                <div className="overflow-x-auto">
                  {leadsToDisplay.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-medium text-xs">
                      No se encontraron resultados con el filtro aplicado.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] font-extrabold tracking-widest border-b border-slate-100">
                          <th className="py-3.5 px-6 w-24 text-center">Envío</th>
                          <th className="py-3.5 px-4 font-sans">Email</th>
                          <th className="py-3.5 px-4 hidden sm:table-cell font-sans">Nombre</th>
                          <th className="py-3.5 px-4 hidden md:table-cell font-sans">Empresa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                        {leadsToDisplay.map((lead, index) => {
                          const displayEmail = lead.email_lead || lead.email;
                          const emailKey = displayEmail || `lead-${startIndex + index}`;
                          const isSelected = !!leadsSeleccionados[emailKey];
                          return (
                            <tr key={index} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? "bg-indigo-50/10" : ""}`}>
                              
                              {/* Columna "Envío" con switch iOS premium */}
                              <td className="py-3 px-6 text-center">
                                <div className="flex justify-center items-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleSelectLead(emailKey)}
                                    className={`relative inline-flex h-5.5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-in-out focus:outline-none ${
                                      isSelected ? "bg-[#34c759]" : "bg-[#e9e9ea]"
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition duration-300 ease-in-out absolute top-0.5 ${
                                        isSelected ? "translate-x-4 left-0" : "translate-x-0.5 left-0"
                                      }`}
                                    />
                                  </button>
                                </div>
                              </td>

                              <td className="py-3 px-4 font-semibold text-slate-900 font-mono text-[11px]">{displayEmail || "—"}</td>
                              <td className="py-3 px-4 hidden sm:table-cell font-sans font-medium text-slate-700">{lead.nombre || "—"}</td>
                              <td className="py-3 px-4 hidden md:table-cell">
                                {lead.empresa ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                    {lead.empresa}
                                  </span>
                                ) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Controles de paginación */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={activePage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Anterior
                    </button>
                    
                    <span className="text-xs text-slate-500 font-semibold">
                      Página <strong className="text-slate-800">{activePage}</strong> de <strong className="text-slate-800">{totalPages}</strong>
                    </span>

                    <button
                      type="button"
                      disabled={activePage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40"
                    >
                      Siguiente
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-medium">
                    Tienes <span className="text-indigo-600 font-bold">{leadsFiltradosParaEnviar.length}</span> / {leads.length} leads marcados para envío.
                  </div>

                  <button
                    type="button"
                    onClick={handleSiguiente}
                    className="h-11 px-6 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-higher flex items-center gap-2 hover:bg-indigo-700 transition cursor-pointer"
                  >
                    Siguiente
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <form onSubmit={handleDesplegarReenvio} className="space-y-6">
              
              {/* Resumen del paso anterior */}
              <div className="flex items-center justify-between flex-wrap gap-2 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <span className="text-slate-700 font-medium">
                    Camapaña configurada para enviar a <strong className="text-indigo-700 font-bold">{leadsFiltradosParaEnviar.length}</strong> leads seleccionados.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  className="flex items-center gap-1 py-1.5 px-3 border border-indigo-200 text-indigo-700 hover:bg-white rounded-xl transition font-semibold text-[11px]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Volver a leads
                </button>
              </div>

              {/* Formulario de Correo de Outreach */}
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-50 pb-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Type className="h-4 w-4 text-indigo-500" />
                    Diseño de la Campaña de outreach
                  </h3>

                  {/* Switch Toggle HTML Mode */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold transition-colors duration-300 ${!useHtmlEditor ? "text-[#34c759] font-bold" : "text-slate-400"}`}>
                      Texto Plano
                    </span>
                    <button
                      type="button"
                      onClick={() => setUseHtmlEditor(!useHtmlEditor)}
                      className={`relative inline-flex h-5.5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-305 ease-in-out focus:outline-none ${
                        useHtmlEditor ? "bg-[#34c759]" : "bg-[#e9e9ea]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition duration-305 ease-in-out absolute top-0.5 ${
                          useHtmlEditor ? "translate-x-4 left-0" : "translate-x-0.5 left-0"
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-semibold transition-colors duration-300 ${useHtmlEditor ? "text-[#34c759] font-bold" : "text-slate-400"}`}>
                      Editor HTML
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="campaignNameRe">
                      Nombre de la Campaña
                    </label>
                    <input
                      id="campaignNameRe"
                      type="text"
                      placeholder="Ej: Reenvío Automatizado Junio"
                      value={nombreCampana}
                      onChange={(e) => setNombreCampana(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 font-medium"
                      required
                    />
                    <p className="text-[10px] text-amber-600 font-normal mt-1 leading-tight italic font-sans animate-fade-in">
                      * evita repetir el nombre con otras campañas
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="senderNameRe">
                      Nombre del Remitente
                    </label>
                    <input
                      id="senderNameRe"
                      type="text"
                      placeholder="Ej: Diego de The AI Room"
                      value={nombreRemitente}
                      onChange={(e) => setNombreRemitente(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="subjectRe">
                      Asunto del Correo
                    </label>
                    <input
                      id="subjectRe"
                      type="text"
                      placeholder="Ej: Consulta rápida sobre automatización para {{empresa}}"
                      value={asunto}
                      onChange={(e) => setAsunto(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Variable chips selector */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none mr-2">Campos disponibles:</span>
                  {["nombre", "empresa", "puesto", "email"].map((param, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCuerpo(prev => prev + ` {{${param}}}`)}
                      className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 px-2 py-1 rounded text-[10px] font-mono tracking-tight cursor-pointer"
                    >
                      {"{{" + param + "}}"}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="bodyRe">
                    Mensaje del Correo
                  </label>
                  <textarea
                    id="bodyRe"
                    rows={12}
                    placeholder={`Hola {{nombre}},\n\nNoté que estabais expandiendo las operaciones de {{empresa}} y me gustaría comentarte...\n\nSaludos,\nDiego`}
                    value={cuerpo}
                    onChange={(e) => setCuerpo(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 py-3.5 px-4 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 font-mono leading-relaxed"
                    required
                  />
                  {useHtmlEditor && (
                    <p className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1 font-medium font-mono leading-none">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      El editor se encuentra en modo HTML. Asegúrate de incluir etiquetas HTML correctas (ej. &lt;p&gt;, &lt;br /&gt;).
                    </p>
                  )}
                </div>
              </div>

              {errorDespliegue && (
                <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-250 text-rose-800 text-xs px-4 py-3 rounded-xl font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorDespliegue}</span>
                </div>
              )}

              {/* Footer de Acciones */}
              <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  className="h-11 px-6 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-higher flex items-center gap-2 transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a Leads
                </button>

                <button
                  type="submit"
                  disabled={desplegando}
                  className="h-11 px-8 rounded-xl bg-[#34c759] text-white font-bold text-xs uppercase tracking-higher flex items-center justify-center gap-2 hover:bg-[#2ead4e] active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {desplegando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      Desplegando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Desplegar Campaña de Reenvío
                    </>
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createCampaign } from "../api";
import { 
  Sparkles, 
  Linkedin, 
  FileSpreadsheet, 
  Upload, 
  Type, 
  Eye, 
  FileText, 
  Send, 
  Code,
  Info
} from "lucide-react";

interface CampaignWizardProps {
  id_usuario: string;
  onCampaignCreated: (id_campana: string) => void;
}

export default function CampaignWizard({ id_usuario, onCampaignCreated }: CampaignWizardProps) {
  const [leadsSource, setLeadsSource] = useState<"linkedin" | "file">("linkedin");
  const [urlLinkedin, setUrlLinkedin] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  
  const [nombreRemitente, setNombreRemitente] = useState(() => {
    return localStorage.getItem(`theairoom_${id_usuario}_campaign_name`) || "";
  });
  const [nombreCampana, setNombreCampana] = useState(() => {
    return localStorage.getItem(`theairoom_${id_usuario}_campaign_title_config`) || "";
  });
  const [asunto, setAsunto] = useState(() => {
    return localStorage.getItem(`theairoom_${id_usuario}_campaign_asunto`) || "";
  });
  const [cuerpoHtml, setCuerpoHtml] = useState(() => {
    return localStorage.getItem(`theairoom_${id_usuario}_campaign_cuerpo_html`) || "";
  });
  const [cuerpoTexto, setCuerpoTexto] = useState(() => {
    return localStorage.getItem(`theairoom_${id_usuario}_campaign_cuerpo_texto`) || "";
  });
  
  const [useHtmlEditor, setUseHtmlEditor] = useState<boolean>(() => {
    return localStorage.getItem(`theairoom_${id_usuario}_campaign_use_html_editor`) === "true";
  });
  
  const [activeTab, setActiveTab] = useState<"html" | "text" | "preview">(() => {
    const savedUseHtml = localStorage.getItem(`theairoom_${id_usuario}_campaign_use_html_editor`) === "true";
    return savedUseHtml ? "html" : "text";
  });

  const handleToggleHtmlEditor = (val: boolean) => {
    setUseHtmlEditor(val);
    localStorage.setItem(`theairoom_${id_usuario}_campaign_use_html_editor`, val ? "true" : "false");
    if (!val) {
      setActiveTab("text");
    } else {
      setActiveTab("html");
    }
  };
  
  const htmlRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [pendingCampaignId, setPendingCampaignId] = useState("");

  // Variables dinámicas insertables
  const mergeTags = [
    { label: "Nombre", code: "{{nombre}}", sample: "Diego" },
    { label: "Empresa", code: "{{empresa}}", sample: "Acme Corp" },
  ];

  const handleInsertTag = (tag: string) => {
    if (useHtmlEditor && activeTab === "html") {
      const el = htmlRef.current;
      if (el) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const val = el.value;
        const textBefore = val.substring(0, start);
        const textAfter = val.substring(end, val.length);
        const newVal = textBefore + tag + textAfter;
        setCuerpoHtml(newVal);
        
        // Reset focus and set cursor position after updating value
        setTimeout(() => {
          el.focus();
          el.selectionStart = el.selectionEnd = start + tag.length;
        }, 50);
      } else {
        setCuerpoHtml((prev) => prev + tag);
      }
    } else {
      const el = textRef.current;
      if (el) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const val = el.value;
        const textBefore = val.substring(0, start);
        const textAfter = val.substring(end, val.length);
        const newVal = textBefore + tag + textAfter;
        setCuerpoTexto(newVal);
        
        // Reset focus and set cursor position after updating value
        setTimeout(() => {
          if (activeTab === "text") {
            el.focus();
          }
          el.selectionStart = el.selectionEnd = start + tag.length;
        }, 50);
      } else {
        setCuerpoTexto((prev) => prev + tag);
      }
    }
  };

  const handleSyncHtmlToText = () => {
    // Limpiador básico de etiquetas HTML para generar un texto plano decente
    let stripped = cuerpoHtml.replace(/<[^>]*>/g, "");
    stripped = stripped.replace(/&nbsp;/g, " ");
    setCuerpoTexto(stripped);
  };

  // Drag and Drop files
  const [dragActive, setDragActive] = useState(false);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validExtensions = [".csv", ".xlsx", ".xls"];
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (validExtensions.includes(ext)) {
        setArchivo(file);
      } else {
        setError("Tipo de archivo no aceptado. Proporciona un fichero CSV, XLSX o XLS.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setArchivo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validación según selección
    if (!nombreCampana) {
      setError("El nombre de la campaña es obligatorio.");
      return;
    }
    if (leadsSource === "linkedin" && !urlLinkedin) {
      setError("Debes ingresar la URL de búsqueda de LinkedIn Sales Navigator.");
      return;
    }
    if (leadsSource === "file" && !archivo) {
      setError("Debes subir un archivo local (CSV o XLSX) con los prospectos.");
      return;
    }
    if (!nombreRemitente) {
      setError("El nombre del remitente es obligatorio.");
      return;
    }
    if (!asunto) {
      setError("El asunto del correo es obligatorio.");
      return;
    }

    let finalCuerpoHtml: string | undefined = undefined;
    let finalCuerpoTexto: string | undefined = undefined;

    if (useHtmlEditor) {
      if (!cuerpoHtml || cuerpoHtml.trim() === "") {
        setError("El cuerpo del correo HTML es obligatorio.");
        return;
      }
      finalCuerpoHtml = cuerpoHtml;
    } else {
      if (!cuerpoTexto || cuerpoTexto.trim() === "") {
        setError("El cuerpo del correo en texto plano es obligatorio.");
        return;
      }
      finalCuerpoTexto = cuerpoTexto;
    }

    setLoading(true);
    setShowDeployModal(true);

    try {
      const response = await createCampaign(
        id_usuario,
        asunto,
        finalCuerpoHtml,
        finalCuerpoTexto,
        leadsSource,
        leadsSource === "linkedin" ? urlLinkedin : undefined,
        leadsSource === "file" && archivo ? archivo : undefined,
        nombreRemitente,
        nombreCampana
      );

      // Guardar el estado de que los leads se están procesando
      localStorage.setItem(`pepper_leads_processing_${id_usuario}`, "true");

      if (response && response.success) {
        const campaignId = response.id_campana || `camp-${Math.floor(Math.random() * 900000) + 100000}`;
        setPendingCampaignId(campaignId);
        
        localStorage.setItem(`theairoom_${id_usuario}_campaign_title_config`, nombreCampana);
        localStorage.setItem(`theairoom_${id_usuario}_campaign_name`, nombreRemitente);
        localStorage.setItem(`theairoom_${id_usuario}_campaign_asunto`, asunto);
        localStorage.setItem(`theairoom_${id_usuario}_campaign_cuerpo_html`, finalCuerpoHtml || "");
        localStorage.setItem(`theairoom_${id_usuario}_campaign_cuerpo_texto`, finalCuerpoTexto || "");

        setSuccessMsg("¡Campaña iniciada e inyectada exitosamente!");
      } else {
        setError(response.error || "El webhook no notificó un resultado exitoso.");
        setShowDeployModal(false);
      }
    } catch (err: any) {
      // Como fallback por si falla la conexión en test/local, creamos la campaña
      const campaignId = `camp-${Math.floor(Math.random() * 900000) + 100000}`;
      setPendingCampaignId(campaignId);
      localStorage.setItem(`theairoom_${id_usuario}_campaign_title_config`, nombreCampana);
      localStorage.setItem(`theairoom_${id_usuario}_campaign_name`, nombreRemitente);
      localStorage.setItem(`theairoom_${id_usuario}_campaign_asunto`, asunto);
      localStorage.setItem(`theairoom_${id_usuario}_campaign_cuerpo_html`, finalCuerpoHtml || "");
      localStorage.setItem(`theairoom_${id_usuario}_campaign_cuerpo_texto`, finalCuerpoTexto || "");
      
      // Permitimos procesar localmente
      localStorage.setItem(`pepper_leads_processing_${id_usuario}`, "true");

      setError(
        `Error del servidor: ${err.message || "Por favor verifica la configuración del endpoint central."}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptModal = () => {
    setShowDeployModal(false);
    const finalId = pendingCampaignId || `camp-${Math.floor(Math.random() * 900000) + 100000}`;
    onCampaignCreated(finalId);
  };

  // Obtener vista previa resolviendo variables estáticas
  const getPreviewBody = () => {
    let rawContent = cuerpoHtml;
    if (!rawContent && cuerpoTexto) {
      rawContent = `<p>${cuerpoTexto.replace(/\n/g, "<br>")}</p>`;
    }
    let text = rawContent || "<p class='text-slate-400 italic'>Escribe algo en el editor para previsualizar...</p>";
    mergeTags.forEach((tag) => {
      const regex = new RegExp(tag.code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      text = text.replace(regex, `<span class="bg-amber-100 text-amber-800 px-1 rounded font-semibold text-xs">${tag.sample}</span>`);
    });
    return text;
  };

  const getPlainTextPreview = () => {
    let rawText = cuerpoTexto || "Escribe algo en el editor para previsualizar...";
    mergeTags.forEach((tag) => {
      const regex = new RegExp(tag.code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      rawText = rawText.replace(regex, tag.sample);
    });
    return rawText;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Modal de Carga de Leads con pantalla difuminada (blurreada) */}
      <AnimatePresence>
        {showDeployModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="max-w-md w-full bg-white rounded-2xl border border-slate-100 p-6 shadow-2xl text-center space-y-5"
            >
              <div className="flex justify-center">
                <div className="relative flex items-center justify-center h-16 w-16 bg-indigo-50 rounded-full text-indigo-600">
                  <span className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-sans font-bold text-lg text-slate-800">
                  Subiendo leads a la base de datos
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Súper, tus prospectos se están sincronizando con el servidor central de envíos de cold email. Esto puede demorar unos minutos.
                </p>
                {error && (
                  <p className="text-[11px] text-amber-600 font-medium bg-amber-50 rounded-lg p-2 mt-1">
                    Nota: {error}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  id="btn_accept_deploy_modal"
                  onClick={handleAcceptModal}
                  className="w-full inline-flex justify-center items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  Aceptar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-sans text-xl font-semibold tracking-tight text-slate-800">
            Diseñador de Campañas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Define tu audiencia objetivo en n8n y redacta plantillas de email hiper-personalizadas.
          </p>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-red-100 bg-red-50 p-4 text-xs text-red-800"
        >
          <div className="font-bold mb-1">Incapaz de despachar campaña</div>
          <p className="leading-relaxed">{error}</p>
          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={() => {
                setError(null);
                // Forzar campaña simulación local
                onCampaignCreated(`camp-${Math.floor(Math.random() * 8000) + 1000}`);
              }}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              Forzar simulación local
            </button>
            <span className="text-[10px] text-red-600 italic">Opción útil si estás corriendo sin configurar n8n</span>
          </div>
        </motion.div>
      )}

      {successMsg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800 text-center font-medium"
        >
          🎉 {successMsg} Redirigiendo al visualizador de métricas de la campaña...
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bloque 1: Origen de Leads */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            1. Definición del Origen de Leads
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-5 p-1 bg-slate-50 rounded-xl max-w-sm">
            <button
              type="button"
              onClick={() => {
                setLeadsSource("linkedin");
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                leadsSource === "linkedin"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Linkedin className="h-3.5 w-3.5 text-indigo-600" />
              LinkedIn Sales Nav
            </button>
            <button
              type="button"
              onClick={() => {
                setLeadsSource("file");
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                leadsSource === "file"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              Subir CSV / XLSX
            </button>
          </div>

          <AnimatePresence mode="wait">
            {leadsSource === "linkedin" ? (
              <motion.div
                key="linkedin-source"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-2"
              >
                <label className="block text-xs font-semibold text-slate-700">
                  URL de búsqueda de LinkedIn Sales Navigator (url_linkedin)
                </label>
                <input
                  type="url"
                  placeholder="https://www.linkedin.com/sales/search/people?query=..."
                  value={urlLinkedin}
                  onChange={(e) => setUrlLinkedin(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 leading-relaxed flex items-center gap-1 mt-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  Al enviar la campaña, el scraper de LinkedIn en n8n extraerá dinámicamente los prospectos, recuperará sus variables y enriquecerá los correos corporativos antes de lanzarlos.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="file-source"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-2"
              >
                <label className="block text-xs font-semibold text-slate-700">
                  Fichero local de Leads (CSV, XLSX)
                </label>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                    dragActive 
                      ? "border-indigo-500 bg-indigo-50/40" 
                      : archivo 
                        ? "border-emerald-300 bg-emerald-50/10" 
                        : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {archivo ? (
                    <div className="space-y-3">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                        <FileSpreadsheet className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{archivo.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{(archivo.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile();
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline px-2 py-1 rounded cursor-pointer"
                      >
                        Quitar archivo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">
                        Arrastra tu archivo aquí o <span className="text-indigo-600 font-semibold underline">búscalo localmente</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Soporta formatos CSV, XLSX o XLS con columnas: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">email, nombre, empresa, puesto</code>.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bloque 2: Redacción del Mensaje */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Type className="h-4 w-4 text-indigo-500" />
              2. Contenido del Correo de Outreach
            </h3>

            {/* Switch Toggle for HTML Mode */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold transition-colors duration-300 ${!useHtmlEditor ? "text-[#34c759] font-bold" : "text-slate-400"}`}>
                Texto Plano
              </span>
              <button
                type="button"
                onClick={() => handleToggleHtmlEditor(!useHtmlEditor)}
                className={`relative inline-flex h-5.5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-305 ease-in-out focus:outline-none ${
                  useHtmlEditor ? "bg-[#34c759]" : "bg-[#e9e9ea]"
                }`}
                aria-label="Alternar editor HTML"
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
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="campaignName">
                Nombre de la Campaña
              </label>
              <input
                id="campaignName"
                type="text"
                placeholder="Ej: Campaña de Clientes Junio"
                value={nombreCampana}
                onChange={(e) => setNombreCampana(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                required
              />
              <p className="text-[10px] text-amber-600 font-normal mt-1 leading-tight italic font-sans">
                * evita repetir el nombre con otras campañas
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="senderName">
                Nombre del Remitente
              </label>
              <input
                id="senderName"
                type="text"
                placeholder="Ej: Diego de The AI Room"
                value={nombreRemitente}
                onChange={(e) => setNombreRemitente(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="subject">
                Asunto del Correo
              </label>
              <input
                id="subject"
                type="text"
                placeholder="Ej: Consulta rápida sobre automatización para {{empresa}}"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                required
              />
            </div>
          </div>

          {/* Ataques Rápidos de Variables (Merge tags) */}
          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Inserción de Variables Dinámicas (Haz clic para inyectar) :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {mergeTags.map((tag) => (
                <button
                  key={tag.code}
                  type="button"
                  onClick={() => handleInsertTag(tag.code)}
                  className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-950 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 text-indigo-500" />
                  {tag.label} <code className="text-[10px] text-slate-500 ml-1 font-mono">{tag.code}</code>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100/80 pt-4 space-y-3">
            {/* Nav interna del Editor */}
            <div className="flex border-b border-slate-100">
              {!useHtmlEditor ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab("text")}
                    className={`border-b-2 px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === "text"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Escribir Texto Plano
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("preview");
                      setError(null);
                    }}
                    className={`border-b-2 px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === "preview"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Vista Previa (Texto Plano)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab("html")}
                    className={`border-b-2 px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === "html"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Code className="h-3.5 w-3.5" />
                    Cuerpo HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("preview");
                      setError(null);
                    }}
                    className={`border-b-2 px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === "preview"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Vista Previa HTML
                  </button>
                </>
              )}
            </div>

            {/* Cuerpo del Editor */}
            <div className="min-h-[220px]">
              {useHtmlEditor ? (
                <>
                  {activeTab === "html" && (
                    <div className="space-y-1">
                      <textarea
                        ref={htmlRef}
                        rows={8}
                        placeholder="<p>Hola {{nombre}},</p><p>Escribe tu correo aquí en HTML o texto normal...</p>"
                        value={cuerpoHtml}
                        onChange={(e) => setCuerpoHtml(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono bg-slate-50/10 min-h-[160px]"
                      />
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                        <span>Soporta HTML estricto para diseño estético y firma.</span>
                      </div>
                    </div>
                  )}

                  {activeTab === "preview" && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 font-sans text-sm text-slate-800 space-y-3 shadow-inner">
                      <div className="border-b border-slate-200 pb-2.5">
                        <span className="font-semibold text-xs text-slate-400 uppercase mr-1">Asunto:</span>
                        <span className="text-slate-800 font-medium font-sans">
                          {asunto ? asunto.replace(/\{\{empresa\}\}/g, "Acme Corp").replace(/\{\{nombre\}\}/g, "Diego") : "(Sin asunto asignado)"}
                        </span>
                      </div>
                      <div 
                        className="prose prose-sm max-w-none text-slate-700 space-y-2 mt-4"
                        dangerouslySetInnerHTML={{ __html: getPreviewBody() }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {activeTab === "text" && (
                    <div className="space-y-1">
                      <textarea
                        ref={textRef}
                        rows={8}
                        placeholder="Hola {{nombre}},\n\nEscribe tu propuesta de correo en texto plano..."
                        value={cuerpoTexto}
                        onChange={(e) => setCuerpoTexto(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono bg-slate-50/10 min-h-[160px]"
                      />
                      <p className="text-[10px] text-slate-500 font-sans">
                        * El correo se enviará en formato texto 100% plano, con máxima compatibilidad y mayor entregabilidad.
                      </p>
                    </div>
                  )}

                  {activeTab === "preview" && (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 font-mono text-xs text-slate-800 space-y-3 shadow-inner">
                      <div className="border-b border-slate-200 pb-2.5 font-sans">
                        <span className="font-semibold text-xs text-slate-400 uppercase mr-1">Asunto:</span>
                        <span className="text-slate-800 font-medium font-sans whitespace-pre-wrap">
                          {asunto ? asunto.replace(/\{\{empresa\}\}/g, "Acme Corp").replace(/\{\{nombre\}\}/g, "Diego") : "(Sin asunto asignado)"}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed mt-4">
                        {getPlainTextPreview()}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Botón de envío */}
        <div className="flex items-center justify-between p-1">
          <p className="text-xs text-slate-500">
            * Al presionar se enviará la estructura de campaña a n8n para el enrutado inmediato.
          </p>
          <button
            id="btn_launch_campaign"
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-200 disabled:text-indigo-400 cursor-pointer"
          >
            {loading ? "Desplegando en n8n..." : "Desplegar Campaña"}
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

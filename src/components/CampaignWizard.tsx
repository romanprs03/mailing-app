/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createCampaign } from "../api";
import CampaignForm, { CampaignFormValues } from "./CampaignForm";
import {
  Sparkles,
  Linkedin,
  FileSpreadsheet,
  Upload,
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [pendingCampaignId, setPendingCampaignId] = useState("");

  // Cargar cache local para pre-rellenar el form
  const cachedInitialValues: CampaignFormValues = {
    campaign_name: typeof window !== "undefined"
      ? localStorage.getItem(`theairoom_${id_usuario}_campaign_title_config`) || ""
      : "",
    nombreRemitente: typeof window !== "undefined"
      ? localStorage.getItem(`theairoom_${id_usuario}_campaign_name`) || ""
      : "",
    asunto: typeof window !== "undefined"
      ? localStorage.getItem(`theairoom_${id_usuario}_campaign_asunto`) || ""
      : "",
    cuerpo_html: typeof window !== "undefined"
      ? localStorage.getItem(`theairoom_${id_usuario}_campaign_cuerpo_html`) || ""
      : "",
    cuerpo_texto: typeof window !== "undefined"
      ? localStorage.getItem(`theairoom_${id_usuario}_campaign_cuerpo_texto`) || ""
      : "",
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

  const handleFormSubmit = async (values: CampaignFormValues) => {
    setError(null);
    setSuccessMsg(null);

    if (!values.campaign_name) {
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

    if (!values.nombreRemitente) {
      setError("El nombre del remitente es obligatorio.");
      return;
    }
    if (!values.asunto) {
      setError("El asunto del correo es obligatorio.");
      return;
    }
    if (!values.cuerpo_html.trim() && !values.cuerpo_texto.trim()) {
      setError("Debes redactar el cuerpo del correo (HTML o texto plano).");
      return;
    }

    setLoading(true);
    setShowDeployModal(true);

    try {
      const response = await createCampaign(
        id_usuario,
        values.asunto,
        values.cuerpo_html || undefined,
        values.cuerpo_texto || undefined,
        leadsSource,
        leadsSource === "linkedin" ? urlLinkedin : undefined,
        leadsSource === "file" && archivo ? archivo : undefined,
        values.nombreRemitente,
        values.campaign_name
      );

      localStorage.setItem(`pepper_leads_processing_${id_usuario}`, "true");

      if (response && response.success) {
        const campaignId = response.id_campana || `camp-${Math.floor(Math.random() * 900000) + 100000}`;
        setPendingCampaignId(campaignId);

        localStorage.setItem(`theairoom_${id_usuario}_campaign_title_config`, values.campaign_name);
        localStorage.setItem(`theairoom_${id_usuario}_campaign_name`, values.nombreRemitente);
        localStorage.setItem(`theairoom_${id_usuario}_campaign_asunto`, values.asunto);
        localStorage.setItem(`theairoom_${id_usuario}_campaign_cuerpo_html`, values.cuerpo_html || "");
        localStorage.setItem(`theairoom_${id_usuario}_campaign_cuerpo_texto`, values.cuerpo_texto || "");

        setSuccessMsg("¡Campaña iniciada e inyectada exitosamente!");
      } else {
        setError(response.error || "El webhook no notificó un resultado exitoso.");
        setShowDeployModal(false);
      }
    } catch (err: any) {
      const campaignId = `camp-${Math.floor(Math.random() * 900000) + 100000}`;
      setPendingCampaignId(campaignId);
      localStorage.setItem(`theairoom_${id_usuario}_campaign_title_config`, values.campaign_name);
      localStorage.setItem(`theairoom_${id_usuario}_campaign_name`, values.nombreRemitente);
      localStorage.setItem(`theairoom_${id_usuario}_campaign_asunto`, values.asunto);
      localStorage.setItem(`theairoom_${id_usuario}_campaign_cuerpo_html`, values.cuerpo_html || "");
      localStorage.setItem(`theairoom_${id_usuario}_campaign_cuerpo_texto`, values.cuerpo_texto || "");

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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Modal de Carga de Leads */}
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
            Nueva Campaña
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Define tu audiencia objetivo en n8n y redacta plantillas de email hiper-personalizadas.
          </p>
        </div>
      </div>

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

      {/* Bloque 2: Redacción - Reutiliza CampaignForm */}
      <CampaignForm
        mode="create"
        initialValues={cachedInitialValues}
        onSubmit={handleFormSubmit}
        submitLabel="Desplegar Campaña"
        externalLoading={loading}
        externalError={error}
        externalSuccess={successMsg}
      />

      <p className="text-[11px] text-slate-400 text-center -mt-4">
        * Al presionar se enviará la estructura de campaña a n8n para el enrutado inmediato.
      </p>
    </div>
  );
}

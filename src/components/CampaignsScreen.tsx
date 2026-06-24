/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetchPreviousCampaigns, updateCampaign } from "../api";
import { CampanaAnterior } from "../types";
import CampaignWizard from "./CampaignWizard";
import CampaignForm, { CampaignFormValues } from "./CampaignForm";
import {
  Inbox,
  ChevronDown,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  PlusCircle,
  PencilLine,
  Sparkles,
  Check,
  Send
} from "lucide-react";

interface CampaignsScreenProps {
  id_usuario: string;
  onCampaignCreated: (id_campana: string) => void;
}

export default function CampaignsScreen({ id_usuario, onCampaignCreated }: CampaignsScreenProps) {
  const [campaigns, setCampaigns] = useState<CampanaAnterior[] | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  // refreshKey se incrementa tras crear una nueva campaña para forzar recarga de la lista
  const [refreshKey, setRefreshKey] = useState(0);
  // Pestaña activa: crear una campaña nueva o editar una existente
  const [mode, setMode] = useState<"create" | "edit">("create");
  // Dropdown custom de selección de campaña
  const [selectOpen, setSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Cerrar el dropdown al hacer click afuera
  useEffect(() => {
    if (!selectOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectOpen]);

  const loadCampaigns = async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await fetchPreviousCampaigns(id_usuario);
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setListError(err?.message || "No se pudo obtener la lista de campañas existentes.");
      setCampaigns([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id_usuario, refreshKey]);

  const selectedCampaign =
    campaigns && selectedKey
      ? campaigns.find((c) => {
          const nombre = c.campaign_name || c.nombre_campana;
          return nombre === selectedKey;
        }) || null
      : null;

  const initialEditValues: Partial<CampaignFormValues> | undefined = selectedCampaign
    ? {
        campaign_name: selectedCampaign.campaign_name || selectedCampaign.nombre_campana || "",
        nombreRemitente: (selectedCampaign as any).name || (selectedCampaign as any).nombre_remitente || "",
        asunto: selectedCampaign.asunto || "",
        cuerpo_html: (selectedCampaign as any).cuerpo_html || "",
        cuerpo_texto: (selectedCampaign as any).cuerpo_texto || "",
      }
    : undefined;

  const handleUpdate = async (values: CampaignFormValues) => {
    if (!selectedCampaign) return;
    setSaveFeedback(null);
    setSaving(true);
    try {
      const idCampana = selectedCampaign.id_campana || "";
      const response = await updateCampaign(
        idCampana,
        id_usuario,
        values.campaign_name,
        values.asunto,
        values.cuerpo_html,
        values.cuerpo_texto
      );

      setSaveFeedback({
        type: "success",
        message: response.message || `Campaña "${values.campaign_name}" actualizada correctamente.`
      });

      // Refrescar la lista para que el nuevo nombre aparezca en el desplegable
      await loadCampaigns();
      // Mantener la selección en el mismo nombre (o el nuevo si cambió)
      setSelectedKey(values.campaign_name);
    } catch (err: any) {
      setSaveFeedback({
        type: "error",
        message: err?.message || "Error al actualizar la campaña."
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCampaignCreated = (id: string) => {
    setRefreshKey((k) => k + 1);
    setSaveFeedback(null);
    setSelectedKey(null);
    onCampaignCreated(id);
  };

  const campaignCount = campaigns?.length ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header común */}
      <div>
        <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-800">
          Campañas
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-sans">
          Crea una nueva campaña o ajusta la configuración de una existente.
        </p>
      </div>

      {/* Control segmentado: Crear / Editar */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`relative flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
            mode === "create"
              ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <PlusCircle className="h-4 w-4 shrink-0" />
          Crear nueva
        </button>
        <button
          type="button"
          onClick={() => setMode("edit")}
          className={`relative flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
            mode === "edit"
              ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <PencilLine className="h-4 w-4 shrink-0" />
          Editar existente
          {campaignCount > 0 && (
            <span
              className={`ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                mode === "edit" ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-500"
              }`}
            >
              {campaignCount}
            </span>
          )}
        </button>
      </div>

      {/* Sección A — Nueva Campaña */}
      {mode === "create" && (
        <motion.section
          key="create-panel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <CampaignWizard id_usuario={id_usuario} onCampaignCreated={handleCampaignCreated} />
        </motion.section>
      )}

      {/* Sección B — Configuración de Campañas */}
      {mode === "edit" && (
      <motion.section
        key="edit-panel"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
            <PencilLine className="h-4 w-4 text-indigo-500" />
            Editar Campaña Existente
          </h3>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 cursor-pointer"
            title="Refrescar lista de campañas"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refrescar
          </button>
        </div>

        {saveFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-3 text-xs flex items-start gap-2 border ${
              saveFeedback.type === "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                : "border-rose-100 bg-rose-50 text-rose-800"
            }`}
          >
            {saveFeedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block mb-0.5">
                {saveFeedback.type === "success" ? "Operación Completada" : "Atención"}
              </span>
              {saveFeedback.message}
            </div>
          </motion.div>
        )}

        {/* Estados del selector */}
        {loadingList ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-10 bg-slate-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : listError ? (
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-800 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{listError}</p>
            </div>
            <button
              type="button"
              onClick={loadCampaigns}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 hover:text-rose-900 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </button>
          </div>
        ) : !campaigns || campaigns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Aún no tienes campañas creadas
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Crea tu primera campaña para empezar. Después podrás editar su configuración aquí.
            </p>
            <button
              type="button"
              onClick={() => setMode("create")}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              Crear nueva campaña
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Selecciona una campaña para editar
              </label>
              <div className="relative" ref={selectRef}>
                <button
                  type="button"
                  id="select_campaign_to_edit"
                  onClick={() => setSelectOpen((o) => !o)}
                  className={`w-full flex items-center gap-3 rounded-xl border bg-white py-2.5 pl-3 pr-10 text-left text-sm transition-all cursor-pointer ${
                    selectOpen
                      ? "border-indigo-500 ring-2 ring-indigo-500/15"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {selectedKey ? (
                    <>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 text-xs font-bold uppercase">
                        {selectedKey.charAt(0)}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">{selectedKey}</span>
                    </>
                  ) : (
                    <>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        <Send className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-slate-400">Elige una campaña…</span>
                    </>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${
                      selectOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {selectOpen && (
                    <motion.ul
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.14 }}
                      className="absolute z-20 mt-2 w-full max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/5"
                    >
                      {campaigns.map((camp, idx) => {
                        const nombre = camp.campaign_name || camp.nombre_campana || `Histórica #${idx + 1}`;
                        const isSelected = nombre === selectedKey;
                        return (
                          <li key={`${nombre}-${idx}`}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedKey(nombre);
                                setSaveFeedback(null);
                                setSelectOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                                isSelected
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold uppercase ${
                                  isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {nombre.charAt(0)}
                              </span>
                              <span className="font-medium truncate flex-1">{nombre}</span>
                              {isSelected && <Check className="h-4 w-4 text-indigo-600 shrink-0" />}
                            </button>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Lista de campañas obtenida del servidor. Los cambios se guardan en el endpoint de actualización de campañas.
              </p>
            </div>

            {selectedCampaign ? (
              <div className="border-t border-slate-100 pt-4">
                <CampaignForm
                  mode="edit"
                  initialValues={initialEditValues}
                  onSubmit={handleUpdate}
                  submitLabel="Guardar Cambios"
                  externalLoading={saving}
                  externalError={null}
                  externalSuccess={null}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-6 text-center space-y-1.5">
                <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-slate-500">
                  Selecciona una campaña del desplegable para editar su redacción.
                </p>
              </div>
            )}
          </div>
        )}
      </motion.section>
      )}
    </div>
  );
}

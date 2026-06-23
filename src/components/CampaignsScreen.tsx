/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { fetchPreviousCampaigns, updateCampaign } from "../api";
import { CampanaAnterior } from "../types";
import CampaignWizard from "./CampaignWizard";
import CampaignForm, { CampaignFormValues } from "./CampaignForm";
import {
  History,
  Inbox,
  ChevronDown,
  CheckCircle2,
  ShieldAlert,
  RefreshCw
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
      const response = await updateCampaign(
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

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header común */}
      <div>
        <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-800">
          Campañas
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-sans">
          Crea una nueva campaña o ajusta la configuración de una existente.
        </p>
      </div>

      {/* Sección A — Nueva Campaña */}
      <section>
        <CampaignWizard id_usuario={id_usuario} onCampaignCreated={handleCampaignCreated} />
      </section>

      {/* Separador visual */}
      <div className="border-t border-slate-200" />

      {/* Sección B — Configuración de Campañas */}
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
            <History className="h-4 w-4 text-indigo-500" />
            Configuración de Campañas Existentes
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
              Crea tu primera campaña desde la sección superior para empezar. Después podrás editar su configuración aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Selecciona una campaña para editar
              </label>
              <div className="relative">
                <select
                  id="select_campaign_to_edit"
                  value={selectedKey || ""}
                  onChange={(e) => {
                    setSelectedKey(e.target.value || null);
                    setSaveFeedback(null);
                  }}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-10 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">— Elige una campaña —</option>
                  {campaigns.map((camp, idx) => {
                    const nombre = camp.campaign_name || camp.nombre_campana || `Histórica #${idx + 1}`;
                    return (
                      <option key={`${nombre}-${idx}`} value={nombre}>
                        {nombre}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              <div className="rounded-lg border border-slate-100 bg-slate-50/30 p-4 text-center">
                <p className="text-xs text-slate-500">
                  Selecciona una campaña del desplegable para editar su redacción.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

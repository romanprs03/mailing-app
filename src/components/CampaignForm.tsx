/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  Type,
  Eye,
  FileText,
  Code,
  Info
} from "lucide-react";

export interface CampaignFormValues {
  campaign_name: string;
  nombreRemitente: string;
  asunto: string;
  cuerpo_html: string;
  cuerpo_texto: string;
}

interface CampaignFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<CampaignFormValues>;
  onSubmit: (values: CampaignFormValues) => Promise<void> | void;
  submitLabel?: string;
  externalLoading?: boolean;
  externalError?: string | null;
  externalSuccess?: string | null;
}

export default function CampaignForm({
  mode,
  initialValues,
  onSubmit,
  submitLabel,
  externalLoading,
  externalError,
  externalSuccess
}: CampaignFormProps) {
  const [nombreCampana, setNombreCampana] = useState<string>(initialValues?.campaign_name || "");
  const [nombreRemitente, setNombreRemitente] = useState<string>(initialValues?.nombreRemitente || "");
  const [asunto, setAsunto] = useState<string>(initialValues?.asunto || "");
  const [cuerpoHtml, setCuerpoHtml] = useState<string>(initialValues?.cuerpo_html || "");
  const [cuerpoTexto, setCuerpoTexto] = useState<string>(initialValues?.cuerpo_texto || "");

  const [useHtmlEditor, setUseHtmlEditor] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"html" | "text" | "preview">("text");

  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalSuccess, setInternalSuccess] = useState<string | null>(null);

  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  const error = externalError !== undefined ? externalError : internalError;
  const successMsg = externalSuccess !== undefined ? externalSuccess : internalSuccess;

  // Re-sincronizar cuando cambien initialValues (p.ej. seleccionar otra campaña)
  useEffect(() => {
    if (initialValues) {
      setNombreCampana(initialValues.campaign_name || "");
      setNombreRemitente(initialValues.nombreRemitente || "");
      setAsunto(initialValues.asunto || "");
      setCuerpoHtml(initialValues.cuerpo_html || "");
      setCuerpoTexto(initialValues.cuerpo_texto || "");
    }
  }, [
    initialValues?.campaign_name,
    initialValues?.nombreRemitente,
    initialValues?.asunto,
    initialValues?.cuerpo_html,
    initialValues?.cuerpo_texto
  ]);

  const htmlRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

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
    let stripped = cuerpoHtml.replace(/<[^>]*>/g, "");
    stripped = stripped.replace(/&nbsp;/g, " ");
    setCuerpoTexto(stripped);
  };

  const handleToggleHtmlEditor = (val: boolean) => {
    setUseHtmlEditor(val);
    setActiveTab(val ? "html" : "text");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (externalLoading !== undefined) {
      // Modo controlado externamente: el padre maneja loading/error/éxito
      await onSubmit({
        campaign_name: nombreCampana,
        nombreRemitente,
        asunto,
        cuerpo_html: cuerpoHtml,
        cuerpo_texto: cuerpoTexto,
      });
      return;
    }

    setInternalError(null);
    setInternalSuccess(null);

    if (mode === "create") {
      if (!nombreCampana) {
        setInternalError("El nombre de la campaña es obligatorio.");
        return;
      }
      if (!nombreRemitente) {
        setInternalError("El nombre del remitente es obligatorio.");
        return;
      }
      if (!asunto) {
        setInternalError("El asunto del correo es obligatorio.");
        return;
      }
      if (useHtmlEditor) {
        if (!cuerpoHtml || cuerpoHtml.trim() === "") {
          setInternalError("El cuerpo del correo HTML es obligatorio.");
          return;
        }
      } else {
        if (!cuerpoTexto || cuerpoTexto.trim() === "") {
          setInternalError("El cuerpo del correo en texto plano es obligatorio.");
          return;
        }
      }
    }

    setInternalLoading(true);
    try {
      await onSubmit({
        campaign_name: nombreCampana,
        nombreRemitente,
        asunto,
        cuerpo_html: cuerpoHtml,
        cuerpo_texto: cuerpoTexto,
      });
    } catch (err: any) {
      setInternalError(err?.message || "Error al procesar la campaña.");
    } finally {
      setInternalLoading(false);
    }
  };

  // Vista previa resolviendo variables estáticas
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-red-100 bg-red-50 p-4 text-xs text-red-800"
        >
          <div className="font-bold mb-1">Error</div>
          <p className="leading-relaxed">{error}</p>
        </motion.div>
      )}

      {successMsg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800 text-center font-medium"
        >
          🎉 {successMsg}
        </motion.div>
      )}

      {/* Bloque de Redacción del Mensaje */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Type className="h-4 w-4 text-indigo-500" />
            Redacción del Mensaje
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
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor={`campaignName-${mode}`}>
              Nombre de la Campaña
            </label>
            <input
              id={`campaignName-${mode}`}
              type="text"
              placeholder="Ej: Campaña de Clientes Junio"
              value={nombreCampana}
              onChange={(e) => setNombreCampana(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
              required={mode === "create"}
            />
            <p className="text-[10px] text-amber-600 font-normal mt-1 leading-tight italic font-sans">
              * evita repetir el nombre con otras campañas
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor={`senderName-${mode}`}>
              Nombre del Remitente
            </label>
            <input
              id={`senderName-${mode}`}
              type="text"
              placeholder="Ej: Diego de The AI Room"
              value={nombreRemitente}
              onChange={(e) => setNombreRemitente(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
              required={mode === "create"}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor={`subject-${mode}`}>
              Asunto del Correo
            </label>
            <input
              id={`subject-${mode}`}
              type="text"
              placeholder="Ej: Consulta rápida sobre automatización para {{empresa}}"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
              required={mode === "create"}
            />
          </div>
        </div>

        {/* Merge tags */}
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
                  onClick={() => setActiveTab("preview")}
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
                  onClick={() => setActiveTab("preview")}
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
                      <button
                        type="button"
                        onClick={handleSyncHtmlToText}
                        className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                      >
                        Convertir HTML → Texto plano
                      </button>
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
      {submitLabel && (
        <div className="flex items-center justify-end p-1">
          <button
            id={mode === "create" ? "btn_launch_campaign" : "btn_save_campaign"}
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-200 disabled:text-indigo-400 cursor-pointer"
          >
            {loading ? "Procesando..." : submitLabel}
          </button>
        </div>
      )}
    </form>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { saveUserSettings } from "../api";
import { Save, ShieldAlert, CheckCircle2, RefreshCw, Info, HelpCircle, Shield, Sparkles, Scale, AlertOctagon, MailCheck, DollarSign, ExternalLink } from "lucide-react";

interface SettingsProps {
  id_usuario: string;
  initialSettings?: {
    mail_envio: string;
    mail_respuesta: string;
    limite_diario: string;
    mailjet_api_key: string;
    mailjet_secret_key: string;
  };
  onSaveSuccess: (updatedSettings: any) => void;
}

export default function Settings({ id_usuario, initialSettings, onSaveSuccess }: SettingsProps) {
  // Valores originales para comparación
  const [original, setOriginal] = useState({
    mail_envio: initialSettings?.mail_envio || "",
    mail_respuesta: initialSettings?.mail_respuesta || "",
    limite_diario: initialSettings?.limite_diario || "100",
    mailjet_api_key: initialSettings?.mailjet_api_key || "",
    mailjet_secret_key: initialSettings?.mailjet_secret_key || "",
  });

  // Valores editables de configuración del motor
  const [mailEnvio, setMailEnvio] = useState(original.mail_envio);
  const [mailRespuesta, setMailRespuesta] = useState(original.mail_respuesta);
  const [limiteDiario, setLimiteDiario] = useState(original.limite_diario);
  const [mailjetApiKey, setMailjetApiKey] = useState(original.mailjet_api_key);
  const [mailjetSecretKey, setMailjetSecretKey] = useState(original.mailjet_secret_key);

  // Estados de campaña actual (asunto, cuerpo y nombre modificables desde ajustes)
  const [nombreRemitente, setNombreRemitente] = useState("");
  const [asunto, setAsunto] = useState("");
  const [cuerpoHtml, setCuerpoHtml] = useState("");
  const [cuerpoTexto, setCuerpoTexto] = useState("");

  const [origNombreRemitente, setOrigNombreRemitente] = useState("");
  const [origAsunto, setOrigAsunto] = useState("");
  const [origCuerpoHtml, setOrigCuerpoHtml] = useState("");
  const [origCuerpoTexto, setOrigCuerpoTexto] = useState("");

  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Efecto para sincronizar si cambian los initialSettings
  useEffect(() => {
    if (initialSettings) {
      const parsed = {
        mail_envio: initialSettings.mail_envio || "",
        mail_respuesta: initialSettings.mail_respuesta || "",
        limite_diario: initialSettings.limite_diario || "100",
        mailjet_api_key: initialSettings.mailjet_api_key || "",
        mailjet_secret_key: initialSettings.mailjet_secret_key || "",
      };
      setOriginal(parsed);
      setMailEnvio(parsed.mail_envio);
      setMailRespuesta(parsed.mail_respuesta);
      setLimiteDiario(parsed.limite_diario);
      setMailjetApiKey(parsed.mailjet_api_key);
      setMailjetSecretKey(parsed.mailjet_secret_key);
    }
  }, [initialSettings]);

  // Sincronizar asunto/cuerpo/nombre de la campaña desde localStorage con clave de usuario
  useEffect(() => {
    if (id_usuario) {
      const savedAsunto = localStorage.getItem(`theairoom_${id_usuario}_campaign_asunto`) || "";
      const savedHtml = localStorage.getItem(`theairoom_${id_usuario}_campaign_cuerpo_html`) || "";
      const savedText = localStorage.getItem(`theairoom_${id_usuario}_campaign_cuerpo_texto`) || "";
      const savedName = localStorage.getItem(`theairoom_${id_usuario}_campaign_name`) || "";

      setAsunto(savedAsunto);
      setCuerpoHtml(savedHtml);
      setCuerpoTexto(savedText);
      setNombreRemitente(savedName);

      setOrigAsunto(savedAsunto);
      setOrigCuerpoHtml(savedHtml);
      setOrigCuerpoTexto(savedText);
      setOrigNombreRemitente(savedName);
    }
  }, [id_usuario]);

  // Validar domino gratuito/personal
  const validateCorporateEmail = (email: string): boolean => {
    const trimmed = email.trim().toLowerCase();
    const freeDomains = [
      "gmail.com",
      "hotmail.com",
      "yahoo.com",
      "yahoo.es",
      "outlook.com",
      "outlook.es",
      "icloud.com",
      "live.com",
      "protonmail.com",
      "proton.me"
    ];

    const match = trimmed.match(/@([^@\s]+)$/);
    if (!match) return true; 
    const domain = match[1];

    if (freeDomains.includes(domain)) {
      return false; 
    }
    return true; 
  };

  // Construir el JSON que se enviará en tiempo real para visualizarlo
  const getPayloadPreview = () => {
    const payload: Record<string, any> = { id_usuario };
    let changes = 0;

    if (mailEnvio !== original.mail_envio && mailEnvio.trim() !== "") {
      payload.mail_envio = mailEnvio.trim();
      changes++;
    }
    if (mailRespuesta !== original.mail_respuesta && mailRespuesta.trim() !== "") {
      payload.mail_respuesta = mailRespuesta.trim();
      changes++;
    }
    if (mailjetApiKey !== original.mailjet_api_key && mailjetApiKey.trim() !== "") {
      payload.mailjet_api_key = mailjetApiKey.trim();
      changes++;
    }
    if (mailjetSecretKey !== original.mailjet_secret_key && mailjetSecretKey.trim() !== "") {
      payload.mailjet_secret_key = mailjetSecretKey.trim();
      changes++;
    }
    if (limiteDiario !== original.limite_diario && limiteDiario.trim() !== "") {
      const parsedLim = parseInt(limiteDiario, 10);
      if (!isNaN(parsedLim)) {
        payload.limite_diario = parsedLim;
        changes++;
      }
    }

    // Campos de la campaña actual (Siempre editable por ajustes)
    if (asunto !== origAsunto) {
      payload.asunto = asunto;
      changes++;
    }
    if (cuerpoHtml !== origCuerpoHtml) {
      payload.cuerpo_html = cuerpoHtml;
      changes++;
    }
    if (cuerpoTexto !== origCuerpoTexto) {
      payload.cuerpo_texto = cuerpoTexto;
      changes++;
    }
    if (nombreRemitente !== origNombreRemitente) {
      payload.name = nombreRemitente;
      changes++;
    }

    return { payload, changes };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setFeedback(null);

    // Validación crítica de domino corporativo
    if (mailEnvio && !validateCorporateEmail(mailEnvio)) {
      setValidationError(
        "Regla de Negocio: El 'Correo de Envío' debe utilizar un dominio corporativo propio. No se aceptan correos gratuitos de Gmail, Hotmail ni Outlook."
      );
      return;
    }

    const { payload, changes } = getPayloadPreview();

    if (changes === 0) {
      setFeedback({
        type: "error",
        message: "No se han detectado cambios para guardar."
      });
      return;
    }

    setLoading(true);

    try {
      const response = await saveUserSettings(
        id_usuario,
        {
          mail_envio: mailEnvio,
          mail_respuesta: mailRespuesta,
          limite_diario: limiteDiario,
          mailjet_api_key: mailjetApiKey,
          mailjet_secret_key: mailjetSecretKey,
          asunto: asunto,
          cuerpo_html: cuerpoHtml,
          cuerpo_texto: cuerpoTexto,
          name: nombreRemitente
        },
        {
          mail_envio: original.mail_envio,
          mail_respuesta: original.mail_respuesta,
          limite_diario: original.limite_diario,
          mailjet_api_key: original.mailjet_api_key,
          mailjet_secret_key: original.mailjet_secret_key,
          asunto: origAsunto,
          cuerpo_html: origCuerpoHtml,
          cuerpo_texto: origCuerpoTexto,
          name: origNombreRemitente
        }
      );

      // Actualizar los originales a los nuevos valores confirmados
      const nextOriginal = {
        mail_envio: mailEnvio,
        mail_respuesta: mailRespuesta,
        limite_diario: limiteDiario,
        mailjet_api_key: mailjetApiKey,
        mailjet_secret_key: mailjetSecretKey,
      };
      setOriginal(nextOriginal);

      // Guardar el estado de la campaña modificado en la persistencia local con clave de usuario
      localStorage.setItem(`theairoom_${id_usuario}_campaign_name`, nombreRemitente);
      localStorage.setItem(`theairoom_${id_usuario}_campaign_asunto`, asunto);
      localStorage.setItem(`theairoom_${id_usuario}_campaign_cuerpo_html`, cuerpoHtml);
      localStorage.setItem(`theairoom_${id_usuario}_campaign_cuerpo_texto`, cuerpoTexto);
      setOrigNombreRemitente(nombreRemitente);
      setOrigAsunto(asunto);
      setOrigCuerpoHtml(cuerpoHtml);
      setOrigCuerpoTexto(cuerpoTexto);

      setFeedback({
        type: "success",
        message: response.message || "¡Ajustes del motor y redacción de la campaña guardados correctamente!"
      });

      onSaveSuccess(nextOriginal);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Error al conectar con el servidor central para actualizar los campos."
      });
    } finally {
      setLoading(false);
    }
  };

  const { payload: currentPayload, changes: modifiedCount } = getPayloadPreview();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Formulario de Ajustes */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-sans text-xl font-semibold tracking-tight text-slate-800">
                Configuración del Motor
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Configura tus credenciales, reglas de despacho y el texto de tu campaña actual. Solo se transmitirán las variables alteradas.
              </p>
            </div>
          </div>

          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3"
            >
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">Restricción de Dominio</span>
                {validationError}
              </div>
            </motion.div>
          )}

          {feedback && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mb-6 rounded-xl p-4 text-xs flex items-start gap-3 border ${
                feedback.type === "success"
                  ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                  : "border-amber-100 bg-amber-50 text-amber-800"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold block mb-1">
                  {feedback.type === "success" ? "Operación Completada" : "Atención"}
                </span>
                {feedback.message}
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Correo de Envío (mail_envio)
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@theairoom.com (No gmail/yahoo)"
                  value={mailEnvio}
                  onChange={(e) => setMailEnvio(e.target.value)}
                  className={`w-full rounded-lg border py-2 px-3 text-sm text-slate-800 outline-none transition-all ${
                    mailEnvio && !validateCorporateEmail(mailEnvio)
                      ? "border-rose-400 focus:ring-1 focus:ring-rose-400"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  }`}
                  required
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Debe ser un dominio corporativo. Se denegará el envío desde cuentas gratuitas.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Correo de Respuesta (mail_respuesta)
                </label>
                <input
                  type="email"
                  placeholder="respuestas@tuempresa.com"
                  value={mailRespuesta}
                  onChange={(e) => setMailRespuesta(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Opcional. Dirección a donde se desviarán las respuestas directas de leads.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Límite Diario de Envíos (limite_diario)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="5"
                  max="1000"
                  placeholder="100"
                  value={limiteDiario}
                  onChange={(e) => setLimiteDiario(e.target.value)}
                  className="w-32 rounded-lg border border-slate-200 py-2 px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-500">
                  Recomendado: 100-250 envíos diarios por cuenta para cuidar la reputación.
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                Credenciales de Servidor SMTP (Mailjet API)
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Mailjet API Key (mailjet_api_key)
                  </label>
                  <input
                    type="password"
                    placeholder="Tu Mailjet API Key"
                    value={mailjetApiKey}
                    onChange={(e) => setMailjetApiKey(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Mailjet Secret Key (mailjet_secret_key)
                  </label>
                  <input
                    type="password"
                    placeholder="Tu Mailjet Secret Key"
                    value={mailjetSecretKey}
                    onChange={(e) => setMailjetSecretKey(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Ajuste de Redacción de la Campaña Actual */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  ⭐️ Redacción de la Campaña Actual
                </h3>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded font-sans uppercase">
                  AJUSTES ACTIVOS
                </span>
              </div>

              <div className="space-y-4 font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nombre del Remitente (name)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Diego de The AI Room"
                      value={nombreRemitente}
                      onChange={(e) => setNombreRemitente(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Asunto del Correo (asunto)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Alianza Estratégica con {{empresa}}"
                      value={asunto}
                      onChange={(e) => setAsunto(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-600">
                        Cuerpo del Correo HTML (cuerpo_html)
                      </label>
                      <span className="text-[9px] text-indigo-500 font-mono font-semibold">HTML editor</span>
                    </div>
                    <textarea
                      rows={8}
                      placeholder="<p>Ej: Hola {{nombre}}, nos encantó su empresa {{empresa}}...</p>"
                      value={cuerpoHtml}
                      onChange={(e) => setCuerpoHtml(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-600">
                        Cuerpo para Texto Plano (cuerpo_texto)
                      </label>
                      <span className="text-[9px] text-slate-400 font-mono">Texto plano fallback</span>
                    </div>
                    <textarea
                      rows={8}
                      placeholder="Ej: Hola {{nombre}}, nos encantó su empresa {{empresa}}..."
                      value={cuerpoTexto}
                      onChange={(e) => setCuerpoTexto(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500 flex items-start gap-2 border border-slate-100 font-sans animate-fade-in">
                  <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                  <p>
                    Puedes incluir variables dinámicas:{" "}
                    <code className="text-indigo-600 font-semibold font-mono bg-indigo-50/50 px-1 rounded">{"{{nombre}}"}</code> y{" "}
                    <code className="text-indigo-600 font-semibold font-mono bg-indigo-50/50 px-1 rounded">{"{{empresa}}"}</code>.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-5 font-sans">
              <span className="text-xs font-medium text-slate-500">
                {modifiedCount === 0 
                  ? "Sin modificaciones detectadas" 
                  : `Se enviará(n) exactamente ${modifiedCount} campo(s) editado(s).`
                }
              </span>

              <button
                id="btn_save_settings"
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-500 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

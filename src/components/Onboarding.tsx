/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { loginUser, activateUser } from "../api";
import { 
  Sparkles, 
  Mail, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Info, 
  ExternalLink, 
  Check, 
  AlertCircle,
  HelpCircle,
  LogIn,
  UserPlus
} from "lucide-react";

interface OnboardingProps {
  onRegisterSuccess: (id_usuario: string, email: string, initialSettings?: any) => void;
}

export default function Onboarding({ onRegisterSuccess }: OnboardingProps) {
  // Toggle between Login View and Step-by-Step Registration View
  const [isLogin, setIsLogin] = useState(true);

  // LOGIN SCREEN STATES
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // REGISTRATION / ONBOARDING MULTI-STEP STATES
  const [page, setPage] = useState(1);
  
  // Page 1: Basic credentials
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regAccessCode, setRegAccessCode] = useState("");

  // Page 2: Sending channels
  const [mailEnvio, setMailEnvio] = useState("");
  const [mailRespuesta, setMailRespuesta] = useState("");
  const [limiteDiario, setLimiteDiario] = useState("120");

  // Page 3: Mailjet integrate
  const [mailjetApiKey, setMailjetApiKey] = useState("");
  const [mailjetSecretKey, setMailjetSecretKey] = useState("");

  // General Status for registration
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // HANDLER FOR LOGIN SUBMIT
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    if (!loginEmail || !loginPassword) {
      setLoginError("Por favor, ingresa tu correo y contraseña.");
      setLoginLoading(false);
      return;
    }

    try {
      const response = await loginUser({
        email_login: loginEmail,
        email: loginEmail,
        password: loginPassword,
      });

      if (response && response.id_usuario && !response.error) {
        // Recuperar ajustes previos si los devolvió el webhook
        const settingsFromLogin = {
          mail_envio: (response as any).mail_envio || "",
          mail_respuesta: (response as any).mail_respuesta || "",
          limite_diario: (response as any).limite_diario ? String((response as any).limite_diario) : "120",
          mailjet_api_key: (response as any).mailjet_api_key || "",
          mailjet_secret_key: (response as any).mailjet_secret_key || ""
        };
        const hasSomeSettings = (response as any).mail_envio || (response as any).mailjet_api_key;
        onRegisterSuccess(
          response.id_usuario,
          loginEmail,
          hasSomeSettings ? settingsFromLogin : undefined
        );
      } else if (response && response.error) {
        setLoginError(response.error);
      } else {
        setLoginError("No se pudo iniciar sesión. Verifica tus credenciales.");
      }
    } catch (err: any) {
      setLoginError(
        err.message || "Error al conectar con el webhook del servidor. Inténtalo nuevamente."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // HANDLERS FOR STEP PROGRESSIONS
  const validateAndNextPage = () => {
    setRegError(null);

    if (page === 1) {
      if (!regEmail || !regPassword || !regConfirmPassword || !regAccessCode) {
        setRegError("Por favor, completa todos los campos del Paso 1.");
        return;
      }
      if (regPassword !== regConfirmPassword) {
        setRegError("Las contraseñas ingresadas no coinciden.");
        return;
      }
      setPage(2);
    } else if (page === 2) {
      if (!mailEnvio || !mailRespuesta || !limiteDiario) {
        setRegError("Por favor, completa todos los canales y el límite diario.");
        return;
      }
      const limitVal = parseInt(limiteDiario, 10);
      if (isNaN(limitVal) || limitVal <= 0) {
        setRegError("El límite diario debe ser un número entero válido mayor que 0.");
        return;
      }
      setPage(3);
    }
  };

  const handlePrevPage = () => {
    setRegError(null);
    if (page > 1) {
      setPage(page - 1);
    }
  };

  // HANDLER FOR REGISTRATION FINAL FINISH
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    // Final checks
    if (!mailjetApiKey || !mailjetSecretKey) {
      setRegError("Por favor, ingresa las credenciales de Mailjet antes de finalizar.");
      return;
    }

    setRegLoading(true);

    const fullPayload = {
      email_login: regEmail,
      email: regEmail,
      password: regPassword,
      codigo_acceso: regAccessCode,
      mail_envio: mailEnvio,
      mail_respuesta: mailRespuesta,
      limite_diario: parseInt(limiteDiario, 10),
      mailjet_api_key: mailjetApiKey,
      mailjet_secret_key: mailjetSecretKey
    };

    try {
      const response = await activateUser(fullPayload);

      if (response && response.id_usuario && !response.error) {
        setRegSuccess(true);
        
        // Crear el objeto del usuario
        const settingsToSave = {
          mail_envio: mailEnvio,
          mail_respuesta: mailRespuesta,
          limite_diario: limiteDiario,
          mailjet_api_key: mailjetApiKey,
          mailjet_secret_key: mailjetSecretKey
        };

        setTimeout(() => {
          onRegisterSuccess(response.id_usuario, regEmail, settingsToSave);
        }, 1200);

      } else if (response && response.error) {
        setRegError(response.error);
      } else {
        setRegError("Error del servidor: El webhook no devolvió un éxito confirmado.");
      }
    } catch (err: any) {
      setRegError(
        err.message || "No se pudo conectar con el servidor webhook para activar la cuenta."
      );
    } finally {
      setRegLoading(false);
    }
  };



  return (
    <div className="flex min-h-screen w-full md:flex-row flex-col bg-white">
      
      {/* LEFT PANEL: Branding & Visual context */}
      <div className="flex flex-col justify-between bg-slate-950 p-12 text-white md:w-5/12 shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white text-2xl">
              ⭐️
            </div>
            <div>
              <h1 className="font-sans font-extrabold tracking-tight text-2xl text-white">The AI Room</h1>
              <p className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest leading-none mt-1">Cold Email Engine</p>
            </div>
          </div>

          <div className="pt-12 space-y-8">
            <h2 className="font-sans text-3xl font-medium leading-tight text-slate-100">
              Automatización de correos en frío para equipos B2B premium.
            </h2>
            <p className="text-base leading-relaxed text-slate-300">
              Conecta tu motor de envío, carga tus leads o archivos de contactos, y deja que nuestra pipeline inteligente controle el ritmo de tus correos sin quemar tu dominio.
            </p>
          </div>
        </div>

        <div className="mt-12 space-y-4 border-t border-slate-800 pt-8">
          <div className="flex items-start gap-2.5 text-sm text-slate-400">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-indigo-400 shrink-0" />
            <span>Acceso seguro administrado por servidores de verificación corporativa.</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm text-slate-400">
            <Info className="mt-0.5 h-5 w-5 text-indigo-400 shrink-0" />
            <span>Integración automatizada directa con tu servidor de despacho e infraestructura segura.</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Interactive Forms Context */}
      <div className="flex flex-col justify-center p-12 md:w-7/12 bg-slate-50/50 min-h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-xl space-y-8">
          
          {isLogin ? (
            /* ======================================= */
            /*             PANTALLA DE LOGIN           */
            /* ======================================= */
            <div className="space-y-6">
              <div>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 rounded">
                  Control Acceso - The AI Room
                </span>
                <h3 className="font-sans text-3xl font-bold tracking-tight text-slate-900 mt-2">
                  Iniciar Sesión
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Ingresa tu correo y contraseña corporativa para acceder al motor.
                </p>
              </div>

              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-red-150 bg-red-50 p-3.5 text-xs text-red-700 flex gap-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <div className="font-semibold mb-0.5">Fallo de Autenticación</div>
                    <p className="leading-relaxed">{loginError}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="loginEmail">
                    Correo Corporativo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="loginEmail"
                      type="email"
                      placeholder="ejemplo@tuempresa.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="loginPassword">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="loginPassword"
                      type="password"
                      placeholder="••••••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <button
                  id="btn_login_submit"
                  type="submit"
                  disabled={loginLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-300 cursor-pointer"
                >
                  {loginLoading ? "Verificando accesos..." : "Ingresar al motor"}
                  <LogIn className="h-4 w-4" />
                </button>
              </form>

              <div className="pt-4 border-t border-slate-200 flex flex-col gap-3 text-center">
                <p className="text-xs text-slate-500">
                  ¿Aún no tienes activada tu cuenta corporativa?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setPage(1);
                    }}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Crear cuenta
                  </button>
                </p>


              </div>
            </div>
          ) : (
            /* ======================================= */
            /*    PANTALLA DE REGISTRO MULTI-PASO      */
            /* ======================================= */
            <div className="space-y-6">
              <div>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded">
                  Activación Multietapa
                </span>
                <h3 className="font-sans text-3xl font-bold tracking-tight text-slate-900 mt-2">
                  Crear Cuenta Corporativa
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Define tus datos e integra tus credenciales de envío de campañas.
                </p>
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-between py-1 bg-slate-100/50 rounded-xl px-3 border border-slate-200/40">
                {[1, 2, 3].map((stepNumber) => (
                  <React.Fragment key={stepNumber}>
                    <div className="flex items-center gap-1.5 py-1">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        page === stepNumber 
                          ? "bg-indigo-600 text-white shadow-sm" 
                          : page > stepNumber 
                            ? "bg-emerald-500 text-white" 
                            : "bg-slate-200 text-slate-500"
                      }`}>
                        {page > stepNumber ? <Check className="h-3 w-3" /> : stepNumber}
                      </div>
                      <span className={`text-[10px] font-semibold uppercase tracking-tight ${
                        page === stepNumber ? "text-indigo-600 font-bold" : "text-slate-450"
                      }`}>
                        {stepNumber === 1 && "1. Acceso"}
                        {stepNumber === 2 && "2. Config"}
                        {stepNumber === 3 && "3. Envío"}
                      </span>
                    </div>
                    {stepNumber < 3 && <div className="flex-1 h-px bg-slate-200 mx-2" />}
                  </React.Fragment>
                ))}
              </div>

              {regError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-red-150 bg-red-50 p-3 text-xs text-red-700 flex gap-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <p className="leading-relaxed font-sans">{regError}</p>
                </motion.div>
              )}

              {regSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg border border-emerald-150 bg-emerald-50 p-4 text-center text-sm text-emerald-800"
                >
                  <div className="font-semibold text-emerald-900">¡Cuenta Activada!</div>
                  <p className="mt-1 text-xs">Levantando motores de envío...</p>
                </motion.div>
              )}

              {/* MULTI-PAGE FORM CONTAINER */}
              <div className="space-y-4">
                
                {/* PAGE 1: BASIC REGISTRATION INFO */}
                {page === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="regEmail">
                        Correo Corporativo de Acceso
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          id="regEmail"
                          type="email"
                          placeholder="ejemplo@tuempresa.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="regPassword">
                          Contraseña
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <Lock className="h-4 w-4" />
                          </div>
                          <input
                            id="regPassword"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="regConfirmPassword">
                          Confirmar Contraseña
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <Lock className="h-4 w-4" />
                          </div>
                          <input
                            id="regConfirmPassword"
                            type="password"
                            placeholder="Repite la clave"
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="regAccessCode">
                        Código de Invitación / Acceso
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Sparkles className="h-4 w-4 text-indigo-500" />
                        </div>
                        <input
                          id="regAccessCode"
                          type="text"
                          placeholder="ROOM-INVITE-XXXX"
                          value={regAccessCode}
                          onChange={(e) => setRegAccessCode(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm font-mono text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PAGE 2: CHANNELS & SENDING LIMITS */}
                {page === 2 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="mailEnvio">
                        Mail para hacer Envíos
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          id="mailEnvio"
                          type="email"
                          placeholder="envios@tuempresa.com"
                          value={mailEnvio}
                          onChange={(e) => setMailEnvio(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="mailRespuesta">
                        Mail para recibir Respuestas
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          id="mailRespuesta"
                          type="email"
                          placeholder="respuestas@tuempresa.com"
                          value={mailRespuesta}
                          onChange={(e) => setMailRespuesta(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="limiteDiario">
                          Límite Diario de Correos
                        </label>
                        <span className="text-xs font-semibold text-indigo-600 font-mono select-none">
                          {limiteDiario} envíos
                        </span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <input
                          id="limiteDiarioSlider"
                          type="range"
                          min="10"
                          max="500"
                          step="10"
                          value={limiteDiario}
                          onChange={(e) => setLimiteDiario(e.target.value)}
                          className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <input
                          id="limiteDiario"
                          type="number"
                          value={limiteDiario}
                          onChange={(e) => setLimiteDiario(e.target.value)}
                          className="w-20 rounded-lg border border-slate-200 py-1.5 px-2.5 text-center text-sm font-semibold font-mono text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:indigo-500"
                          required
                        />
                      </div>
                      
                      <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 mt-3 text-[11px] text-indigo-800 leading-relaxed">
                        <span className="font-bold">✨ Editable:</span> Podrás cambiar tu correo emisor, receptor y estos límites más adelante todas las veces que quieras en la pantalla de Ajustes.
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PAGE 3: MAILJET INTEGRATION */}
                {page === 3 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="text-slate-500 font-medium">Introduce tus credenciales SMTP de Mailjet</span>
                      <a
                        href="https://app.mailjet.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-1"
                      >
                        Crear cuenta en Mailjet <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="mailjetApiKey">
                          Mailjet API Key
                        </label>
                        <input
                          id="mailjetApiKey"
                          type="text"
                          placeholder="Tu API Key"
                          value={mailjetApiKey}
                          onChange={(e) => setMailjetApiKey(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-sm font-mono text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="mailjetSecretKey">
                          Mailjet Secret Key
                        </label>
                        <input
                          id="mailjetSecretKey"
                          type="password"
                          placeholder="Tu Secret Key"
                          value={mailjetSecretKey}
                          onChange={(e) => setMailjetSecretKey(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-sm font-mono text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Optimización de Métricas de Reenvío de forma ultra-compacta */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 leading-normal">
                      <div className="font-bold flex items-center gap-1 mb-0.5">
                        💡 Activación de Métricas Recomendada
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Para calcular las respuestas de tus campañas, agrega en tu buzón remitente un reenvío automático a:{" "}
                        <strong className="font-mono bg-amber-100/80 px-1 py-0.5 rounded text-amber-950 select-all">theairoommailreciever@gmail.com</strong>
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-[10px] text-slate-400">
                        ¿Dónde encontrar tus claves? Mailjet &gt; Ajustes de cuenta &gt; API Key Master.
                      </p>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* ACTION NAVIGATION BUTTONS FOR ACCOUNT CREATION */}
              <div className="flex items-center justify-between gap-4 pt-2">
                {page > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    disabled={regLoading}
                    className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-800 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Anterior
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setRegError(null);
                    }}
                    className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-800 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Volver al login
                  </button>
                )}

                {page < 3 ? (
                  <button
                    type="button"
                    onClick={validateAndNextPage}
                    className="px-5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Siguiente
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRegisterSubmit}
                    disabled={regLoading || regSuccess}
                    className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-sm rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:bg-slate-300"
                  >
                    {regLoading ? "Registrando & activando..." : "Finalizar y activar"}
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>



            </div>
          )}

        </div>
      </div>

    </div>
  );
}

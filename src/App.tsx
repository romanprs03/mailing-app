/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Onboarding from "./components/Onboarding";
import Settings from "./components/Settings";
import CampaignsScreen from "./components/CampaignsScreen";
import Dashboard from "./components/Dashboard";
import InfoImportante from "./components/InfoImportante";
import Reenvios from "./components/Reenvios";
import Precios from "./components/Precios";
import GoogleMapsLeads from "./components/GoogleMapsLeads";
import { 
  BarChart3, 
  Settings as SettingsIcon, 
  Send, 
  LogOut, 
  Flame, 
  User, 
  Globe, 
  CheckCircle2, 
  Clock,
  Sparkles,
  HelpCircle,
  RefreshCw,
  DollarSign,
  MapPin
} from "lucide-react";

export default function App() {
  // Global States retrieved from standard client-side localStorage
  const [idUsuario, setIdUsuario] = useState<string | null>(() => {
    return localStorage.getItem("pepper_id_usuario");
  });
  
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem("pepper_user_email");
  });

  const [idCampana, setIdCampana] = useState<string>(() => {
    const uid = localStorage.getItem("pepper_id_usuario");
    if (!uid) return "";
    return localStorage.getItem(`theairoom_${uid}_id_campana`) || "";
  });

  const [currentScreen, setCurrentScreen] = useState<"dashboard" | "campaign" | "settings" | "info" | "onboarding" | "reenvios" | "precios" | "google_maps_leads">(() => {
    const uid = localStorage.getItem("pepper_id_usuario");
    if (!uid) {
      return "onboarding";
    }
    const savedScreen = localStorage.getItem(`theairoom_${uid}_current_screen`);
    return (savedScreen as any) || "dashboard";
  });

  const [userSettings, setUserSettings] = useState(() => {
    const uid = localStorage.getItem("pepper_id_usuario");
    if (!uid) {
      return {
        mail_envio: "",
        mail_respuesta: "",
        limite_diario: "120",
        mailjet_api_key: "",
        mailjet_secret_key: ""
      };
    }
    const saved = localStorage.getItem(`theairoom_${uid}_settings`);
    return saved ? JSON.parse(saved) : {
      mail_envio: "",
      mail_respuesta: "",
      limite_diario: "120",
      mailjet_api_key: "",
      mailjet_secret_key: ""
    };
  });

  // Guardar estado en localStorage para persistencia tolerante a recargas
  useEffect(() => {
    if (idUsuario) {
      localStorage.setItem("pepper_id_usuario", idUsuario);
    } else {
      localStorage.removeItem("pepper_id_usuario");
    }
  }, [idUsuario]);

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem("pepper_user_email", userEmail);
    } else {
      localStorage.removeItem("pepper_user_email");
    }
  }, [userEmail]);

  useEffect(() => {
    if (idUsuario) {
      localStorage.setItem(`theairoom_${idUsuario}_id_campana`, idCampana);
    }
  }, [idCampana, idUsuario]);

  useEffect(() => {
    if (idUsuario) {
      localStorage.setItem(`theairoom_${idUsuario}_current_screen`, currentScreen);
    }
  }, [currentScreen, idUsuario]);

  useEffect(() => {
    if (idUsuario) {
      localStorage.setItem(`theairoom_${idUsuario}_settings`, JSON.stringify(userSettings));
    }
  }, [userSettings, idUsuario]);

  // Manejador del onboarding exitoso
  const handleRegisterSuccess = (newUserId: string, email: string, initialSettings?: any) => {
    setIdUsuario(newUserId);
    setUserEmail(email);
    
    // Cargar o inicializar pantalla y campaña específicas para este usuario recién logueado
    const savedScreen = localStorage.getItem(`theairoom_${newUserId}_current_screen`) || "dashboard";
    setCurrentScreen(savedScreen as any);
    
    const savedCamp = localStorage.getItem(`theairoom_${newUserId}_id_campana`) || "";
    setIdCampana(savedCamp);

    if (initialSettings) {
      setUserSettings(initialSettings);
      localStorage.setItem(`theairoom_${newUserId}_settings`, JSON.stringify(initialSettings));
    } else {
      // Si entra por login común, chequeamos si hay settings guardados en localStorage para este correo
      const savedUserSpecific = localStorage.getItem(`theairoom_${newUserId}_settings`);
      if (savedUserSpecific) {
        const parsed = JSON.parse(savedUserSpecific);
        setUserSettings(parsed);
      } else {
        // Valores por defecto aislados
        setUserSettings({
          mail_envio: "",
          mail_respuesta: "",
          limite_diario: "120",
          mailjet_api_key: "",
          mailjet_secret_key: ""
        });
      }
    }
  };

  const handleSettingsSave = (updated: any) => {
    setUserSettings(updated);
  };

  const handleCampaignCreated = (newCampaignId: string) => {
    setIdCampana(newCampaignId);
    
    // Una vez creada, redirigir al dashboard primario para monitorear rítmicamente
    setCurrentScreen("dashboard");
  };

  const handleLogout = () => {
    // Limpiar claves del login de sesión actual para que no queden cargadas de forma redundante
    localStorage.removeItem("pepper_id_usuario");
    localStorage.removeItem("pepper_user_email");
    
    setIdUsuario(null);
    setUserEmail(null);
    setIdCampana("");
    setCurrentScreen("onboarding");
  };

  return (
    <div id="app_root" className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      
      {!idUsuario ? (
        /* PANTALLA UNIFICADA DE AUTENTICACION / ONBOARDING COMPLETA */
        <Onboarding onRegisterSuccess={handleRegisterSuccess} />
      ) : (
        /* PANTALLA DE CONTROL CON SIDEBAR NAVIGATION (B2B SaaS Layout) */
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* SIDEBAR */}
          <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col justify-between border-r border-slate-800 md:min-h-screen">
            <div className="p-6 space-y-8">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 font-extrabold text-white text-lg relative">
                  <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center text-[10px]">⭐️</div>
                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                </div>
                <div>
                  <h2 className="font-sans font-bold tracking-tight text-white text-lg uppercase">The AI Room</h2>
                  <p className="font-mono text-[8px] text-slate-400 uppercase tracking-widest text-left">COLD EMAIL OUTREACH</p>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1">
                {/* 1. Dashboard */}
                <button
                  id="tab_dashboard"
                  onClick={() => setCurrentScreen("dashboard")}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentScreen === "dashboard"
                      ? "bg-indigo-600 text-white font-medium shadow-sm"
                      : "text-slate-350 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <BarChart3 className="h-4 w-4 shrink-0" />
                  Dashboard General
                </button>

                {/* 2. Campañas */}
                <button
                  id="tab_campaign"
                  onClick={() => setCurrentScreen("campaign")}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentScreen === "campaign"
                      ? "bg-indigo-600 text-white font-medium shadow-sm"
                      : "text-slate-350 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Send className="h-4 w-4 shrink-0" />
                  Campañas
                </button>

                {/* 2.5 Reenvíos */}
                <button
                  id="tab_reenvios"
                  onClick={() => setCurrentScreen("reenvios")}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentScreen === "reenvios"
                      ? "bg-indigo-600 text-white font-medium shadow-sm"
                      : "text-slate-350 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <RefreshCw className="h-4 w-4 shrink-0" />
                  Reenvíos
                </button>

                {/* 2.6 Google Maps Leads */}
                <button
                  id="tab_google_maps_leads"
                  onClick={() => setCurrentScreen("google_maps_leads")}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentScreen === "google_maps_leads"
                      ? "bg-indigo-600 text-white font-medium shadow-sm"
                      : "text-slate-350 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <MapPin className="h-4 w-4 shrink-0" />
                  Google Maps Leads
                </button>

                {/* 3. Ajustes de Cuenta */}
                <button
                  id="tab_settings"
                  onClick={() => setCurrentScreen("settings")}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentScreen === "settings"
                      ? "bg-indigo-600 text-white font-medium shadow-sm"
                      : "text-slate-350 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <SettingsIcon className="h-4 w-4 shrink-0" />
                  Configuración
                </button>

                {/* 4. Información Importante y Guía */}
                <button
                  id="tab_info"
                  onClick={() => setCurrentScreen("info")}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentScreen === "info"
                      ? "bg-indigo-600 text-white font-medium shadow-sm"
                      : "text-slate-350 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <HelpCircle className="h-4 w-4 shrink-0" />
                  Guía e Información
                </button>

                {/* 5. Precios */}
                <button
                  id="tab_precios"
                  onClick={() => setCurrentScreen("precios")}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentScreen === "precios"
                      ? "bg-indigo-600 text-white font-medium shadow-sm"
                      : "text-slate-350 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <DollarSign className="h-4 w-4 shrink-0" />
                  Precios
                </button>
              </nav>
            </div>

            {/* Bottom info section: User Profile Badge */}
            <div className="p-4 border-t border-slate-800 space-y-4">
              <div className="rounded-lg bg-slate-800/50 p-3.5 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-slate-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate" title={userEmail || "Operador de Cuenta"}>
                      {userEmail || "Operador de Cuenta"}
                    </p>
                    <p className="text-[10px] text-emerald-400 truncate">
                      Suscripción Activa
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-semibold uppercase tracking-wider bg-slate-800 px-2 py-1 rounded">
                  <Globe className="h-3 w-3" />
                  Estrategia B2B
                </div>
              </div>

              {/* Cerrar Sesión */}
              <button
                id="btn_logout"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-all cursor-pointer text-center"
              >
                <LogOut className="h-3.5 w-3.5" />
                Cerrar Sesión
              </button>
            </div>
          </aside>

          {/* MAIN CONTAINER */}
          <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
            {/* Header section with indicators */}
            <header className="h-16 bg-white border-b border-slate-250 px-8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold text-slate-900">
                  {currentScreen === "dashboard" && "Dashboard General"}
                  {currentScreen === "campaign" && "Campañas"}
                  {currentScreen === "reenvios" && "Campaña de Reenvío"}
                  {currentScreen === "google_maps_leads" && "Google Maps Leads"}
                  {currentScreen === "settings" && "Configuración"}
                  {currentScreen === "info" && "Guía e Información"}
                  {currentScreen === "precios" && "Precios"}
                </h1>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Estado del Motor</p>
                  <p className="text-xs font-semibold text-emerald-600">Procesando Canales</p>
                </div>
                <button
                  onClick={() => setCurrentScreen("campaign")}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-700 cursor-pointer"
                >
                  Nueva Campaña
                </button>
              </div>
            </header>

            {/* SCREEN RENDERER */}
            <div id="screen_viewport" className="flex-1 p-8 overflow-y-auto">
              <AnimatePresence mode="wait">
                {currentScreen === "dashboard" && (
                  <motion.div
                    key="dashboard-screen"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Dashboard 
                      id_usuario={idUsuario} 
                    />
                  </motion.div>
                )}

                {currentScreen === "campaign" && (
                  <motion.div
                    key="campaign-screen"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.18 }}
                  >
                    <CampaignsScreen
                      id_usuario={idUsuario}
                      onCampaignCreated={handleCampaignCreated}
                    />
                  </motion.div>
                )}

                {currentScreen === "reenvios" && (
                  <motion.div
                    key="reenvios-screen"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Reenvios 
                      id_usuario={idUsuario} 
                    />
                  </motion.div>
                )}

                {currentScreen === "settings" && (
                  <motion.div
                    key="settings-screen"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Settings 
                      id_usuario={idUsuario} 
                      initialSettings={userSettings}
                      onSaveSuccess={handleSettingsSave} 
                    />
                  </motion.div>
                )}

                {currentScreen === "info" && (
                  <motion.div
                    key="info-screen"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.18 }}
                  >
                    <InfoImportante />
                  </motion.div>
                )}

                {currentScreen === "precios" && (
                  <motion.div
                    key="precios-screen"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Precios />
                  </motion.div>
                )}

                {currentScreen === "google_maps_leads" && (
                  <motion.div
                    key="google-maps-leads-screen"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.18 }}
                  >
                    <GoogleMapsLeads id_usuario={idUsuario!} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

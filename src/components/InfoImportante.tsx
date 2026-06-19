import React from "react";
import { 
  BookOpen, 
  Info, 
  Scale, 
  Sparkles, 
  MailCheck, 
  ShieldAlert, 
  DollarSign, 
  AlertOctagon,
  HelpCircle,
  ArrowRight,
  Shield,
  Layers,
  Settings as SettingsIcon,
  Send,
  History,
  RefreshCw
} from "lucide-react";

export default function InfoImportante() {
  return (
    <div className="space-y-8 pb-12">
      {/* 1. SECCIÓN: ¿CÓMO FUNCIONA? */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-sans text-md font-bold text-slate-800 uppercase tracking-tight">
              ¿Cómo funciona la plataforma?
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Entiende el flujo de operaciones, la gestión de campañas y el motor inteligente de The AI Room.
            </p>
          </div>
        </div>

        {/* Flujo Visual */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Paso A */}
          <div className="relative p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
            <span className="absolute top-4 right-4 text-xs font-mono font-bold text-slate-300">FASE 01</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-750">
              <SettingsIcon className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-extrabold text-slate-850 uppercase tracking-wide font-sans">
              1. Enlace de Credenciales y Plantilla
            </h4>
            <p className="text-[11px] text-slate-650 leading-relaxed font-sans">
              Todo comienza en la pestaña de <strong>Configuración</strong>. Aquí enlazas los correos de despacho y de respuesta, configuras tus límites de volumen diario y proporcionas tus llaves API de Mailjet. Además, redactas el <strong>Asunto</strong> y el <strong>Cuerpo del Correo</strong> usando nuestras variables inteligentes.
            </p>
          </div>

          {/* Paso B */}
          <div className="relative p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
            <span className="absolute top-4 right-4 text-xs font-mono font-bold text-slate-300">FASE 02</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-750">
              <Send className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-extrabold text-slate-855 uppercase tracking-wide font-sans">
              2. Creación e Inyección de Campaña
            </h4>
            <p className="text-[11px] text-slate-651 leading-relaxed font-sans">
              Al dirigirte a <strong>Nueva Campaña</strong>, el sistema te pedirá definir el nombre identificativo e insertar los destinatarios. Los métodos admitidos de inserción son exclusivamente mediante una <strong>planilla</strong> (archivo `.csv` / `.xlsx` local) o proporcionando una <strong>URL de LinkedIn Sales Navigator</strong>. Esta inyección vincula tus plantillas y automatiza la programación de envíos.
            </p>
          </div>

          {/* Paso C */}
          <div className="relative p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
            <span className="absolute top-4 right-4 text-xs font-mono font-bold text-slate-300">FASE 03</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-750">
              <History className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-extrabold text-slate-855 uppercase tracking-wide font-sans">
              3. Monitoreo y Campañas Anteriores
            </h4>
            <p className="text-[11px] text-slate-652 leading-relaxed font-sans">
              Desde el <strong>Dashboard General</strong> puedes auditar en tiempo real el progreso de los envíos (Pendientes, Enviados, Respondidos, Rebotados, No Encontrados). Al presionar el botón <strong>Cargar campañas anteriores</strong>, la plataforma se conecta al historial consultando tus lotes previos inactivos en formato simplificado para análisis históricos.
            </p>
          </div>

          {/* Paso D */}
          <div className="relative p-5 rounded-2xl border border-slate-100 bg-indigo-50/40 space-y-3">
            <span className="absolute top-4 right-4 text-xs font-mono font-bold text-indigo-300">FASE 04</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <RefreshCw className="h-4 w-4 animate-pulse" />
            </div>
            <h4 className="text-xs font-extrabold text-slate-855 uppercase tracking-wide font-sans">
              4. Campaña de Reenvío Inteligente
            </h4>
            <p className="text-[11px] text-slate-652 leading-relaxed font-sans">
              Localiza leads a los que se les envió correo por última vez hace cierta cantidad de días. Puedes buscar dentro del listado filtrado por nombre, empresa o email, navegar con paginación optimizada y seleccionar los destinatarios de forma rápida e interactiva.
            </p>
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN: INFORMACIÓN IMPORTANTE (CONSEJOS DE ENTREGABILIDAD) */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-sans text-md font-bold text-slate-800 uppercase tracking-tight">
              Información Importante de Envío (Entregabilidad)
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Prácticas obligatorias y recomendadas por expertos para asegurar que tus correos ingresen directamente a la bandeja de entrada.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Límite diario y prioridad de colas */}
          <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/60 md:col-span-2 space-y-2">
            <div className="flex items-center gap-2 text-slate-805">
              <Layers className="h-5 w-5 text-indigo-600 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-sans text-indigo-950">Restricción de Cuota Diaria y Prioridad en Cola</h4>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed font-sans">
              El límite diario de envíos (volumen de despacho configurado) es una <strong>restricción aplicable a nivel de toda la cuenta de usuario</strong>. Esto significa que si tienes múltiples campañas activas de manera simultánea, el sistema enviará los correos de estas en orden cronológico de creación (priorizando la más antigua) hasta que se <strong>cumpla la cuota diaria global configurada</strong>, o bien hasta que <strong>se agoten los leads con envíos pendientes</strong> en esa jornada.
            </p>
          </div>

          {/* Card: Alias para los envíos */}
          <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-800">
              <Sparkles className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider font-sans">¿Por qué conviene usar un Alias?</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
              Configurar un <strong>alias de correo</strong> para tus prospecciones frías te permite resguardar la reputación de tu correo corporativo principal. Si ejecutas campañas desde tu dirección primaria y varios destinatarios te marcan como spam, todo tu dominio comercial podría caer en lista negra, afectando las tareas administrativas internas cotidianas de tu negocio. Un alias actúa como escudo aislante.
            </p>
          </div>

          {/* Card: Envíos diarios moderados */}
          <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-800">
              <MailCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider font-sans">Envíos diarios moderados (menos de 100)</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
              Enviar masivamente cientos de correos de golpe activa de inmediato las alarmas de seguridad de Google y Microsoft (filtros antispam). Es altamente aconsejable programar <strong>pocos envíos diarios (siempre por debajo de 100)</strong>, con una recomendación de oro situada <strong>entre los 10 y los 40 envíos al día</strong> por cuenta de correo. Esto asemeja un flujo natural humano.
            </p>
          </div>

          {/* Card: Cómo evitar el spam */}
          <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-800">
              <ShieldAlert className="h-4.5 w-4.5 text-rose-500 shrink-0" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider font-sans">Cómo evitar caer en la bandeja de Spam</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
              1) Redacta textos sencillos, naturales y directos, sin usar palabras marcadas ("gratis", "ganar dólares", "promoción", "compra ahora"). <br />
              2) Utiliza siempre variables dinámicas, como <code>{"{{nombre}}"}</code> y <code>{"{{empresa}}"}</code>, para que cada mensaje sea diferente del anterior. <br />
              3) Valida que tu dominio tenga configurados los registros <strong>SPF, DKIM y DMARC</strong> de manera impecable en tu proveedor de hosting.
            </p>
          </div>

          {/* Card: Abaratar costos Zilvo */}
          <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-800">
              <DollarSign className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider font-sans">¿Cómo abaratar costos del sistema?</h4>
            </div>
            <p className="text-[11px] text-slate-650 leading-relaxed font-sans">
              El costo de enriquecer leads y buscar correos comerciales puede ser elevado. Si quieres utilizar la plataforma en un <strong>formato gratuito (Modo Free)</strong>, puedes hacerlo descargando de forma local tus propios datos. Utiliza la extensión de Google Chrome <strong>Zilvo</strong> para extraer tus búsquedas completas de LinkedIn Sales Navigator. Si aportas tus propios leads con correos ya verificados, la plataforma funciona libre de cargos extra.
            </p>
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN: LEGAL Y CUMPLIMIENTO */}
      <div className="rounded-2xl border border-rose-100 bg-rose-50/20 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-650">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-sans text-md font-bold text-slate-800 uppercase tracking-tight">
              Normativa Legal y Consentimiento de Envío
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Términos de uso responsable, legislación de privacidad comercial e indemnidades (Estilo Brevo).
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-700 bg-white/70 border border-rose-100/40 p-5 rounded-xl space-y-4 leading-relaxed font-sans">
          <p>
            Al utilizar los servicios de despacho integrados de <strong>The AI Room</strong>, entras en un acuerdo contractual de adherencia regulatoria obligatoria similar a las directrices de plataformas de envíos masivos profesionales como Brevo o Mailchimp:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-1.5">
              <h5 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">Bases de datos verificadas</h5>
              <p className="text-[10px] text-slate-550">
                Garantizas bajo juramento que todos los correos cargados en esta plataforma han sido validados previamente, cuentan con consentimiento implícito o explícito de prospección comercial B2B, y provienen de fuentes autorizadas. Se rechaza drásticamente la carga de listados comprados o falsificados.
              </p>
            </div>

            <div className="space-y-1.5">
              <h5 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">Uso bajo tu propio riesgo</h5>
              <p className="text-[10px] text-slate-550">
                La plataforma actúa exclusivamente como un gestor de cola tecnológico. En ningún caso nos hacemos responsables ante demandas locales de privacidad, quejas de destinatarios, penalizaciones por parte de tu proveedor de correo (ej: Mailjet/Google Core), ni pérdida de reputación comercial. Toda la responsabilidad corre de tu parte.
              </p>
            </div>

            <div className="space-y-1.5">
              <h5 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">Opción de exclusión activa</h5>
              <p className="text-[10px] text-slate-550">
                Estás legalmente obligado a cumplir con las normativas sobre desuscripción (como el acta CAN-SPAM o la RGPD). Debes suministrar en tus redactados un enlace de exclusión o una frase explicativa clara que permita al lead indicar "No deseo recibir más correos" y eliminarlo de inmediato de tus listas.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-rose-50 border border-rose-100/80 p-3.5 flex items-center gap-2.5 text-[10px] text-rose-800 font-semibold uppercase tracking-tight">
            <AlertOctagon className="h-4.5 w-4.5 text-rose-650 shrink-0" />
            <span>Al inyectar leads y guardar configuraciones, declaras aceptar estos términos bajo tu única responsabilidad.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

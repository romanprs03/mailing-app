/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  OnboardingPayload,
  OnboardingResponse,
  AjustesPayload,
  CampañaPayload,
  CampañaResponse,
  MetricasResponse
} from "./types";

const REGISTER_WEBHOOK = "https://romanparisi.online/webhook/9183ccb1-3a4d-49c9-a611-3efb7d426b15";
const SETTINGS_WEBHOOK = "https://romanparisi.online/webhook/7061c1eb-b9b9-4161-91f9-1146b1d44982";
const CAMPAIGN_WEBHOOK = "https://romanparisi.online/webhook/3eb1d6ac-4e8b-4c7a-9c22-ff42215b7f3f";
const METRICS_WEBHOOK = "https://romanparisi.online/webhook/786471ae-93fe-456c-899e-9bd55ce88024";
const UPDATE_CAMPAIGN_WEBHOOK = "https://romanparisi.online/webhook/d69922ab-44c4-457e-b2ed-9823cd539695";

/**
 * Envía credenciales de login al webhook
 */
export async function loginUser(payload: { email_login: string; email?: string; password?: string }): Promise<OnboardingResponse> {
  const response = await fetch(REGISTER_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, request: "login" }),
  });

  if (!response.ok) {
    throw new Error(`Error en el servidor: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as OnboardingResponse;
}

/**
 * Registra a un nuevo usuario bajo invitación con toda la información recaudada
 */
export async function activateUser(payload: {
  email_login: string;
  email?: string;
  password?: string;
  codigo_acceso: string;
  mail_envio: string;
  mail_respuesta: string;
  limite_diario: number;
  mailjet_api_key: string;
  mailjet_secret_key: string;
}): Promise<OnboardingResponse> {
  const response = await fetch(REGISTER_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, request: "registro" }),
  });

  if (!response.ok) {
    throw new Error(`Error en el servidor: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as OnboardingResponse;
}

/**
 * Registra a un nuevo usuario bajo invitación (Retrocompatible)
 */
export async function registerUser(payload: OnboardingPayload): Promise<OnboardingResponse> {
  const response = await fetch(REGISTER_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error en el servidor: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as OnboardingResponse;
}

/**
 * Guarda los ajustes modificados del motor de envío.
 * Siguiendo la regla crítica: solo envía las llaves modificadas.
 */
export async function saveUserSettings(
  id_usuario: string,
  allFields: {
    mail_envio: string;
    mail_respuesta: string;
    limite_diario: string;
    mailjet_api_key: string;
    mailjet_secret_key: string;
    id_campana?: string;
    asunto?: string;
    cuerpo_html?: string;
    cuerpo_texto?: string;
    name?: string;
  },
  originalFields: {
    mail_envio: string;
    mail_respuesta: string;
    limite_diario: string;
    mailjet_api_key: string;
    mailjet_secret_key: string;
    id_campana?: string;
    asunto?: string;
    cuerpo_html?: string;
    cuerpo_texto?: string;
    name?: string;
  }
): Promise<any> {
  const payload: Record<string, any> = { id_usuario };
  let modifiedCount = 0;

  // Comparar con los valores originales/anteriores y añadir solo los cambiados
  const keys = [
    "mail_envio",
    "mail_respuesta",
    "mailjet_api_key",
    "mailjet_secret_key"
  ] as const;

  for (const key of keys) {
    if (allFields[key] !== originalFields[key] && allFields[key].trim() !== "") {
      payload[key] = allFields[key].trim();
      modifiedCount++;
    }
  }

  // Comparar campos de la campaña si están presentes
  const campaignKeys = ["asunto", "cuerpo_html", "cuerpo_texto"] as const;
  for (const key of campaignKeys) {
    const val = allFields[key];
    const orig = originalFields[key];
    if (val !== undefined && orig !== undefined && val !== orig) {
      payload[key] = val;
      modifiedCount++;
    }
  }

  // Comparar nombre del remitente si está presente
  if (allFields.name !== undefined && originalFields.name !== undefined && allFields.name !== originalFields.name) {
    payload.name = allFields.name;
    modifiedCount++;
  }

  // limite_diario se maneja de forma numérica
  if (allFields.limite_diario !== originalFields.limite_diario && allFields.limite_diario.trim() !== "") {
    const limNum = parseInt(allFields.limite_diario, 10);
    if (!isNaN(limNum)) {
      payload.limite_diario = limNum;
      modifiedCount++;
    }
  }

  if (modifiedCount === 0) {
    return { success: true, message: "No se detectaron cambios a guardar." };
  }

  // Si se modificó algo y hay campaña, incluimos ID de campaña
  if (allFields.id_campana) {
    payload.id_campana = allFields.id_campana;
  }

  const response = await fetch(SETTINGS_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error al guardar configuración: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Crea una nueva campaña. Maneja tanto multipart/form-data (si hay archivo binario)
 * como JSON (si es URL de LinkedIn).
 */
export async function createCampaign(
  id_usuario: string,
  asunto: string,
  cuerpo_html: string | undefined,
  cuerpo_texto: string | undefined,
  leadsSource: "linkedin" | "file",
  url_linkedin?: string,
  archivo?: File,
  nombre_remitente?: string,
  campaign_name?: string
): Promise<CampañaResponse> {
  if (leadsSource === "file" && archivo) {
    // Si se sube un archivo, enviamos multipart/form-data
    const formData = new FormData();
    formData.append("id_usuario", id_usuario);
    formData.append("asunto", asunto);
    if (cuerpo_html && cuerpo_html.trim() !== "") {
      formData.append("cuerpo_html", cuerpo_html);
    }
    if (cuerpo_texto && cuerpo_texto.trim() !== "") {
      formData.append("cuerpo_texto", cuerpo_texto);
    }
    formData.append("archivo", archivo);
    if (nombre_remitente) {
      formData.append("name", nombre_remitente);
    }
    if (campaign_name) {
      formData.append("campaign_name", campaign_name);
    }

    const response = await fetch(CAMPAIGN_WEBHOOK, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error al crear campaña con archivo: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { id_campana: data.id_campana, success: true, message: "Campaña creada con éxito." };
  } else {
    // Si es una URL de LinkedIn, enviamos un JSON plano
    const payload: Record<string, any> = {
      id_usuario,
      asunto,
    };

    if (cuerpo_html && cuerpo_html.trim() !== "") {
      payload.cuerpo_html = cuerpo_html;
    }
    if (cuerpo_texto && cuerpo_texto.trim() !== "") {
      payload.cuerpo_texto = cuerpo_texto;
    }

    if (url_linkedin) {
      payload.url_linkedin = url_linkedin;
    }
    if (nombre_remitente) {
      payload.name = nombre_remitente;
    }
    if (campaign_name) {
      payload.campaign_name = campaign_name;
    }

    const response = await fetch(CAMPAIGN_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error al crear campaña con URL: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { id_campana: data.id_campana, success: true, message: "Campaña creada con éxito." };
  }
}

/**
 * Recupera las métricas de la campaña activa para el usuario dado
 */
export async function fetchCampaignMetrics(id_usuario: string, id_campana: string): Promise<MetricasResponse> {
  const response = await fetch(METRICS_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id_usuario, id_campana }),
  });

  if (!response.ok) {
    throw new Error(`Error al recuperar métricas: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as MetricasResponse;
}

/**
 * Actualiza una campaña existente. El backend identifica la campaña por `campaign_name`.
 * Envía los campos de redacción al webhook de update; los campos vacíos se omiten.
 */
export async function updateCampaign(
  id_campana: string,
  id_usuario: string,
  campaign_name: string,
  asunto: string,
  cuerpo_html: string,
  cuerpo_texto: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const payload: Record<string, any> = {
    id_usuario,
    campaign_name
  };

  if (asunto.trim() !== "") {
    payload.asunto = asunto;
  }
  if (cuerpo_html.trim() !== "") {
    payload.cuerpo_html = cuerpo_html;
  }
  if (cuerpo_texto.trim() !== "") {
    payload.cuerpo_texto = cuerpo_texto;
  }

  const response = await fetch(UPDATE_CAMPAIGN_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error al actualizar campaña: ${response.status} ${response.statusText}`);
  }

  try {
    const data = await response.json();
    return data as { success: boolean; message?: string; error?: string };
  } catch {
    return { success: true };
  }
}

/**
 * Recupera las campañas anteriores de un usuario
 */
export async function fetchPreviousCampaigns(id_usuario: string): Promise<any[]> {
  const response = await fetch("https://romanparisi.online/webhook/a0bacf19-137e-42f8-95b3-396bccf1882a", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id_usuario }),
  });

  if (!response.ok) {
    throw new Error(`Error al recuperar campañas anteriores: ${response.status}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    return data;
  } else if (data && typeof data === "object") {
    if (Array.isArray(data.campaigns)) {
      return data.campaigns;
    } else if (Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data.items)) {
      return data.items;
    }
  }
  return [];
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OnboardingPayload {
  email_login: string;
  password?: string;
  codigo_acceso: string;
}

export interface OnboardingResponse {
  id_usuario: string;
  error?: string;
  message?: string;
}

export interface AjustesPayload {
  id_usuario: string;
  mail_envio?: string;
  mail_respuesta?: string;
  limite_diario?: number;
  mailjet_api_key?: string;
  mailjet_secret_key?: string;
}

export interface AjustesResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface CampañaPayload {
  id_usuario: string;
  asunto: string;
  cuerpo_html: string;
  cuerpo_texto: string;
  url_linkedin?: string;
  archivo?: File;
}

export interface CampañaResponse {
  id_campana?: string;
  success: boolean;
  message?: string;
  error?: string;
}

export interface MetricQueryPayload {
  id_usuario: string;
  id_campana: string;
}

export interface MetricasResponse {
  Pendiente?: number;
  Enviado?: number;
  Respondido?: number;
  Rebotado?: number;
  "No encontrado"?: number;
  campaign_name?: string;
  [key: string]: any;
}

export interface UpdateCampaignPayload {
  id_usuario: string;
  campaign_name: string;
  asunto: string;
  cuerpo_html: string;
  cuerpo_texto: string;
}

export interface CampanaAnterior {
  id_campana?: string;
  campaign_name?: string;
  nombre_campana?: string;
  asunto?: string;
  Pendiente?: number;
  Enviado?: number;
  Respondido?: number;
  Rebotado?: number;
  "No encontrado"?: number;
  [key: string]: any;
}

export interface UserSession {
  id_usuario: string;
  email: string;
  id_campana?: string;
  mail_envio?: string;
  mail_respuesta?: string;
  limite_diario?: number;
}

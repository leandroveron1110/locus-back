// lib/resendService.ts
import { Resend } from "resend";

// Inicializa Resend usando la API Key
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string | string[]; // Destinatario(s)
  businessName: string; // Nombre del negocio para el remitente
  subject: string; // Asunto del correo
  html: string; // Contenido HTML del correo
  text?: string; // Opcional: texto plano
}

/**
 * Envía un correo electrónico usando Resend.
 * Totalmente personalizable: asunto, remitente y contenido HTML.
 */
export async function sendCustomEmail({
  to,
  businessName,
  subject,
  html,
  text,
}: SendEmailParams) {
  const fromEmail = process.env.FROM_EMAIL;
  if (!fromEmail) {
    console.error("FROM_EMAIL no está configurado en las variables de entorno.");
    return { success: false, error: "Configuración de remitente faltante." };
  }

  try {
    const response = await resend.emails.send({
      from: `${businessName} <${fromEmail}>`,
      to,
      subject,
      html,
      text,
    });

    console.log("Correo enviado con éxito (Resend). ID:", response.data?.id);
    return { success: true, id: response.data?.id };
  } catch (error) {
    console.error("Error al enviar correo con Resend:", error);
    return { success: false, error: (error as Error).message || "Error desconocido." };
  }
}
